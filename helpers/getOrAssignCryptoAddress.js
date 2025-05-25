const db = require('../db/index');;

function getOrAssignCryptoAddress(email, currency, ip, callback) {
  // Cherche une adresse disponible pour cette crypto
  db.get(
    "SELECT address FROM available_addresses WHERE currency = ? AND assigned = 0 LIMIT 1",
    [currency],
    (err, row) => {
      if (err || !row) return callback(new Error("Aucune adresse disponible."));

      const address = row.address;

      // Marque cette adresse comme assignée
      db.run(
        "UPDATE available_addresses SET assigned = 1, email = ?, assignedAt = strftime('%s','now'), ip = ? WHERE address = ?",
        [email, ip, address],
        (err2) => {
          if (err2) return callback(err2);

          // Enregistre aussi dans la table des assignations
          db.run(
            "INSERT INTO crypto_assignments (email, currency, address, assignedAt) VALUES (?, ?, ?, strftime('%s','now'))",
            [email, currency, address],
            (err3) => {
              if (err3) return callback(err3);
              callback(null, address);
            }
          );
        }
      );
    }
  );
}

module.exports = getOrAssignCryptoAddress;
