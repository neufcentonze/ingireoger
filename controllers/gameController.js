const { getUser } = require("../services/userService");
const { updateBalance } = require("../services/balanceService")
const { logTransaction } = require("../services/transactionService")
const { getCryptoPriceInEur } = require("../services/cryptoService");
const roundIfNeeded = require("../utils/roundIfNeeded");

exports.playDice = async (req, res) => {
    const email = req.session?.user?.email;
    const { bet, crypto, faces } = req.body;

    if (!email) return res.status(401).json({ error: "Non connecté" });
    // if (!bet || !crypto || !Array.isArray(faces)) {
    //     return res.status(400).json({ error: "Paramètres invalides" });
    // }

    // const diceRoll = Math.floor(Math.random() * 6) + 1;
    // const win = faces.includes(diceRoll);
    // const multiplier = (6 / faces.length) * 0.99;
    // const rawGain = bet * multiplier;
    // const totalGain = win ? roundIfNeeded(rawGain) : 0;
    // const gain = win ? roundIfNeeded(totalGain - bet) : 0;

    // const currentPriceEur = await getCryptoPriceInEur(crypto);

    // getUser(email, (err, solde) => {
    //     if (err || !solde) return res.status(500).json({ error: "Erreur utilisateur" });

    //     const userSolde = solde[crypto];
    //     if (userSolde === undefined) return res.status(400).json({ error: "Crypto inconnue" });

    //     if (userSolde < bet) return res.status(400).json({ error: "Solde insuffisant" });

    //     updateBalance({
    //         email,
    //         currency: crypto,
    //         computeOrValue: current => roundIfNeeded(current - bet + totalGain),
    //         type: "games",
    //         game: "dice",
    //         bet,
    //         callback: (err2) => {
    //             if (err2) return res.status(500).json({ error: "Erreur maj solde" });

    //             const type = win ? "gain" : "perte";
    //             const montant = win ? gain : bet;
    //             logTransaction(email, crypto, montant, type, () => { }, "dice", bet, bet * currentPriceEur);

    //             res.json({
    //                 result: diceRoll,
    //                 win,
    //                 gain,
    //                 multiplier,
    //                 totalGain,
    //             });
    //         }
    //     });
    // });
    return res.json({
        result: 4,             // 🎲 face sortie du dé (1 à 6)
        gain: 0,          // 💰 gain obtenu (peut être 0 si perdu)
        multiplier: 1,      // 📈 multiplicateur appliqué
        newSolde: 0,  // 💼 nouveau solde utilisateur
        sound: true            // 🔊 (optionnel) pour déclencher les sons client
    });
};

exports.startDetective = (req, res) => {
    const { bet, crypto, difficulty } = req.body;
    const email = req.session.email;

    if (!email || !bet || !crypto || !difficulty) {
        return res.status(400).json({ error: "Paramètres manquants" });
    }

    const difficultyMap = {
        facile: 2,
        moyen: 3,
        difficile: 4
    };

    const charCount = difficultyMap[difficulty];
    if (!charCount) return res.status(400).json({ error: "Difficulté invalide" });

    const imagesPath = path.join(__dirname, "..", "public", "images", "personnages");
    const allCharacters = fs.readdirSync(imagesPath).filter(file => /\.(jpg|png)$/i.test(file));

    const selected = allCharacters.sort(() => 0.5 - Math.random()).slice(0, charCount);
    const suspect = selected[Math.floor(Math.random() * selected.length)];

    // Stocke la session de jeu
    req.session.detective = {
        bet: parseFloat(bet),
        crypto,
        difficulty,
        charCount,
        gain: parseFloat(bet),
        round: 1,
        suspect,
        choices: selected
    };

    res.json({
        round: 1,
        choices: selected,
        message: "Manche 1 lancée"
    });
};

// Deviner le suspect
exports.detectiveGuess = (req, res) => {
    const { guess } = req.body;
    const game = req.session.detective;

    if (!game || !guess) return res.status(400).json({ error: "Partie non trouvée ou réponse manquante" });

    const isCorrect = guess === game.suspect;

    if (!isCorrect) {
        req.session.detective = null;
        return res.json({ success: false, message: "Raté ! Partie terminée.", gameOver: true });
    }

    game.round++;
    game.gain = parseFloat((game.gain * 1.9).toFixed(8));

    const imagesPath = path.join(__dirname, "..", "public", "images", "personnages");
    const allCharacters = fs.readdirSync(imagesPath).filter(file => /\.(jpg|png)$/i.test(file));

    const selected = allCharacters.sort(() => 0.5 - Math.random()).slice(0, game.charCount);
    const suspect = selected[Math.floor(Math.random() * selected.length)];

    game.choices = selected;
    game.suspect = suspect;

    res.json({
        success: true,
        round: game.round,
        gain: game.gain,
        choices: selected,
        message: "Bonne réponse ! Manche suivante"
    });
};

// Encaisser le gain
exports.detectiveCashout = (req, res) => {
    const email = req.session.email;
    const game = req.session.detective;

    if (!game || !email) return res.status(400).json({ error: "Aucune partie à encaisser" });

    const netGain = roundIfNeeded(game.gain - game.bet);
    if (netGain <= 0) {
        req.session.detective = null;
        return res.status(400).json({ error: "Gain insuffisant pour encaisser" });
    }

    updateBalance(email, game.crypto, current => roundIfNeeded(current + netGain), (err) => {
        if (err) return res.status(500).json({ error: "Erreur mise à jour solde" });

        logTransaction(email, game.crypto, netGain, "gain", () => { }, "detective");

        req.session.detective = null;
        res.json({ success: true, gain: netGain });
    });
}; 