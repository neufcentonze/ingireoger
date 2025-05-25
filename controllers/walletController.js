const walletService = require('../services/walletService');
const db = require('../db/index');;
const renderWithUserData = require('../utils/renderWithUserData'); // rappel vr passer balance / footer / info ...

exports.renderWithdrawPage = (req, res) => {
  renderWithUserData(req, res, 'portefeuille/withdraw', {
    title: 'Retrait',
    layout: 'layouts/front-layout'
  });
};

exports.renderHistoryPage = (req, res) => {
  renderWithUserData(req, res, 'portefeuille/history', {
    title: 'Historique des transactions',
    layout: 'layouts/front-layout'
  });
};

exports.renderDepositPage = (req, res) => {
  renderWithUserData(req, res, 'portefeuille/deposit', {
    title: 'Déposer',
    layout: 'layouts/front-layout'
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

  const allowedTypes = ['depot', 'withdrawal'];

  walletService.getHistory(email, allowedTypes, limit, offset, (err, transactions, total) => {
    if (err) return res.status(500).json({ error: 'Erreur chargement historique' });

    res.json({
      transactions,
      total
    });
  });
};


exports.getAddress = async (req, res) => {
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

exports.getUserBalance = (req, res) => {
  const email = req.session?.user?.email;

  if (!email) {
    return res.status(401).json({ error: 'Non connecté.' });
  }

  const crypto = req.query.crypto || 'btc';

  const sql = `SELECT ${crypto} FROM solde WHERE email = ? LIMIT 1`;
  db.get(sql, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erreur SQL' });

    const amount = parseFloat(row?.[crypto] || 0).toFixed(8);
    const rate = require('../utils/cryptoRates').getRate(crypto);
    const amountEur = (amount * rate).toFixed(2);

    res.json({ success: true, amount, amountEur });
  });
};