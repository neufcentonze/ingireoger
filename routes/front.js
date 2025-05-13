const express = require('express');
const router = express.Router();
const db = require('../db/index'); // adapte si besoin

router.get('/', (req, res) => {
  const userEmail = req.session?.email;

  if (!userEmail) {
    return res.render('home', {
      title: "Djelo",
      layout: 'layouts/front-layout',
      isLoggedIn: false,
      showFooter: true,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
      successMessage: null
    });
  }

  db.get('SELECT * FROM solde WHERE email = ?', [userEmail], (err, row) => {
    if (err) {
      console.error("Erreur récupération solde:", err);
      return res.status(500).send("Erreur serveur");
    }

    const balances = row || { btc: 0, eth: 0, sol: 0, ltc: 0 };

    // ✅ Injecte dans les locals (accessibles dans le layout + partials)
    res.locals.isLoggedIn = true;
    res.locals.balances = balances;
    res.locals.userBalance = balances.btc.toFixed(8);
    res.locals.successMessage = req.session?.success || null;
    res.locals.showFooter = true;

    res.render('home', {
      title: "Djelo",
      layout: 'layouts/front-layout',
      isLoggedIn: true,
      showFooter: true,
      successMessage: req.session?.success || null,
      balances,
      userBalance: balances.btc.toFixed(8)
    });
  });
});

module.exports = router;
