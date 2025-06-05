const express = require('express');
const router = express.Router();
const db = require('../db/index'); // adapte si besoin
const games = require('../views/Jeux/games');


const promos = [
  {
    id: 1,
    label: "Offre d'inscription",
    title: "Votre premier dépôt est doublé !",
    desc: "Votre 1er dépôt doublé jusqu'à 500 €",
    slug: "depot-double"
  },
  {
    id: 2,
    label: "Tirage au sort",
    title: "Chaque mise change tout !",
    desc: "10 000 € à gagner chaque mois.",
    slug: "tirage-mensuel"
  },
  {
    id: 3,
    label: "Promotion",
    title: "Surpasse les autres au classement !",
    desc: "Jusqu'à 3 000 € en jeu chaque semaine.",
    slug: "classement"
  }
];


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
      games,
      promos
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

router.get('/promotions', (req, res) => {
  res.render('promotions', {
    title: 'Promotions',
    showFooter: true
  });
});

module.exports = router;