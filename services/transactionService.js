const { db } = require('../db');
const cryptoRates = require('./cryptoRates');

function logTransaction(email, currency, amount, type, callback = () => {}, game = null, bet = null) {
  if (amount <= 0) return callback(); // Ignore 0 ou négatif
  const date = new Date().toISOString();

  const isGameRelated = ['gain', 'perte'].includes(type);
  const rate = cryptoRates.getRate(currency); // 🔁 Taux EUR depuis service local
  const amount_eur = parseFloat((amount * rate).toFixed(2));
  const bet_eur = bet ? parseFloat((bet * rate).toFixed(2)) : null;

  const query = isGameRelated
    ? `INSERT INTO transactions (email, currency, amount, amount_eur, type, game, bet, bet_eur, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    : `INSERT INTO transactions (email, currency, amount, type, game, bet, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const params = isGameRelated
    ? [email, currency, amount, amount_eur, type, game, bet, bet_eur, date]
    : [email, currency, amount, type, game, bet, date];

  db.run(query, params, callback);
}

function getUserTransactions(email, types = [], limit = 20, offset = 0, callback) {
  let query = `SELECT * FROM transactions WHERE email = ?`;
  const params = [email];

  if (Array.isArray(types) && types.length > 0) {
    const placeholders = types.map(() => '?').join(', ');
    query += ` AND type IN (${placeholders})`;
    params.push(...types);
  }

  query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, callback);
}

module.exports = {
  logTransaction,
  getUserTransactions
};
