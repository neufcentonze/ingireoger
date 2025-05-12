const db = require("../db");
const axios = require("axios");

module.exports = async (req, res) => {
    const urlToken = req.query.token;
    const expectedToken = process.env.WEBHOOK_SECRET;

    if (!urlToken || urlToken !== expectedToken) {
        return res.status(403).send("⛔ Accès refusé");
    }

    const { addresses, confirmations, total, hash } = req.body;

    if (!addresses || confirmations < 1) {
        return res.status(200).send("🔄 En attente de confirmation");
    }

    const targetAddress = addresses[0]?.trim();
    const ltcAmount = total / 1e8;

    if (!targetAddress || !ltcAmount) {
        return res.status(400).send("Données manquantes");
    }

    db.get("SELECT email FROM crypto_assignments WHERE address = ?", [targetAddress], async (err, userRow) => {
        if (err || !userRow) {
            return res.status(200).send("❌ Adresse non assignée");
        }

        const email = userRow.email;

        try {
            const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
                params: {
                    ids: "litecoin",
                    vs_currencies: "eur"
                }
            });

            const ltcPriceEur = priceRes.data.litecoin.eur;
            const valueInEur = ltcAmount * ltcPriceEur;

            if (valueInEur < 25) {
                return res.status(200).send("❌ Montant trop bas pour dépôt");
            }

            let credited = ltcAmount;

            // 🔎 Vérifie si c'est le premier dépôt
            db.get("SELECT COUNT(*) AS count FROM transactions WHERE email = ? AND currency = 'ltc' AND type = 'depot'", [email], (err2, row2) => {
                const isFirst = row2?.count === 0;

                if (isFirst && valueInEur <= 250) {
                    credited *= 2; // double le montant
                    const bonus = credited - ltcAmount;
                    const bonusEur = bonus * ltcPriceEur;

                    db.run(`
                        INSERT INTO bonuses (email, type, amount, amount_eur, currency, reason, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [email, 'welcome', bonus, bonusEur, 'ltc', 'Doublement premier dépôt', 'active']
                    );
                }

                // 💰 Crédit le solde
                db.run("UPDATE solde SET ltc = ltc + ? WHERE email = ?", [credited, email]);

                // 💾 Log transaction
                db.run(`
                    INSERT INTO transactions (email, currency, amount, type, date, tx_hash)
                    VALUES (?, ?, ?, 'depot', ?, ?)`,
                    [email, 'ltc', ltcAmount, new Date().toISOString(), hash]
                );

                // 🗑️ Libère l'adresse
                db.run("DELETE FROM crypto_assignments WHERE address = ?", [targetAddress]);

                console.log(`✅ LTC crédité à ${email} (${ltcAmount} LTC, bonus inclus : ${credited - ltcAmount})`);
                return res.status(200).send("✅ Dépôt LTC traité avec bonus");
            });

        } catch (e) {
            console.error("Erreur fetch prix LTC :", e.message);
            return res.status(500).send("Erreur récupération prix LTC");
        }
    });
};
