const express = require("express");
const router = express.Router();

router.post("/btc", require("../webhooks/btcWebhook"));
router.post("/ltc", require("../webhooks/ltcWebhook"));

module.exports = router;
