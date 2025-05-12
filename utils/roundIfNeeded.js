module.exports = function roundIfNeeded(n, decimals = 8) {
    const parts = n.toString().split(".");
    const decimalsPart = parts[1] || "";
    const tooPrecise = decimalsPart.length > decimals;

    if (tooPrecise && Number(decimalsPart[decimals]) >= 5) {
        return Math.ceil(n * 10 ** decimals) / 10 ** decimals;
    }

    return Number(n.toFixed(decimals));
};
