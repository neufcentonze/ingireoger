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
    layout: "layouts/front-layout", // ✅ Layout avec sidebar, header, footer, modals
    currentSymbol,
    rate: allRates[currentSymbol] || 1,
    allRates,
    title,
    showFooter: true // ✅ Affiche le footer (condition présente dans front-layout.ejs)
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

function renderLegalPage(viewName, title) {
  return (req, res) => {
    const userEmail = req.session?.user?.email;
    const baseRenderData = getBaseRenderData(req, title);

    if (!userEmail) {
      return res.render(`legal/${viewName}`, {
        ...baseRenderData,
        isLoggedIn: false,
        userBalance: "0.00000000",
        balances: { btc: "0.00000000", eth: "0.00000000", sol: "0.00000000", ltc: "0.00000000" }
      });
    }

    db.get("SELECT * FROM solde WHERE email = ?", [userEmail], (err, row) => {
      if (err) {
        console.error("Erreur récupération solde:", err);
        return res.status(500).send("Erreur serveur");
      }

      const balances = getBalances(row);

      res.render(`legal/${viewName}`, {
        ...baseRenderData,
        isLoggedIn: true,
        userBalance: balances[baseRenderData.currentSymbol],
        balances
      });
    });
  };
}

// 🟢 Routes légales
router.get("/conditions", renderLegalPage("conditions", "Conditions Générales"));
router.get("/confidentialite", renderLegalPage("confidentialite", "Politique de Confidentialité"));
router.get("/responsable", renderLegalPage("responsable", "Jeu Responsable"));

module.exports = router;