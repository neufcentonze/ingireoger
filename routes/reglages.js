const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/adminAuth"); // Optionnel si tu veux protéger certaines routes

// 📁 Page des réglages principaux
router.get("/", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/auth/login");
    }

    res.render("reglages/index", {
        email: req.session.email,
        isLoggedIn: true
    });
});

// 🪪 Upload de documents KYC
router.get("/kyc", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/auth/login");
    }

    res.render("reglages/kyc", {
        email: req.session.email,
        isLoggedIn: true
    });
});

// Tu peux ajouter plus tard : POST pour upload, modification mot de passe, etc.

module.exports = router;
