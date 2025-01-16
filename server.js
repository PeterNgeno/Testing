const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.post('/api/payments/initiate', async (req, res) => {
    const { phoneNumber } = req.body; // User phone number (e.g., +2547XXXXXXXXX)
    const amount = 1;  // Payment amount (Ksh 1)

    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const shortcode = process.env.LIPA_NA_MPESA_SHORTCODE;
    const lipaNaMpesaOnlineShortcodeKey = process.env.LIPA_NA_MPESA_ONLINE_SHORTCODE_KEY;

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };

    try {
        const tokenResponse = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', { headers });
        const accessToken = tokenResponse.data.access_token;

        const payload = {
            BusinessShortcode: shortcode,
            LipaNaMpesaOnlineShortcodeKey: lipaNaMpesaOnlineShortcodeKey,
            PhoneNumber: phoneNumber,
            AccountReference: 'SANGPOINT',
            TransactionDesc: 'Payment for quiz section',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: shortcode,
            Shortcode: shortcode,
            LipaNaMpesaShortcodeKey: lipaNaMpesaOnlineShortcodeKey
        };

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
