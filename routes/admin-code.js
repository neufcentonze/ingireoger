const express = require("express");
const router = express.Router();
const { generateAdminCode } = require("../services/adminCodeService");
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// 👉 Route pour valider le code via formulaire
router.post("/admin/code", (req, res) => {
    const userCode = req.body.code;
    const session = req.session;

    if (!session || !session.adminCode || Date.now() > session.adminCodeExpiry) {
        return res.status(403).send("Code expiré.");
    }

    if (userCode !== session.adminCode) {
        return res.render("admin/enter-code", {
            error: "Code incorrect.",
            layout: "layouts/minimal",
            title: "Authentification"
        });
    }

    session.adminValidated = true;
    res.redirect("/admin");
});

module.exports = router;
