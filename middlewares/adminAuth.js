const crypto = require("crypto");

// 🔐 Génère un code temporaire sécurisé
function generateCode() {
    return crypto.randomBytes(3).toString("hex"); // Exemple : "a1b2c3"
}

// 📩 Envoie le code via Telegram
async function sendCode(bot, telegramId, code) {
    const message = `🔐 Nouveau code d'accès admin : *${code}*\n\n⏳ Valide 15 minutes.`;
    await bot.sendMessage(telegramId, message, { parse_mode: "Markdown" });
}

module.exports = function adminAuth(bot) {
    return async (req, res, next) => {
        const session = req.session;
        if (!session) return res.status(401).send("Session absente");

        const now = Date.now();

        // ✅ Si la session est déjà validée, on continue
        if (session.adminValidated) return next();

        // ✅ Vérifie la master key (mais une seule fois)
        if (!session.masterKeyValidated) {
            const masterKey = (req.query?.key || req.body?.key || req.headers["x-admin-key"] || "").trim();
            if (!masterKey || masterKey !== process.env.ADMIN_MASTER_KEY) {
                return res.status(403).send("Clé principale invalide.");
            }
            session.masterKeyValidated = true;
        }

        // ✅ Si un code est en attente de validation, on affiche simplement le formulaire
        if (session.adminCode && now < session.adminCodeExpiry && !session.adminValidated) {
            return res.render("admin/enter-code", {
                error: null,
                layout: "layouts/minimal",
                title: "Authentification"
            });
        }

        // ✅ Anti-abus : bloque si un code a été envoyé il y a moins de 5 minutes
        const cooldown = 5 * 60 * 1000;
        if (session.lastAdminCodeSentAt && now - session.lastAdminCodeSentAt < cooldown) {
            const wait = Math.ceil((cooldown - (now - session.lastAdminCodeSentAt)) / 1000);
            return res.render("admin/enter-code", {
                error: `⏳ Un code a déjà été envoyé. Réessaie dans ${wait} secondes.`,
                layout: "layouts/minimal",
                title: "Authentification"
            });
        }

        // ✅ Sinon : générer + envoyer un nouveau code
        const code = generateCode();
        session.adminCode = code;
        session.adminCodeExpiry = now + 15 * 60 * 1000; // 15 min
        session.adminValidated = false;
        session.lastAdminCodeSentAt = now;

        try {
            await sendCode(bot, process.env.ADMIN_TELEGRAM_ID, code);
            return res.render("admin/code-requested", {
                layout: "layouts/minimal",   // 👈 ICI
                title: "Code d’accès"
            });
        } catch (err) {
            console.error("Erreur d'envoi Telegram :", err);
            return res.status(500).send("Erreur lors de l'envoi du code.");
        }
    };
};
