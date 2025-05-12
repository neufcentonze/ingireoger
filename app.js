const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config(); // ✅ Une seule fois
const expressLayouts = require('express-ejs-layouts');
const features = require('./config/features.json');

const app = express();

// 🧠 Middleware de session
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false
});
const buildSidebarPages = require('./middlewares/sidebarBuilder');


app.use((req, res, next) => {
    if (features.global === false) {
        return res.render('maintenance'); // views/maintenance.ejs doit exister
    }
    next();
});

// 📱 Détection mobile (optionnel)
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    res.locals.isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    next();
});


// 📍 Middlewares globaux
app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    res.locals.sidebarCollapsed = false; // tu pourras le rendre dynamique plus tard
    next();
});

app.use(buildSidebarPages); // ✅ Middleware sidebar dynamique
app.use(expressLayouts)


// 🔐 Route pour demander le code admin
app.use("/", require("./routes/admin-code")); // ✅ Route pour recevoir le code via Telegram

// 🖼️ Moteur de template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ➕ Routes
app.use('/auth', require('./routes/auth'));
app.use('/game', require('./routes/game'));
app.use('/transaction', require('./routes/transaction'));
app.use('/reglages', require('./routes/reglages'));
app.use('/webhook', require('./webhooks'));
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes); // ✅
app.use("/", require("./routes/tracker"));
app.use('/', require('./routes/front'));


module.exports = { app, sessionMiddleware };
