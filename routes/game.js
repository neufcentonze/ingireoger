const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const checkFeature = require("../middlewares/checkFeature");// ✅ Middleware pour maintenance
const db = require('../db/index');; // Connexion SQLite
const cryptoRates = require("../services/cryptoRates")

const symbols = ['btc', 'eth', 'sol', 'ltc'];

router.post('/set-symbol', (req, res) => {
    const symbol = (req.body.symbol || 'btc').toLowerCase();
    req.session.currentSymbol = symbol;
    res.json({ ok: true });
});

router.get("/dice", (req, res) => {
    const userEmail = req.session?.user?.email;
    const currentSymbol = (req.session.currentSymbol || 'btc').toLowerCase();

    const allRates = symbols.reduce((acc, sym) => {
        acc[sym] = cryptoRates.getRate(sym);
        return acc;
    }, {});
    const rate = allRates[currentSymbol] || 1;

    const baseRenderData = {
        layout: "layouts/front-layout",
        currentSymbol,
        rate,
        allRates,
        title: "Dice",
        game: "dice",
        showFooter: false,
    };

    if (!userEmail) {
        return res.render("jeux/dice", {
            ...baseRenderData,
            isLoggedIn: false,
            userBalance: "0.00000000",
            balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
        });
    }

    db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
        if (err) {
            console.error("Erreur récupération solde:", err);
            return res.status(500).send("Erreur serveur");
        }

        const balances = {
            btc: parseFloat(row?.btc || 0).toFixed(8),
            eth: parseFloat(row?.eth || 0).toFixed(8),
            sol: parseFloat(row?.sol || 0).toFixed(8),
            ltc: parseFloat(row?.ltc || 0).toFixed(8),
        };

        res.render("jeux/dice", {
            ...baseRenderData,
            isLoggedIn: true,
            userBalance: balances[currentSymbol],
            balances,
        });
    });
});

router.get("/tower", (req, res) => {
    const userEmail = req.session?.user?.email;
    const currentSymbol = (req.session.currentSymbol || 'btc').toLowerCase();

    const allRates = symbols.reduce((acc, sym) => {
        acc[sym] = cryptoRates.getRate(sym);
        return acc;
    }, {});
    const rate = allRates[currentSymbol] || 1;

    const baseRenderData = {
        layout: "layouts/front-layout",
        currentSymbol,
        rate,
        allRates,
        title: "Tower Promotion",
        game: "tower",
        showFooter: false,
    };

    if (!userEmail) {
        return res.render("jeux/tower", {
            ...baseRenderData,
            isLoggedIn: false,
            userBalance: "0.00000000",
            balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
        });
    }

    db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
        if (err) {
            console.error("Erreur récupération solde:", err);
            return res.status(500).send("Erreur serveur");
        }

        const balances = {
            btc: parseFloat(row?.btc || 0).toFixed(8),
            eth: parseFloat(row?.eth || 0).toFixed(8),
            sol: parseFloat(row?.sol || 0).toFixed(8),
            ltc: parseFloat(row?.ltc || 0).toFixed(8),
        };

        res.render("jeux/tower", {
            ...baseRenderData,
            isLoggedIn: true,
            userBalance: balances[currentSymbol],
            balances,
        });
    });
});


// Inout Games
const availableGames = [
  { slug: "plinko", title: "Plinko", url: "" },
  { slug: "hamster-run", title: "Hamster Run", url: "" },
  { slug: "chicken-road", title: "Chicken Road", url: "" },
  { slug: "chicken-road2", title: "Chicken Road 2", url: "" },
  { slug: "coinflip", title: "Coinflip", url: "" },
  { slug: "crash", title: "Crash", url: "" },
  { slug: "dice", title: "Dice", url: "" },
  { slug: "forest-fortune", title: "Forest Fortune", url: "" },
  { slug: "keno", title: "Keno", url: "" },
  { slug: "limbo", title: "Limbo", url: "" },
  { slug: "penalty", title: "Penalty", url: "" },
  { slug: "stairs", title: "Stairs", url: "" },
  { slug: "sugar-daddy", title: "Sugar Daddy", url: "" },
  { slug: "tower", title: "Tower", url: "" },
  { slug: "wheel", title: "Wheel", url: "" },
];

router.get("/:gameSlug", (req, res) => {
  const { gameSlug } = req.params;
  const game = availableGames.find(g => g.slug === gameSlug);

  if (!game) {
    return res.status(404).render("404", { message: "Jeu introuvable" });
  }

  const userEmail = req.session?.user?.email;
  const currentSymbol = (req.session.currentSymbol || 'btc').toLowerCase();
  const allRates = symbols.reduce((acc, sym) => {
    acc[sym] = cryptoRates.getRate(sym);
    return acc;
  }, {});
  const rate = allRates[currentSymbol] || 1;

  const baseRenderData = {
    layout: "layouts/front-layout",
    currentSymbol,
    rate,
    allRates,
    title: game.title,
    game: game.slug,
    showFooter: false,
  };

  const renderPath = `jeux/${game.slug}`;

  if (!userEmail) {
    return res.render(renderPath, {
      ...baseRenderData,
      isLoggedIn: false,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 },
    });
  }

  // Si l’utilisateur est connecté :
  const user = req.session.user;
  return res.render(renderPath, {
    ...baseRenderData,
    isLoggedIn: true,
    userBalance: user.balances?.[currentSymbol] || "0.00000000",
    balances: user.balances || {},
  });
});



// 🎲 Lancer une partie de Dice
router.post("/play-dice", checkFeature("dice"), gameController.playDice);

// 🕵️‍♂️ Démarrer le jeu détective
router.post("/detective/start", checkFeature("detective"), gameController.startDetective);

// 🧠 Deviner un personnage
router.post("/detective/guess", checkFeature("detective"), gameController.detectiveGuess);

// 💰 Encaisser
router.post("/detective/cashout", checkFeature("detective"), gameController.detectiveCashout);

module.exports = router;
