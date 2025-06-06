const { Server } = require("socket.io");
const sharedsession = require("express-socket.io-session");
const { getUser } = require("./db");
const games = require("./views/Jeux/games");

const cryptoCurrencies = ["btc", "eth", "sol", "ltc"];

const userNames = [
    "CryptoKing", "Player42", "LuckyShot", "DarkDice", "NinjaBet", "FastCash",
    "QueenBet", "BetWizard", "ElPlayero", "CroupierX", "JackpotJoe", "Roulettes"
];


function getRandomCrypto() {
    return cryptoCurrencies[Math.floor(Math.random() * cryptoCurrencies.length)];
}

function getRandomUser() {
    const random = Math.random();
    if (random < 0.9) {
        return "Anonyme"; // 90 %
    } else {
        const randomIndex = Math.floor(Math.random() * userNames.length);
        return userNames[randomIndex]; // 10 %
    }
}

function setupSocket(server, sessionMiddleware) {
    const io = new Server(server, {
        cors: {
            origin: "*", // ⚠️ À sécuriser en production
            methods: ["GET", "POST"]
        }
    });

    const transactions = []; // Historique des 10 dernières transactions

    // Partage la session Express avec socket.io
    io.use(sharedsession(sessionMiddleware, { autoSave: true }));

    // Middleware socket.io pour récupérer l'email (s'il existe)
    io.use((socket, next) => {
        const session = socket.request.session;
        socket.email = session?.email || null;
        next();
    });

    io.on("connection", socket => {
        const email = socket.email;

        // Si l'utilisateur est connecté, on lui envoie son solde
        if (email) {
            getUser(email, (err, solde) => {
                if (!err && solde) {
                    socket.emit("update-solde", solde);
                }
            });
        }

        // Envoie les transactions actuelles
        socket.emit("initialTransactions", transactions);

        // Fonction pour créer une transaction aléatoire intelligente
        function createAndSendTransaction() {
            const game = games[Math.floor(Math.random() * games.length)];
            const bet = parseFloat((Math.random() * (0.05 - 0.001) + 0.001).toFixed(4)); // Montant entre 0.001 et 0.05
            const isWin = Math.random() < 0.5; // 50% chance de gagner
            const currency = getRandomCrypto();

            let multiplier = 0;
            let payout = -bet;

            if (isWin) {
                multiplier = parseFloat((Math.random() * 9.9 + 0.1).toFixed(2)); // vrai multiplicateur
                payout = parseFloat((bet * multiplier).toFixed(4));
            }

            const data = {
                game: game.name,
                user: getRandomUser(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                betAmount: `${bet.toFixed(4)} ${currency}`,
                multiplier: `${isWin ? multiplier.toFixed(2) : "0.00"}x`,
                payout: `${isWin ? `+${payout.toFixed(4)}` : `-${bet.toFixed(4)}`} ${currency}`,
                isWin: isWin
            };

            if (transactions.length >= 10) {
                transactions.shift();
            }
            transactions.push(data);

            socket.emit("newTransaction", data);

            const delay = Math.floor(Math.random() * (30000 - 2000 + 1)) + 2000;
            timeout = setTimeout(createAndSendTransaction, delay);
        }


        // Démarre la boucle de transactions après 1s
        let timeout = setTimeout(createAndSendTransaction, 1000);

        // Nettoyage à la déconnexion
        socket.on("disconnect", () => {
            clearTimeout(timeout);
        });
    });

    return io;
}

module.exports = setupSocket;
