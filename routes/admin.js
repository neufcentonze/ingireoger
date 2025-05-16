const express = require("express");
const db = require("../db");
const router = express.Router();
const {
  getFeatures,
  toggleFeature,
  getTrackers,
  createTracker,
  toggleTracker,
  showTrackerStats
} = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth");
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// 🔐 Vérification du code admin
router.post("/code", (req, res) => {
  const { code } = req.body;
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

// ✅ Middleware protection admin
router.use(adminAuth(bot));

// 📊 DASHBOARD
router.get("/", (req, res) => {
  const stats = {};
  const vault = { cryptos: [] };

  db.get("SELECT COUNT(*) as total FROM users", (err, userRow) => {
    if (err) return res.status(500).send("Erreur DB");
    stats.totalUsers = userRow.total;

    db.get(
      "SELECT COUNT(DISTINCT email) as online FROM transactions WHERE date >= datetime('now', '-10 minutes')",
      (err2, onlineRow) => {
        if (err2) return res.status(500).send("Erreur DB");
        stats.onlineUsers = onlineRow.online;

        db.get(
          "SELECT COUNT(DISTINCT ip) as visitors FROM tracker_clicks",
          (err3, visitRow) => {
            if (err3) return res.status(500).send("Erreur DB");
            stats.visitors = visitRow.visitors;

            db.all(
              "SELECT currency, ROUND(SUM(amount_eur), 2) as total_eur FROM transactions WHERE type = 'webhook' GROUP BY currency",
              (err4, vaultRows) => {
                if (err4) return res.status(500).send("Erreur DB");

                vault.cryptos = vaultRows || [];
                vault.total = vault.cryptos.reduce(
                  (sum, c) => sum + (c.total_eur || 0),
                  0
                ).toFixed(2);

                res.render("admin/dashboard", {
                  layout: "layouts/admin-layout",
                  title: "Dashboard",
                  active: "dashboard",
                  stats,
                  vault
                });
              }
            );
          }
        );
      }
    );
  });
});

// 👤 UTILISATEURS
router.get("/users", (req, res) => {
  db.all(
    `SELECT id, email, username, createdAt FROM users ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) return res.status(500).send("Erreur chargement utilisateurs");

      res.render("admin/users", {
        layout: "layouts/admin-layout",
        title: "Utilisateurs",
        active: "users",
        users: rows
      });
    }
  );
});

// ⚙️ FEATURES
router.get("/features", getFeatures);
router.post("/features/toggle", toggleFeature);

// 🧲 TRACKERS
router.get("/trackers", getTrackers);
router.post("/trackers/toggle/:id", toggleTracker);
router.get("/trackers/:id/stats", showTrackerStats);
router.post("/trackers/create", createTracker);

module.exports = router;
