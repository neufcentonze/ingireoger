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
    const btcAmount = total / 1e8;

    if (!targetAddress || !btcAmount) {
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
                    ids: "bitcoin",
                    vs_currencies: "eur"
                }
            });

            const btcPriceEur = priceRes.data.bitcoin.eur;
            const valueInEur = btcAmount * btcPriceEur;

            if (valueInEur < 25) {
                return res.status(200).send("❌ Montant trop bas pour dépôt");
            }

            let credited = btcAmount;

            // 🔎 Vérifie si c'est le premier dépôt
            db.get("SELECT COUNT(*) AS count FROM transactions WHERE email = ? AND currency = 'btc' AND type = 'depot'", [email], (err2, row2) => {
                const isFirst = row2?.count === 0;

                if (isFirst && valueInEur <= 500) {
                    credited *= 2;
                    const bonus = credited - btcAmount;
                    const bonusEur = bonus * btcPriceEur;

                    db.run(`
                        INSERT INTO bonuses (email, type, amount, amount_eur, currency, reason, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [email, 'welcome', bonus, bonusEur, 'btc', 'Doublement premier dépôt', 'active']
                    );
                }

                // 💰 Crédit le solde
                db.run("UPDATE solde SET btc = btc + ? WHERE email = ?", [credited, email]);

                // 💾 Log transaction
                db.run(`
                    INSERT INTO transactions (email, currency, amount, type, date, tx_hash)
                    VALUES (?, ?, ?, 'depot', ?, ?)`,
                    [email, 'btc', btcAmount, new Date().toISOString(), hash]
                );

                // 🗑️ Libère l'adresse
                db.run("DELETE FROM crypto_assignments WHERE address = ?", [targetAddress]);

                console.log(`✅ BTC crédité à ${email} (${btcAmount} BTC, bonus inclus : ${credited - btcAmount})`);
                return res.status(200).send("✅ Dépôt BTC traité avec bonus");
            });

        } catch (e) {
            console.error("Erreur fetch prix BTC :", e.message);
            return res.status(500).send("Erreur récupération prix BTC");
        }
    });
};
