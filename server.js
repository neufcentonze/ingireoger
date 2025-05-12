const http = require("http");
require("dotenv").config()
const { app, sessionMiddleware } = require("./app");
const setupSocket = require("./socket");

// 🌐 Création du serveur HTTP
const server = http.createServer(app);

// 💬 Initialisation de Socket.IO
const io = setupSocket(server, sessionMiddleware);

// 🔥 Lancement du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur actif sur http://localhost:${PORT}`);
});
