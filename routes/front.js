const express = require('express');
const router = express.Router();
const db = require('../db/index'); // adapte si besoin
const games = require('../views/Jeux/games');



router.get('/', (req, res) => {
  const userEmail = req.session?.user?.email;


  if (!userEmail) {
    return res.render('home', {
      title: "Djelo",
      layout: 'layouts/front-layout',
      isLoggedIn: false,
      showFooter: true,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
      successMessage: null,
      games
    });
  }

  db.get('SELECT * FROM solde WHERE email = ?', [userEmail], (err, row) => {
    if (err) {
      console.error("Erreur récupération solde:", err);
      return res.status(500).send("Erreur serveur");
    }

    const balances = {
      btc: parseFloat(row?.btc || 0).toFixed(8),
      eth: parseFloat(row?.eth || 0).toFixed(8),
      sol: parseFloat(row?.sol || 0).toFixed(8),
      ltc: parseFloat(row?.ltc || 0).toFixed(8)
    };

    // ✅ Injecte dans les locals (accessibles dans le layout + partials)
    res.locals.isLoggedIn = true;
    res.locals.successMessage = req.session?.success || null;
    res.locals.showFooter = true;
    res.locals.balances = balances;
    res.locals.userBalance = balances.btc;

    res.render('home', {
      title: "Djelo",
      layout: 'layouts/front-layout',
      isLoggedIn: true,
      showFooter: true,
      successMessage: req.session?.success || null,
      balances,
      userBalance: balances.btc,
      games
    });
  });
});

module.exports = router;
