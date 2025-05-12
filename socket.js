const { Server } = require("socket.io");
const sharedsession = require("express-socket.io-session");
const { getUser } = require("./db");

function setupSocket(server, sessionMiddleware) {
    const io = new Server(server);

    io.use(sharedsession(sessionMiddleware, { autoSave: true }));

    io.use((socket, next) => {
        const session = socket.request.session;
        if (session && session.email) {
            socket.email = session.email;
            return next();
        }
        next(new Error("Unauthorized"));
    });

    io.on("connection", socket => {
        const email = socket.email;

        getUser(email, (err, solde) => {
            if (!err && solde) {
                socket.emit("update-solde", solde);
            }
        });

        // ➕ ici tu peux ajouter tes autres socket.on(...)
    });

    return io;
}

module.exports = setupSocket;
