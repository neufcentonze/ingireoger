// utils/cryptoRates.js
const axios = require('axios');

const cache = {
  rates: {}, // Exemple: { btc: 58623.14, eth: 3045.12 }
  lastUpdated: 0
};

const COINS = ['bitcoin', 'ethereum', 'solana', 'litecoin']; // CoinGecko IDs
const SYMBOL_MAP = { btc: 'bitcoin', eth: 'ethereum', sol: 'solana', ltc: 'litecoin' };

async function updateRates() {
  try {
    const ids = COINS.join(',');
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );
    const data = res.data;

    for (const [symbol, coinId] of Object.entries(SYMBOL_MAP)) {
      cache.rates[symbol] = data[coinId]?.eur || 0;
    }

    cache.lastUpdated = Date.now();
  } catch (err) {
    console.error('[CryptoRates] Échec de mise à jour:', err.message);
  }
}

// Démarre la mise à jour auto toutes les minutes
setInterval(updateRates, 60 * 1000);
updateRates(); // mise à jour immédiate au démarrage

function convertToEur(symbol, amount) {
  const rate = cache.rates[symbol] || 0;
  return parseFloat(amount) * rate;
}

module.exports = {
  convertToEur,
  getRate: (symbol) => cache.rates[symbol] || 0
};
