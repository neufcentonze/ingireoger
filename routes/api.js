const express = require('express');
const router = express.Router();
const roundIfNeeded = require('../utils/roundIfNeeded');
const db = require('../db'); // Connexion SQLite
const { convertToEur } = require('../utils/cryptoRates');

// 👇 AJOUT : brancher les routes /wallet
const walletRoutes = require('./wallet');
router.use('/wallet', walletRoutes); // Résultat : /api/wallet/address/:currency

function formatAmount(value) {
    return parseFloat(value || 0).toFixed(8);
}

const allowedCryptos = ['btc', 'eth', 'sol', 'ltc'];

router.get('/cryptoDetail', (req, res) => {
    const email = req.session?.user?.email;
    const crypto = req.query.crypto?.toLowerCase();

    if (!allowedCryptos.includes(crypto)) {
        return res.status(400).json({ error: 'Crypto non supportée.' });
    }

    if (!email) {
        return res.json({
            total: '0.00000000',
            totalEur: '0.00',
            solde: '0.00000000',
            soldeEur: '0.00',
            bonus: '0.00000000',
            bonusEur: '0.00'
        });
    }

    const soldeSQL = `SELECT ${crypto} FROM solde WHERE email = ? LIMIT 1`;
    db.get(soldeSQL, [email], (err, row) => {
        if (err) {
            console.error('Erreur SQL solde:', err);
            return res.status(500).json({ error: 'Erreur SQL solde' });
        }

        const total = parseFloat(row?.[crypto] || 0); // total stocké dans DB

        const bonusSQL = `
            SELECT SUM(amount) as bonus
            FROM bonuses
            WHERE email = ? AND currency = ? AND status = 'active'
        `;
        db.get(bonusSQL, [email, crypto], (err2, bonusRow) => {
            if (err2) {
                console.error('Erreur SQL bonus:', err2);
                return res.status(500).json({ error: 'Erreur SQL bonus' });
            }

            const bonus = parseFloat(bonusRow?.bonus || 0);
            const soldeReel = Math.max(0, total - bonus);

            res.json({
                total: roundIfNeeded(total),
                totalEur: roundIfNeeded(convertToEur(crypto, total)),
                solde: roundIfNeeded(soldeReel),
                soldeEur: roundIfNeeded(convertToEur(crypto, soldeReel)),
                bonus: roundIfNeeded(bonus),
                bonusEur: roundIfNeeded(convertToEur(crypto, bonus))
            });
        });
    });
});

module.exports = router;
