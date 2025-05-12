const express = require("express");
const router = express.Router();
const db = require("../db");
const geoip = require("geoip-lite");
const useragent = require("express-useragent");

// Middleware user-agent
router.use(useragent.express());

// Redirection de lien
router.get("/:slug", (req, res) => {
  const slug = req.params.slug;

  db.get("SELECT * FROM trackers WHERE slug = ?", [slug], (err, tracker) => {
    if (err || !tracker) return res.status(404).send("Lien introuvable");

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip) || {};
    const device = req.useragent.isMobile ? "Mobile" : "Desktop";
    const browser = req.useragent.browser || "Inconnu";
    const blocked = tracker.active ? 0 : 1;

    // Enregistre le clic
    db.run(
      `INSERT INTO tracker_clicks (tracker_id, ip, country, countryCode, device, browser, blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tracker.id, ip, geo.country || "?", geo.country || "?", device, browser, blocked],
      err => {
        if (err) console.error("Erreur log click:", err);
      }
    );

    if (!tracker.active) {
      return res.status(403).send("Ce lien est désactivé.");
    }

    // Redirige ou affiche un message pour l'instant
    res.send(`Redirection du lien: ${slug} (à configurer vers une URL réelle)`);
  });
});

module.exports = router;
