const { db } = require("../db");

exports.getUser = (email, callback) => {
    db.get("SELECT * FROM solde WHERE email = ?", [email], callback);
};
