const fs = require("fs");
const path = require("path");
const db = require("../db");

const featuresPath = path.join(__dirname, "..", "config", "features.json");

exports.getFeatures = (req, res) => {
    const features = JSON.parse(fs.readFileSync(featuresPath));
    res.render("admin/admin-features", {
        layout: "layouts/admin-layout",
        title: "Fonctionnalités",
        active: "features",
        features,
    });
};

exports.toggleFeature = (req, res) => {
    const { feature } = req.body;
    const features = JSON.parse(fs.readFileSync(featuresPath));

    if (!(feature in features)) {
        return res.status(400).send("Feature inconnue");
    }

    features[feature] = !features[feature];
    fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));
    res.redirect("/admin/features");
};


exports.getTrackers = (req, res) => {
    db.all("SELECT * FROM trackers ORDER BY createdAt DESC", (err, rows) => {
        if (err) return res.status(500).send("Erreur BDD");
        res.render("admin/trackers", {
            layout: "layouts/admin-layout",
            title: "Liens Trackers",
            active: "trackers",
            trackers: rows
        });
    });
};

exports.createTracker = (req, res) => {
    const label = req.body.label;
    const slug = Math.random().toString(36).substring(2, 7); // Ex: vnhv

    db.run(
        "INSERT INTO trackers (label, slug) VALUES (?, ?)",
        [label, slug],
        err => {
            if (err) return res.status(500).send("Erreur création lien");
            res.redirect("/admin/trackers");
        }
    );
};

exports.toggleTracker = (req, res) => {
    const id = req.params.id;
    db.run(
        "UPDATE trackers SET active = NOT active WHERE id = ?",
        [id],
        err => {
            if (err) return res.status(500).send("Erreur activation");
            res.redirect("/admin/trackers");
        }
    );
};

exports.showTrackerStats = (req, res) => {
    const trackerId = req.params.id;

    const query = `
      SELECT * FROM tracker_clicks
      WHERE tracker_id = ?
      ORDER BY createdAt DESC
      LIMIT 25
    `;

    db.all(query, [trackerId], (err, rows) => {
        if (err) {
            console.error("Erreur récupération stats :", err);
            return res.status(500).send("Erreur récupération stats");
        }


        const deviceCounts = {};
        rows.forEach(row => {
            const device = row.device || "Inconnu";
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });

        console.log("📊 Device counts:", deviceCounts);

        res.render("admin/trackers-stats", {
            layout: "layouts/admin-layout",
            title: "Stats du lien",
            clicks: rows,
            deviceData: deviceCounts,
            active: "trackers"
        });
    });
};
