// webhooks/index.js
const express = require('express');
const router = express.Router();

router.post('/btc', require('./btcWebhook'));
router.post('/ltc', require('./ltcWebhook'));

module.exports = router;
