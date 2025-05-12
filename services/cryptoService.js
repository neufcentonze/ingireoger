const axios = require("axios");

exports.getCryptoPriceInEur = async (crypto) => {
    const ids = {
        btc: "bitcoin",
        eth: "ethereum",
        sol: "solana",
        ltc: "litecoin"
    };

    const coinId = ids[crypto.toLowerCase()];
    if (!coinId) throw new Error("Crypto non prise en charge");

    const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
            ids: coinId,
            vs_currencies: "eur"
        }
    });

    return res.data[coinId].eur;
};
