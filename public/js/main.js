// 🔍 Récupère la crypto sélectionnée via l'attribut data-crypto
function getSelectedCurrencyFromHeader() {
    const el = document.querySelector('.solde-container.open') || document.querySelector('.solde-container');
    if (!el) return 'btc';

    const selected = el.getAttribute('data-crypto');
    return selected || 'btc';
}

// 📊 Charge les détails de la crypto sélectionnée
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

        try {
            const wagerRes = await fetch(`/api/bonus/wager`, {
                method: 'GET',
                credentials: 'same-origin'
            });

            const wagerData = await wagerRes.json();

            if (wagerData.success && wagerData.target > 0) {
                const percent = Math.min(100, parseFloat(wagerData.percent).toFixed(2));

                // Injection des données dans les spans
                const currencyUpper = currency.toUpperCase();

                document.getElementById('wagerProgress').textContent = wagerData.progress;
                document.getElementById('wagerTarget').textContent = wagerData.target;
                document.getElementById('wagerPercent').textContent = `${percent}%`;

                // 👇 Met à jour l’unité
                document.getElementById('wagerCurrency').textContent = currencyUpper;
                document.getElementById('wagerCurrencyClone').textContent = currencyUpper;

                // Mise à jour de la barre de progression
                const fill = document.getElementById('wagerFill');
                if (fill) {
                    fill.style.width = `${percent}%`;

                    // Optionnel : couleur selon avancement
                    let color = '#f44336'; // rouge
                    if (percent >= 70) color = '#4caf50'; // vert
                    else if (percent >= 30) color = '#ff9800'; // orange

                    fill.style.backgroundColor = color;
                }
            }
        } catch (e) {
            console.error("❌ Erreur chargement wager:", e);
        }

        const symbol = currency.toUpperCase();

        // Injection des données dans le modal
        document.getElementById('soldeTotalInput').value = `${data.total} ${symbol}`;
        document.querySelector('.js-crypto-total-eur').textContent = `${data.totalEur} €`;

        document.getElementById('soldeInput').value = `${data.solde} ${symbol}`;
        document.querySelector('.js-crypto-net-eur').textContent = `${data.soldeEur} €`;

        document.getElementById('soldeBonusInput').value = `${data.bonus} ${symbol}`;
        document.querySelector('.js-crypto-bonus-eur').textContent = `${data.bonusEur} €`;

        // 🔁 Met à jour les icônes dans la modale
        const iconExt = currency.toLowerCase() === 'eth' ? 'svg' : 'png';
        const iconUrl = `/images/${currency.toLowerCase()}.${iconExt}`;

        document.querySelectorAll('#soldeDetailsModal .js-crypto-icon').forEach(img => {
            img.src = iconUrl;
            img.alt = symbol;
            img.dataset.crypto = currency;
        });

        // Ouvre le modal
        const modalEl = document.getElementById('soldeDetailsModal');
        if (!modalEl) {
            console.error("❌ L'élément #soldeDetailsModal est introuvable !");
            return;
        }
        modalEl.style.display = 'block';

    } catch (err) {
        console.error("❌ Erreur dans loadCryptoDetails():", err);
    }
}

// Dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM chargé");

    // 🔁 Attache les événements aux boutons "Détails"
    const detailBtns = document.querySelectorAll('.solde-details');
    console.log("🔎 Boutons Détails détectés :", detailBtns.length);

    detailBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("👆 Clic sur un bouton Détails");
            loadCryptoDetails();
        });
    });

    // 🖱️ Gère le changement de crypto dans le dropdown
    document.querySelectorAll('.solde-option').forEach(option => {
        option.addEventListener('click', () => {
            // 🔐 On cherche le conteneur actif (mobile ou PC)
            const container = option.closest('.solde-container');
            if (!container) {
                console.warn("⚠️ .solde-container introuvable");
                return;
            }

            const soldeBox = container.querySelector('.solde-box');
            if (!soldeBox) {
                console.warn("⚠️ .solde-box introuvable");
                return;
            }

            const newAmount = option.dataset.amount?.slice(0, 10) || '0.00000000';
            const newIcon = option.dataset.icon || '/images/btc.png';
            const newSymbol = option.dataset.symbol || 'btc';

            // Mise à jour du texte et icône
            soldeBox.querySelector('.solde-amount').textContent = newAmount;
            soldeBox.querySelector('.solde-crypto-icon').src = newIcon;

            // Mise à jour de l'attribut crypto actif
            container.setAttribute('data-crypto', newSymbol);

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

// 🔁 Met à jour le solde affiché dans le header après une action (withdraw, dépôt, jeu, etc.)
async function refreshHeaderBalance(symbol = 'btc') {
    try {
        const res = await fetch(`/api/user/balance?crypto=${symbol}`);
        const data = await res.json();

        if (!data.success) return;

        const newBalance = data.amount;

        // 🔄 Met à jour tous les affichages .solde-amount
        document.querySelectorAll('.solde-amount').forEach(el => {
            el.textContent = newBalance;
        });

        // 🔄 Met à jour la ligne du dropdown
        const option = document.querySelector(`.solde-option[data-symbol="${symbol.toUpperCase()}"]`);
        if (option) {
            option.querySelector("span").textContent = newBalance.slice(0, 10);
            option.dataset.amount = newBalance;
        }
    } catch (err) {
        console.error("❌ Erreur refreshHeaderBalance :", err);
    }
}
