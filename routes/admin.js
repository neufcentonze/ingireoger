const express = require("express");
const router = express.Router();
const { getFeatures, toggleFeature, getTrackers, createTracker, toggleTracker, showTrackerStats, adminController } = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth");
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Formulaire de code
router.post("/code", (req, res) => {
    const code = req.body.code;
    const session = req.session;

    if (!session || !session.adminCode || Date.now() > session.adminCodeExpiry) {
        return res.status(403).send("Code expiré.");
    }

    if (code !== session.adminCode) {
        return res.render("admin/enter-code", {
            error: "Code incorrect.",
            layout: "layouts/minimal",
            title: "Authentification"
        });
    }

    session.adminValidated = true;
    return res.redirect("/admin");
});

// ✅ Toutes les routes suivantes doivent passer par adminAuth(bot)
router.use(adminAuth(bot));

router.get("/", (req, res) => {
    return res.render("admin/dashboard", {
        layout: "layouts/admin-layout",
        title: "Dashboard",
        active: "dashboard"
    });
});


router.get("/features", getFeatures);
router.post("/features/toggle", toggleFeature);
router.get("/trackers", getTrackers);
router.post("/trackers/toggle/:id", toggleTracker);
router.get("/trackers/:id/stats", showTrackerStats);
router.post("/trackers/create", createTracker);


module.exports = router;
