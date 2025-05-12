const express = require("express");
const router = express.Router();
const db = require("../db");
const { getUser, updateBalance, logTransaction } = require("../services/userService");

// 💸 Page de retrait
router.get("/withdrawal", (req, res) => {
    res.render("withdrawal", {
        isLoggedIn: !!req.session.email
    });
});

// 💰 Traitement du retrait
router.post("/api/withdrawal", (req, res) => {
    const email = req.session.email;
    const { currency, montant, adresse } = req.body;

    if (!email) return res.status(401).json({ error: "Non connecté" });

    const montantFloat = parseFloat(montant);
    if (!currency || isNaN(montantFloat) || montantFloat <= 0 || !adresse) {
        return res.status(400).json({ error: "Requête invalide" });
    }

    getUser(email, (err, solde) => {
        if (err || !solde) return res.status(500).json({ error: "Erreur serveur" });

        if (solde[currency] >= montantFloat) {
            const newBalance = solde[currency] - montantFloat;
            updateBalance(email, currency, newBalance, (err2) => {
                if (err2) return res.status(500).json({ error: "Erreur mise à jour" });

                logTransaction(email, currency, montantFloat, "withdrawal", () => {});
                return res.json({ success: true, message: "Retrait en cours de traitement" });
            });
        } else {
            return res.status(400).json({ error: "Solde insuffisant" });
        }
    });
});

// 📄 Page historique des transactions
router.get("/", (req, res) => {
    res.render("transaction", {
        isLoggedIn: !!req.session.email
    });
});

// 📊 API pour charger les transactions
router.get("/api/transactions", (req, res) => {
    const email = req.session.email;
    if (!email) return res.status(401).json({ error: "Non connecté" });

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const baseQuery = `FROM transactions WHERE email = ? ORDER BY date DESC`;
    db.get(`SELECT COUNT(*) AS total ${baseQuery}`, [email], (err, countRow) => {
        if (err) return res.status(500).json({ error: "Erreur chargement" });

        db.all(`SELECT * ${baseQuery} LIMIT ? OFFSET ?`, [email, limit, offset], (err2, rows) => {
            if (err2) return res.status(500).json({ error: "Erreur transactions" });

            res.json({ total: countRow.total, transactions: rows });
        });
    });
});

module.exports = router;
