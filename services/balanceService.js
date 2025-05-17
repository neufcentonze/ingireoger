const { db } = require('../db');

const ALLOWED_CURRENCIES = ['btc', 'eth', 'ltc', 'sol'];

function computeBalance(value) {
  const number = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(number)) return 0.00000000;
  return parseFloat(number.toFixed(8));
}

function updateBalance(email, currency, computeOrValue, callback) {
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return callback(new Error("Crypto non supportée."));
  }

  const selectQuery = `SELECT ${currency} FROM solde WHERE email = ?`;

  db.get(selectQuery, [email], (err, row) => {
    if (err || !row) return callback(err || new Error("Utilisateur non trouvé"));

    const currentRaw = row[currency];
    const current = typeof currentRaw === 'number' ? currentRaw : parseFloat(currentRaw) || 0;

    let newBalance;
    if (typeof computeOrValue === 'function') {
      newBalance = computeBalance(computeOrValue(current));
    } else {
      newBalance = computeBalance(computeOrValue);
    }

    // ✅ Protection contre solde négatif
    if (newBalance < 0) {
      return callback(new Error("Solde insuffisant."));
    }

    const updateQuery = `UPDATE solde SET ${currency} = ? WHERE email = ?`;
    db.run(updateQuery, [newBalance, email], callback);
  });
}

module.exports = {
  computeBalance,
  updateBalance
};
