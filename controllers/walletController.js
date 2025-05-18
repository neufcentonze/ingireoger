const walletService = require('../services/walletService');
const db = require('../db');
// 🟢 Affiche la page de dépôt (anciennement "wallet page")

exports.renderDepositPage = (req, res) => {
  const email = req.session?.user?.email;

  if (!email) {
    return res.render('portefeuille/deposit', {
      layout: 'layouts/front-layout',
      isLoggedIn: false,
      title: 'Déposer',
      userBalance: "0.00000000",
      showFooter: false,
      balances: {
        btc: "0.00000000",
        eth: "0.00000000",
        sol: "0.00000000",
        ltc: "0.00000000"
      }
    });
  }

  db.get("SELECT * FROM solde WHERE email = ?", [email], (err, row) => {
    if (err || !row) {
      return res.render('portefeuille/deposit', {
        layout: 'layouts/front-layout',
        isLoggedIn: true,
        title: 'Déposer',
        userBalance: "0.00000000",
        showFooter: false,
        balances: {
          btc: "0.00000000",
          eth: "0.00000000",
          sol: "0.00000000",
          ltc: "0.00000000"
        }
      });
    }

    const balances = {
      btc: parseFloat(row.btc || 0).toFixed(8),
      eth: parseFloat(row.eth || 0).toFixed(8),
      sol: parseFloat(row.sol || 0).toFixed(8),
      ltc: parseFloat(row.ltc || 0).toFixed(8)
    };

    res.render('portefeuille/deposit', {
      layout: 'layouts/front-layout',
      isLoggedIn: true,
      title: 'Déposer',
      userBalance: balances.btc,
      balances,
      showFooter: false,
    });
  });
};

exports.renderWithdrawPage = (req, res) => {
  res.render('portefeuille/withdraw', {
    layout: 'layouts/front-layout',
    isLoggedIn: true,
    title: 'Retrait'
  });
};

exports.renderHistoryPage = (req, res) => {
  res.render('portefeuille/history', {
    layout: 'layouts/front-layout',
    isLoggedIn: true,
    title: 'Historique des transactions'
  });
};

exports.handleDeposit = (req, res) => {
  const email = req.session?.user?.email;
  const { currency, amount } = req.body;
  const floatAmount = parseFloat(amount);

  if (!currency || isNaN(floatAmount) || floatAmount <= 0) {
    return res.status(400).json({ error: 'Requête invalide' });
  }

  walletService.deposit(email, currency, floatAmount, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Dépôt effectué' });
  });
};

exports.handleWithdraw = (req, res) => {
  const email = req.session?.user?.email;
  const { currency, amount, address } = req.body;
  const floatAmount = parseFloat(amount);

  if (!currency || isNaN(floatAmount) || floatAmount <= 0 || !address) {
    return res.status(400).json({ error: 'Requête invalide' });
  }

  walletService.withdraw(email, currency, floatAmount, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true, message: 'Retrait en cours de traitement' });
  });
};

exports.apiGetHistory = (req, res) => {
  const email = req.session?.user?.email;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const types = req.query.type ? req.query.type.split(',') : [];

  walletService.getHistory(email, types, limit, offset, (err, transactions) => {
    if (err) return res.status(500).json({ error: 'Erreur chargement historique' });
    res.json({ transactions });
  });
};


exports.getAddress = async (req, res) => {
  console.log("📦 Session:", req.session); // 👈 ajoute ça
  const email = req.session?.user?.email;
  const currency = req.params.currency.toLowerCase();

  if (!email) {
    return res.status(401).json({ success: false, error: "Utilisateur non connecté." });
  }

  try {
    const result = await walletService.getOrAssignAddress(email, currency, req.ip);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};