const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const expressLayouts = require('express-ejs-layouts');
const features = require('./config/features.json');
const sidebarConfig = require('./config/sidebarConfig.json');

const app = express();

// 🧠 Middleware de session
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false
});
const buildSidebarPages = require('./middlewares/sidebarBuilder');

// 🔧 Maintenance
app.use((req, res, next) => {
    const allowedDuringMaintenance = [/^\/admin/, /^\/auth/, /^\/webhook/];
    if (features.global === false) {
        const isAllowed = allowedDuringMaintenance.some(pattern =>
            pattern.test(req.path)
        );
        if (!isAllowed) {
            return res.render("maintenance");
        }
    }
    next();
});

// 📱 Détection mobile
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    res.locals.isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    next();
});

// 🌐 Injection sidebar globale
app.use((req, res, next) => {
    res.locals.categories = sidebarConfig;
    res.locals.isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
    res.locals.sidebarCollapsed = false;
    next();
});

// 📍 Middlewares globaux
app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(buildSidebarPages); // Si tu veux garder le contenu dynamique des sous-pages
app.use(expressLayouts);

// Routes
app.use("/", require("./routes/admin-code"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use('/auth', require('./routes/auth'));
app.use('/game', require('./routes/game'));
app.use('/wallet', require('./routes/wallet'));
app.use('/reglages', require('./routes/reglages'));
app.use('/webhook', require('./webhooks'));
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/tracker"));
app.use('/', require('./routes/front'));
app.use('/api', require('./routes/api'));

module.exports = { app, sessionMiddleware };