const db = require('./index');

db.serialize(() => {
    // 🔐 Utilisateurs
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            username TEXT UNIQUE,
            firstname TEXT,
            lastname TEXT,
            birthdate TEXT,
            telegram TEXT,
            cniCheck INTEGER DEFAULT 0,
            kyc_status TEXT DEFAULT '{}'
        )
    `);

    // 💰 Soldes par crypto
    db.run(`
        CREATE TABLE IF NOT EXISTS solde (
            email TEXT UNIQUE,
            btc REAL DEFAULT 0,
            eth REAL DEFAULT 0,
            sol REAL DEFAULT 0,
            ltc REAL DEFAULT 0
        )
    `);

    // 💸 Transactions (gains, pertes, dépôts...)
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            currency TEXT,
            amount REAL,
            type TEXT, -- gain, perte, depot, withdrawal, bonus
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            game TEXT,
            bet REAL,
            amount_eur REAL,
            bet_eur REAL
        )
    `);

    // 🎁 Bonus
    db.run(`
    CREATE TABLE IF NOT EXISTS bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        type TEXT,                    -- 'bonus', 'streamer', 'standard'
        amount REAL,                 
        amount_eur REAL,
        currency TEXT,
        reason TEXT,
        status TEXT,                 -- 'active', 'used', etc.
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 🎯 Champs liés au wagering
        wager_type TEXT,             -- 'standard', 'bonus', 'streamer'
        wager_factor INTEGER,        -- 1, 10, 50 selon le type
        wager_target REAL,           -- Montant total à miser (calculé)
        wager_progress REAL DEFAULT 0.0, -- Ce que l’utilisateur a déjà misé
        wager_status TEXT DEFAULT 'in_progress' -- 'in_progress', 'completed', etc.
        );
    `);

    // 🧾 Adresses assignées
    db.run(`
        CREATE TABLE IF NOT EXISTS crypto_assignments (
            email TEXT,
            currency TEXT,
            address TEXT UNIQUE,
            assignedAt INTEGER
        )
    `);

    // 🎫 Tickets support
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT,
            username TEXT,
            email TEXT,
            sujet TEXT,
            status TEXT DEFAULT 'ouvert',
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 📩 Messages dans les tickets
    db.run(`
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER,
            from_user INTEGER, -- 1 = user, 0 = staff
            message TEXT,
            file_path TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 📊 Résultats partagés
    db.run(`
        CREATE TABLE IF NOT EXISTS shared_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            username TEXT,
            game TEXT,
            crypto TEXT,
            result INTEGER,
            multiplier REAL,
            gain REAL,
            faces TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 🔒 Code admin temporaire
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_codes (
            code TEXT,
            expiresAt INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS trackers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            active BOOLEAN DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            clicks INTEGER DEFAULT 0
        );
    `)

    db.run(`
        CREATE TABLE IF NOT EXISTS tracker_clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracker_id INTEGER,
            ip TEXT,
            country TEXT,
            countryCode TEXT,
            device TEXT,
            browser TEXT,
            blocked INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `)

    db.run(`
        CREATE TABLE IF NOT EXISTS available_addresses(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT UNIQUE,
            currency TEXT,
            assigned INTEGER DEFAULT 0,
            email TEXT,
            assignedAt INTEGER,
            ip TEXT
        );
    `)

    console.log("✅ Schéma de la base de données initialisé.");
});
