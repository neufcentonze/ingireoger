const db = require('../db/index');;

module.exports = function renderWithUserData(req, res, view, customData = {}) {
  const email = req.session?.user?.email;

  const defaultBalances = {
    btc: "0.00000000",
    eth: "0.00000000",
    sol: "0.00000000",
    ltc: "0.00000000"
  };

  const baseData = {
    isLoggedIn: !!email,
    showFooter: false,
    layout: customData.layout || undefined // Si tu veux spécifier un layout tu peux, sinon rien
  };

  if (!email) {
    return res.render(view, {
      ...baseData,
      userBalance: defaultBalances.btc,
      balances: defaultBalances,
      ...customData
    });
  }

  db.get("SELECT * FROM solde WHERE email = ?", [email], (err, row) => {
    const balances = err || !row
      ? defaultBalances
      : {
          btc: parseFloat(row.btc || 0).toFixed(8),
          eth: parseFloat(row.eth || 0).toFixed(8),
          sol: parseFloat(row.sol || 0).toFixed(8),
          ltc: parseFloat(row.ltc || 0).toFixed(8)
        };

    res.render(view, {
      ...baseData,
      userBalance: balances.btc,
      balances,
      ...customData
    });
  });
};
