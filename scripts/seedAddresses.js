const fs = require('fs');
const db = require('../db/index');; // Ton instance SQLite
const path = require('path');

// 📥 Lis le fichier JSON
const raw = fs.readFileSync(path.join(__dirname, '../data/addresses.json'), 'utf-8');
const addressData = JSON.parse(raw);

// 🛠️ Prépare l'insertion
const insertAddress = db.prepare(
    "INSERT OR IGNORE INTO available_addresses (address, currency, assigned) VALUES (?, ?, 0)"
);

// 🔁 Pour chaque currency (btc, eth, etc.)
for (const currency in addressData) {
    const addresses = addressData[currency];
    addresses.forEach(addr => {
        insertAddress.run(addr, currency);
    });
}

insertAddress.finalize(() => {
    console.log("✅ Adresses importées avec succès !");
    db.close();
});
