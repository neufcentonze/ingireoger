const db = require('../db/index');
const { updateBalance, computeRealAndBonusParts } = require('./balanceService'); // ← ton nouveau updateBalance
const getOrAssignCryptoAddress = require('../helpers/getOrAssignCryptoAddress');

// ----------------------
// Fonctions principales
// ----------------------

function deposit(email, currency, amount, callback) {
  updateBalance({
    email,
    currency,
    computeOrValue: curr => curr + amount,
    type: 'depot',
    callback
  });
}

function withdraw(email, currency, amount, callback) {
  const selectQuery = `SELECT ${currency} FROM solde WHERE email = ?`;

  db.get(selectQuery, [email], (err, row) => {
    if (err || !row) return callback(err || new Error("Utilisateur non trouvé"));

    const totalBalance = parseFloat(row[currency]) || 0;

    computeRealAndBonusParts(email, currency, totalBalance, (err, parts) => {
      if (err) return callback(err);

      if (amount > parts.real) {
        return callback(new Error("Vous ne pouvez pas retirer des fonds provenant du bonus tant que le wager n'est pas terminé."));
      }


      updateBalance({
        email,
        currency,
        computeOrValue: curr => curr - amount,
        type: 'withdrawal',
        callback
      });
    });
  });
}

function getHistory(email, allowedTypes, limit, offset, callback) {
  const placeholders = allowedTypes.map(() => '?').join(',');

  const query = `
    SELECT * FROM transactions
    WHERE email = ? AND type IN (${placeholders})
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total FROM transactions
    WHERE email = ? AND type IN (${placeholders})
  `;

  const params = [email, ...allowedTypes, limit, offset];
  const countParams = [email, ...allowedTypes];

  db.all(query, params, (err, rows) => {
    if (err) return callback(err);

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) return callback(err);
      callback(null, rows, countResult.total);
    });
  });
}

async function getOrAssignAddress(email, currency, ip) {
  const now = Math.floor(Date.now() / 1000);

  const row = await getOne(
    "SELECT address, assignedAt FROM crypto_assignments WHERE email = ? AND currency = ?",
    [email, currency]
  );

  const isExpired = row && (row.assignedAt + 3600 < now);

  if (!row || isExpired) {
    if (isExpired) {
      await runQuery(
        "DELETE FROM crypto_assignments WHERE email = ? AND currency = ?",
        [email, currency]
      );
    }

    const newAddress = await assignAddress(email, currency, ip);

    const countRow = await getOne(
      "SELECT COUNT(*) AS depotCount FROM transactions WHERE email = ? AND type = 'depot'",
      [email]
    );

    return {
      address: newAddress,
      expiresIn: 3600,
      assignedAt: now,
      isFirstDeposit: countRow?.depotCount === 0
    };
  }

  const expiresIn = row.assignedAt + 3600 - now;

  const countRow = await getOne(
    "SELECT COUNT(*) AS depotCount FROM transactions WHERE email = ? AND type = 'depot'",
    [email]
  );

  return {
    address: row.address,
    expiresIn,
    assignedAt: row.assignedAt,
    isFirstDeposit: countRow?.depotCount === 0
  };
}

// ----------------------
// Helpers internes
// ----------------------

function getOne(query, params) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function runQuery(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function assignAddress(email, currency, ip) {
  return new Promise((resolve, reject) => {
    getOrAssignCryptoAddress(email, currency, ip, (err, addr) => {
      if (err) reject(err);
      else resolve(addr);
    });
  });
}

// ----------------------
// Export
// ----------------------

module.exports = {
  deposit,
  withdraw,
  getHistory,
  getOrAssignAddress
};
