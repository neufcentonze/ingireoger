const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const checkFeature = require("../middlewares/checkFeature");

// 🔐 Authentification (protégée par feature toggle)
router.post("/login", checkFeature("login"), authController.login);
router.post("/register", checkFeature("register"), authController.register);
router.get("/logout", authController.logout); // Pas besoin de le bloquer sauf cas extrême

module.exports = router;