const bcrypt = require("bcrypt");
const { db } = require("../db");
const saltRounds = 10;

// Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur serveur" });
    if (!user) return res.status(400).json({ success: false, message: "Email inconnu" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Mot de passe incorrect" });

    // Auth ok
    req.session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    res.status(200).json({ success: true, message: `Bienvenue ${user.username}` });
  });
};

// Inscription
exports.register = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res.status(400).json({ success: false, message: "Champs manquants" });

  // Vérifie si email existe déjà
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur serveur" });
    if (existingUser)
      return res.status(409).json({ success: false, message: "Email déjà utilisé" });

    const hash = await bcrypt.hash(password, saltRounds);

    db.run(
      `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`,
      [email, username, hash],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: "Erreur d'inscription" });

        db.run(`INSERT INTO solde (email) VALUES (?)`, [email]); // solde initialisé
        res.status(201).json({ success: true, message: "Inscription réussie" });
      }
    );
  });
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur déconnexion" });
    res.clearCookie("connect.sid");
    res.status(200).json({ success: true, message: "Déconnexion réussie" });
  });
};
