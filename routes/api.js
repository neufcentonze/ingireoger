const express = require('express');
const router = express.Router();
const roundIfNeeded = require('../utils/roundIfNeeded');
const db = require('../db/index');; // Connexion SQLite
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

        // 1. Vérifie s’il y a un bonus actif non terminé
        const activeBonusSQL = `
  SELECT SUM(amount) as bonus
  FROM bonuses
  WHERE email = ? AND currency = ? AND status = 'active' AND wager_status != 'completed'
`;

        db.get(activeBonusSQL, [email, crypto], (err2, bonusRow) => {
            if (err2) {
                console.error('Erreur SQL bonus:', err2);
                return res.status(500).json({ error: 'Erreur SQL bonus' });
            }

            const bonus = parseFloat(bonusRow?.bonus || 0);

            // 💡 Si aucun bonus actif => on ne déduit rien
            const soldeReel = bonus > 0 ? Math.max(0, total - bonus) : total;

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

router.get('/user/balance', (req, res) => {
    const email = req.session?.user?.email;
    const crypto = req.query.crypto?.toLowerCase();

    if (!email) {
        return res.status(401).json({ success: false, error: 'Utilisateur non connecté.' });
    }

    if (!allowedCryptos.includes(crypto)) {
        return res.status(400).json({ success: false, error: 'Crypto non supportée.' });
    }

    const sql = `SELECT ${crypto} FROM solde WHERE email = ? LIMIT 1`;

    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ success: false, error: 'Erreur interne' });
        }

        const amount = parseFloat(row?.[crypto] || 0).toFixed(8);
        const amountEur = convertToEur(crypto, amount).toFixed(2);

        res.json({
            success: true,
            amount,
            amountEur
        });
    });
});

router.get('/bonus/wager', (req, res) => {
    const email = req.session?.user?.email;

    if (!email) {
        return res.status(401).json({ success: false, error: 'Utilisateur non connecté.' });
    }

    const sql = `
        SELECT wager_progress, wager_target, currency
        FROM bonuses
        WHERE email = ? AND status = 'active' AND wager_status != 'completed'
        ORDER BY createdAt DESC LIMIT 1
    `;

    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error("Erreur SQL bonus wager:", err);
            return res.status(500).json({ success: false, error: 'Erreur SQL' });
        }

        if (!row) {
            return res.json({
                success: true,
                progress: 0,
                target: 0,
                percent: 0,
                currency: 'btc' // fallback
            });
        }

        const progress = parseFloat(row.wager_progress || 0);
        const target = parseFloat(row.wager_target || 1); // éviter division par zéro
        const percent = Math.min(100, ((progress / target) * 100).toFixed(2));

        res.json({
            success: true,
            progress: progress.toFixed(8),
            target: target.toFixed(8),
            percent,
            currency: row.currency
        });
    });
});


module.exports = router;
