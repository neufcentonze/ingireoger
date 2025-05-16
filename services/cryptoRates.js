const fetch = require('node-fetch');

let cachedRates = {
  btc: 0,
  eth: 0,
  sol: 0,
  ltc: 0,
  lastUpdated: 0
};

const ids = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  ltc: 'litecoin'
};

async function updateCryptoRates() {
  try {
    const coinList = Object.values(ids).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinList}&vs_currencies=eur`);
    const data = await res.json();

    cachedRates.btc = data.bitcoin.eur;
    cachedRates.eth = data.ethereum.eur;
    cachedRates.sol = data.solana.eur;
    cachedRates.ltc = data.litecoin.eur;
    cachedRates.lastUpdated = Date.now();

    console.log("🔁 Taux mis à jour :", cachedRates);
  } catch (err) {
    console.error("❌ Erreur mise à jour taux CoinGecko :", err);
  }
}

// Met à jour toutes les minutes
setInterval(updateCryptoRates, 60 * 1000);
updateCryptoRates(); // 1er appel immédiat

function getRate(symbol) {
  return cachedRates[symbol] || 1;
}

module.exports = {
  getRate
};