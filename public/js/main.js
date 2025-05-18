// 🔍 Récupère la crypto sélectionnée via l'attribut data-crypto
function getSelectedCurrencyFromHeader() {
    const el = document.querySelector('.solde-container.open') || document.querySelector('.solde-container');
    if (!el) return 'btc';

    const selected = el.getAttribute('data-crypto');
    return selected || 'btc';
}

// 📊 Charge les détails de la crypto sélectionnée
async function loadCryptoDetails() {
    console.log("🔍 Fonction loadCryptoDetails() appelée");

    const currency = getSelectedCurrencyFromHeader();
    console.log("💱 Crypto détectée :", currency);

    try {
        const res = await fetch(`/api/cryptoDetail?crypto=${currency}`, {
            method: 'GET',
            credentials: 'same-origin'
        });

        console.log("📦 Requête envoyée, réponse reçue");

        const data = await res.json();
        console.log("📊 Données reçues :", data);

        if (data.error) return console.log(data.error)

        const symbol = currency.toUpperCase();

        // Injection des données dans le modal
        document.querySelector('.js-crypto-total').textContent = `${data.total} ${symbol}`;
        document.querySelector('.js-crypto-total-eur').textContent = `${data.totalEur} €`;

        document.querySelector('.js-crypto-net').textContent = `${data.soldeNet} ${symbol}`;
        document.querySelector('.js-crypto-net-eur').textContent = `${data.soldeNetEur} €`;

        document.querySelector('.js-crypto-bonus').textContent = `${data.bonus} ${symbol}`;
        document.querySelector('.js-crypto-bonus-eur').textContent = `${data.bonusEur} €`;

        // Ouvre le modal
        const modalEl = document.getElementById('cryptoDetailsModal');
        console.log("🔍 modalEl:", modalEl);

        if (!modalEl) {
            console.error("❌ L'élément modal cryptoDetailsModal est introuvable !");
            return;
        }

        const modal = new bootstrap.Modal(modalEl); // ✅ Correction ici
        modal.show();

    } catch (err) { 0 }
}

// Dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM chargé");

    // 🔁 Attache les événements aux boutons "Détails"
    const detailBtns = document.querySelectorAll('.solde-details');
    console.log("🔎 Boutons Détails détectés :", detailBtns.length);

    detailBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log("👆 Clic sur un bouton Détails");
            await loadCryptoDetails();
        });
    });

    // 🖱️ Gère le changement de crypto dans le dropdown
    document.querySelectorAll('.solde-option').forEach(option => {
        option.addEventListener('click', () => {
            const container = document.querySelector('.solde-container.open');
            const soldeBox = container.querySelector('.solde-box');
            const newAmount = option.dataset.amount?.slice(0, 10) || '0.00000000';
            const newIcon = option.dataset.icon || '/images/btc.png';
            const newSymbol = option.dataset.crypto || 'btc';

            // Mise à jour de l'affichage
            soldeBox.querySelector('.solde-amount').textContent = newAmount;
            soldeBox.querySelector('.solde-crypto-icon').src = newIcon;

            // Mise à jour de l'attribut data-crypto
            container?.setAttribute('data-crypto', newSymbol);

            // Ferme le dropdown
            container.classList.remove('open');
            const chevron = soldeBox.querySelector('.solde-chevron');
            if (chevron) {
                chevron.setAttribute('data-lucide', 'chevron-down');
                lucide.createIcons();
            }
        });
    });
});
