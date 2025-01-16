const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// STK Push API - Initiating payment
app.post('/api/payments/initiate', async (req, res) => {
    const { phoneNumber } = req.body; // User phone number (e.g., +2547XXXXXXXXX)
    const amount = 1;  // Payment amount (Ksh 1)
    
    // Retrieve your credentials from the environment variables
    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const shortcode = process.env.LIPA_NA_MPESA_SHORTCODE;
    const lipaNaMpesaOnlineShortcodeKey = process.env.LIPA_NA_MPESA_ONLINE_SHORTCODE_KEY;
    
    // Authenticate with Safaricom API to get an access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };

    try {
        // Step 1: Get Access Token
        const tokenResponse = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', { headers });
        const accessToken = tokenResponse.data.access_token;
        
        // Step 2: Prepare the STK Push payload
        const payload = {
            BusinessShortcode: shortcode,
            LipaNaMpesaOnlineShortcodeKey: lipaNaMpesaOnlineShortcodeKey,
            PhoneNumber: phoneNumber, // The phone number to send the STK Push request
            AccountReference: 'SANGPOINT',  // Reference for the transaction
            TransactionDesc: 'Payment for quiz section', // Transaction description
            Amount: amount, // Payment amount
            PartyA: phoneNumber, // User's phone number
            PartyB: shortcode, // Shortcode of your business
            Shortcode: shortcode, // Shortcode of your business
            LipaNaMpesaShortcodeKey: lipaNaMpesaOnlineShortcodeKey // Passkey for the business
        };

        // Step 3: Initiate the STK Push request
        const stkPushResponse = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (stkPushResponse.status === 200) {
            res.json({ success: true, message: 'Payment initiated. Please check your phone for payment confirmation.' });
        } else {
            res.json({ success: false, message: 'Payment initiation failed.' });
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.json({ success: false, message: 'Payment failed. Please try again later.' });
    }
});

// Callback route to receive payment status
app.post('/api/payments/callback', (req, res) => {
    const { Body } = req.body;

    if (Body.stkCallback) {
        const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

        if (ResultCode === 0) {
            console.log('Payment successful:', CallbackMetadata);
        } else {
            console.log('Payment failed:', ResultDesc);
        }
    }

    res.status(200).json({ message: 'Callback received and processed' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
