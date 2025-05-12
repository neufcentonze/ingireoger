const bcrypt = require("bcrypt");
const { db } = require("../db");
const saltRounds = 10;

exports.login = async (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).send("Email inconnu");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send("Mot de passe incorrect");

        req.session.email = user.email;
        req.session.user = user;
        res.status(200).send(`Bienvenue ${user.email}`);
    });
};

exports.register = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password)
        return res.status(400).send("Champs manquants");

    const hash = await bcrypt.hash(password, saltRounds);

    db.run(
        `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`,
        [email, username, hash],
        (err) => {
            if (err) return res.status(500).send("Erreur d'inscription");

            db.run(`INSERT INTO solde (email) VALUES (?)`, [email]); // solde init
            res.status(200).send("Inscription réussie !");
        }
    );
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send("Erreur déconnexion");
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
};
