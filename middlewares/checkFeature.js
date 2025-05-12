const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "..", "config", "features.json");

function checkFeature(featureName) {
    return (req, res, next) => {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath));

            if (settings.global === false) {
                return res.status(503).json({ error: "Site en maintenance. Revenez bientôt." });
            }

            if (settings[featureName] === false) {
                return res.status(503).json({ error: `La fonctionnalité "${featureName}" est en maintenance.` });
            }

            next();
        } catch (err) {
            console.error("Erreur lecture features.json :", err);
            return res.status(500).json({ error: "Erreur interne." });
        }
    };
}

module.exports = checkFeature;
