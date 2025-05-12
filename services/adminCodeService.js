const crypto = require("crypto");

let codeStore = {
    code: null,
    expiresAt: null
};

exports.generateAdminCode = () => {
    const code = crypto.randomInt(100000, 999999).toString();
    codeStore.code = code;
    codeStore.expiresAt = Date.now() + 15 * 60 * 1000; // 15 min
    return code;
};

exports.verifyAdminCode = (inputCode) => {
    if (!codeStore.code || Date.now() > codeStore.expiresAt) {
        return { valid: false, reason: "expired" };
    }

    if (inputCode !== codeStore.code) {
        return { valid: false, reason: "invalid" };
    }

    return { valid: true };
};
