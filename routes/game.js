const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const checkFeature = require("../middlewares/checkFeature");// ✅ Middleware pour maintenance
const db = require('../db/index');; // Connexion SQLite
const cryptoRates = require("../services/cryptoRates")

const symbols = ['btc', 'eth', 'sol', 'ltc'];

router.post('/set-symbol', (req, res) => {
    const symbol = (req.body.symbol || 'btc').toLowerCase();
    req.session.currentSymbol = symbol;
    res.json({ ok: true });
});

router.get("/dice", (req, res) => {
    const userEmail = req.session?.user?.email;
    // 1) récupère le symbole en session (ou 'btc')
    const currentSymbol = (req.session.currentSymbol || 'btc').toLowerCase();

    // 2) récupère tous les taux
    const allRates = symbols.reduce((acc, s) => {
        acc[s] = cryptoRates.getRate(s);
        return acc;
    }, {});

    // 3) récupère le rate de la crypto active
    const rate = allRates[currentSymbol] || 1;

    if (!userEmail) {
        return res.render("jeux/dice", {
            rate,
            layout: "layouts/front-layout",
            isLoggedIn: false,
            userBalance: "0.00000000",
            balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
            title: "Dice",
            showFooter: false,
            currentSymbol,               // 'btc', 'eth', ...
            rate,                        // taux € de la crypto active
            allRates                     // objet { btc:…, eth:…, sol:…, ltc:… }
            // autres données que tu veux passer à ta vue dice.ejs
        });
    }

    db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
        if (err) {
            console.error("Erreur récupération solde:", err);
            return res.status(500).send("Erreur serveur");
        }

        const balances = {
            btc: parseFloat(row?.btc || 0).toFixed(8),
            eth: parseFloat(row?.eth || 0).toFixed(8),
            sol: parseFloat(row?.sol || 0).toFixed(8),
            ltc: parseFloat(row?.ltc || 0).toFixed(8),
        };

        res.render("jeux/dice", {
            rate,
            layout: "layouts/front-layout",
            isLoggedIn: true,
            userBalance: balances.btc,
            balances,
            title: "Dice",
            showFooter: false,
            currentSymbol,               // 'btc', 'eth', ...
            rate,                        // taux € de la crypto active
            allRates                     // objet { btc:…, eth:…, sol:…, ltc:… }
            // autres données utiles
        });
    });
});

// 🎲 Lancer une partie de Dice
router.post("/play-dice", checkFeature("dice"), gameController.playDice);

// 🕵️‍♂️ Démarrer le jeu détective
router.post("/detective/start", checkFeature("detective"), gameController.startDetective);

// 🧠 Deviner un personnage
router.post("/detective/guess", checkFeature("detective"), gameController.detectiveGuess);

// 💰 Encaisser
router.post("/detective/cashout", checkFeature("detective"), gameController.detectiveCashout);

module.exports = router;
