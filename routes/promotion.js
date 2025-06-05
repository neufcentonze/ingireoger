const express = require("express");
const router = express.Router();
const db = require("../db/index");
const cryptoRates = require("../services/cryptoRates");
const symbols = ["btc", "eth", "sol", "ltc"];

function getBaseRenderData(req, title) {
  const currentSymbol = (req.session.currentSymbol || "btc").toLowerCase();
  const allRates = symbols.reduce((acc, sym) => {
    acc[sym] = cryptoRates.getRate(sym);
    return acc;
  }, {});

  return {
    layout: "layouts/front-layout",
    currentSymbol,
    rate: allRates[currentSymbol] || 1,
    allRates,
    title,
    showFooter: false
  };
}

function getBalances(row) {
  return {
    btc: parseFloat(row?.btc || 0).toFixed(8),
    eth: parseFloat(row?.eth || 0).toFixed(8),
    sol: parseFloat(row?.sol || 0).toFixed(8),
    ltc: parseFloat(row?.ltc || 0).toFixed(8)
  };
}

// 🟢 /promotions/double
router.get("/depot-double", (req, res) => {
  const userEmail = req.session?.user?.email;
  const baseRenderData = getBaseRenderData(req, "Premier dépôt doublé");

  if (!userEmail) {
    return res.render("promotions/depot-double", {
      ...baseRenderData,
      isLoggedIn: false,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 }
    });
  }

  db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
    if (err) {
      console.error("Erreur récupération solde:", err);
      return res.status(500).send("Erreur serveur");
    }

    const balances = getBalances(row);

    res.render("promotions/depot-double", {
      ...baseRenderData,
      isLoggedIn: true,
      userBalance: balances[baseRenderData.currentSymbol],
      balances
    });
  });
});

// 🟠 /promotions/tirage
router.get("/tirage-mensuel", (req, res) => {
  const userEmail = req.session?.user?.email;
  const baseRenderData = getBaseRenderData(req, "Tirage mensuel");

  if (!userEmail) {
    return res.render("promotions/tirage-mensuel", {
      ...baseRenderData,
      isLoggedIn: false,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 }
    });
  }

  db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
    if (err) {
      console.error("Erreur récupération solde:", err);
      return res.status(500).send("Erreur serveur");
    }

    const balances = getBalances(row);

    res.render("promotions/tirage-mensuel", {
      ...baseRenderData,
      isLoggedIn: true,
      userBalance: balances[baseRenderData.currentSymbol],
      balances
    });
  });
});

// 🔵 /promotions/classement
router.get("/classement", (req, res) => {
  const userEmail = req.session?.user?.email;
  const baseRenderData = getBaseRenderData(req, "Classement hebdomadaire");

  if (!userEmail) {
    return res.render("promotions/classement", {
      ...baseRenderData,
      isLoggedIn: false,
      userBalance: "0.00000000",
      balances: { btc: 0, eth: 0, sol: 0, ltc: 0 }
    });
  }

  db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
    if (err) {
      console.error("Erreur récupération solde:", err);
      return res.status(500).send("Erreur serveur");
    }

    const balances = getBalances(row);

    res.render("promotions/classement", {
      ...baseRenderData,
      isLoggedIn: true,
      userBalance: balances[baseRenderData.currentSymbol],
      balances
    });
  });
});

module.exports = router;