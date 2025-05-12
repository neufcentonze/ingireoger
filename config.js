require("dotenv").config();

module.exports = {
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    TELEGRAM_THREAD_LOG: process.env.TELEGRAM_THREAD_LOG,

    SESSION_SECRET: process.env.SESSION_SECRET || "defaultSecret",

    WEBHOOK_SECRET_TOKEN: process.env.WEBHOOK_SECRET_TOKEN,
    STAFF_THREAD_ID: parseInt(process.env.STAFF_THREAD_ID) || 0,
    STAFF_CHAT_ID: parseInt(process.env.STAFF_CHAT_ID) || 0,
};