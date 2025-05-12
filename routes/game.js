const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const checkFeature = require("../middlewares/checkFeature");// ✅ Middleware pour maintenance

// 🎲 Lancer une partie de Dice
router.post("/play-dice", checkFeature("dice"), gameController.playDice);

// 🕵️‍♂️ Démarrer le jeu détective
router.post("/detective/start", checkFeature("detective"), gameController.startDetective);

// 🧠 Deviner un personnage
router.post("/detective/guess", checkFeature("detective"), gameController.detectiveGuess);

// 💰 Encaisser
router.post("/detective/cashout", checkFeature("detective"), gameController.detectiveCashout);

module.exports = router;
