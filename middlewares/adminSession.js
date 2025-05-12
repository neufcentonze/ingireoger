// middlewares/adminSession.js
module.exports = function checkAdminSession(req, res, next) {
    if (!req.session || !req.session.adminValidated) {
        return res.redirect("/admin"); // redirige vers page de saisie du code
    }
    next();
};
