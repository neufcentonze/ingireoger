const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {

  console.log(req.session)

  res.render('home', {
    title: "Djelo",
    layout: 'layouts/front-layout', // ✅ c’est cette ligne qui applique le layout
    // isLoggedIn: !!req.session?.user,
    isLoggedIn: true,
    userBalance: req.session?.balance || "0.00000000",
    successMessage: req.session?.success || null
  });
});

module.exports = router;