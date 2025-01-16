const express = require('express');
const { initiateSTKPush, handleCallback } = require('../controllers/paymentController');
const router = express.Router();

router.post('/stkpush', initiateSTKPush); // STK Push initiation
router.post('/callback', handleCallback); // Callback endpoint

module.exports = router;
