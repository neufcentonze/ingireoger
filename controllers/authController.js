const bcrypt = require("bcrypt");
const db = require("../db");
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
exports.register = (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.json({ success: false, message: "Tous les champs sont requis." });
  }

  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passRegex.test(password)) {
    return res.json({
      success: false,
      message: "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre."
    });
  }

  // Vérifie si l'email est déjà utilisé
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, emailRow) => {
    if (err) {
      console.error("Erreur DB (email):", err);
      return res.json({ success: false, message: "Erreur serveur." });
    }

    if (emailRow) {
      return res.json({ success: false, message: "Cet email est déjà utilisé." });
    }

    // Vérifie si le nom d'utilisateur est déjà pris
    db.get('SELECT * FROM users WHERE username = ?', [username], (err2, userRow) => {
      if (err2) {
        console.error("Erreur DB (username):", err2);
        return res.json({ success: false, message: "Erreur serveur." });
      }

      if (userRow) {
        return res.json({ success: false, message: "Ce nom d'utilisateur est déjà pris." });
      }

      // Hash du mot de passe
      bcrypt.hash(password, saltRounds, (err3, hashedPassword) => {
        if (err3) {
          console.error("Erreur hash:", err3);
          return res.json({ success: false, message: "Erreur serveur." });
        }

        db.run(
          `INSERT INTO users (email, password, username, firstname, lastname, birthdate) VALUES (?, ?, ?, '', '', '')`,
          [email, hashedPassword, username],
          function (err4) {
            if (err4) {
              console.error("Erreur insertion:", err4);
              return res.json({ success: false, message: "Erreur d'inscription." });
            }

            req.session.email = email;
            return res.json({ success: true, message: "Inscription réussie !" });
          }
        );
      });
    });
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
