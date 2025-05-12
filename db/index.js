// db/index.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'djelo.sqlite'); // tu peux adapter le nom
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Erreur ouverture DB :", err);
    } else {
        console.log("✅ Base de données connectée avec succès");
    }
});

module.exports = db;
