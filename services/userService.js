const { db } = require("../db");

exports.getUser = (email, callback) => {
    db.get("SELECT * FROM solde WHERE email = ?", [email], callback);
};

exports.updateBalance = (email, currency, newValue, callback) => {
    const value = typeof newValue === "function" ? newValue() : newValue;
    db.run(`UPDATE solde SET ${currency} = ? WHERE email = ?`, [value, email], callback);
};

exports.logTransaction = (
    email,
    currency,
    amount,
    type,
    callback = () => {},
    game = null,
    bet = null,
    betEur = null
) => {
    const date = new Date().toISOString();
    db.run(
        `INSERT INTO transactions (email, currency, amount, type, date, game, bet, bet_eur)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, currency, amount, type, date, game, bet, betEur],
        callback
    );
};
