const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const checkFeature = require('../middlewares/checkFeature');

// ✅ Middleware pour vérifier que l'utilisateur est connecté
function isLoggedIn(req, res, next) {
  if (!req.session?.user?.email) {
    return res.status(401).json({ error: 'Non connecté' });
  }
  next();
}

// ✅ Applique le feature toggle "wallet" et vérifie la connexion
router.use(checkFeature('wallet'), isLoggedIn);

/* ======= PAGES HTML ======= */
// 🔻 Page retrait
router.get('/withdraw', walletController.renderWithdrawPage);

// 📜 Page historique
router.get('/history', walletController.renderHistoryPage);

// Page Deposit
router.get('/deposit', walletController.renderDepositPage);

/* ======= API JSON ======= */

// ➕ Dépôt
router.post('/deposit', checkFeature('wallet_deposit'), walletController.handleDeposit);

// ➖ Retrait
router.post('/withdraw', checkFeature('wallet_withdraw'), walletController.handleWithdraw);

// 📊 Historique JSON
router.get('/api/history', checkFeature('wallet_history'), walletController.apiGetHistory);

// Attribuer une adresse 
router.get('/address/:currency', walletController.getAddress);

module.exports = router;
