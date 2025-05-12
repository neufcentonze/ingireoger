// utils/bonusLogic.js
const db = require("../db");
const roundIfNeeded = require("./roundIfNeeded");

function préleverSoldeAvecBonus(email, currency, montant, callback) {
    montant = parseFloat(montant);

    // Étape 1 : lire les bonus actifs
    db.get(
        `SELECT SUM(amount) AS totalBonus FROM bonuses WHERE email = ? AND currency = ? AND status = 'active'`,
        [email, currency],
        (err, row) => {
            if (err) return callback(err);

            const bonusRestant = row?.totalBonus || 0;

            // Étape 2 : si pas de bonus, on prend tout sur le solde
            if (bonusRestant <= 0) {
                return callback(null, montant);
            }

            // Étape 3 : calculer la partie à prélever sur le solde réel
            const àPréleverDuSolde = Math.max(0, montant - bonusRestant);
            callback(null, roundIfNeeded(àPréleverDuSolde));
        }
    );
}

module.exports = {
    préleverSoldeAvecBonus
};
