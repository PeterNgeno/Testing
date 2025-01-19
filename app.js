const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Render the payment form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// Handle STK Push
app.post('/pay', async (req, res) => {
    const phoneNumber = req.body.phoneNumber;

    // Validate phone number (ensure it starts with +254)
    if (!phoneNumber || !phoneNumber.startsWith('+254')) {
        return res.status(400).send('Invalid phone number. Please use the format +254xxxxxxxxx.');
    }

    // M-Pesa sandbox credentials (hardcoded for testing)
    const consumerKey = 'guO0rm165Vt8gARvEG4a7GTwy0ATHc1RxG6TSLgyAsh5NeZF';
    const consumerSecret = 'xz8evol1G1OdUzHGTve4hPBIUQASJK1hMy1PdPWf4ozgAKgYRLPgtU4fAVZl47Gq';
    const shortcode = '174379';  // Default sandbox shortcode
    const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2bdfca4d2b03e50acf54b1c3998bdb55';
    const callbackUrl = 'https://testing-gold-two.vercel.app/mpesa/callback';  // Use the actual callback URL

    try {
        // Obtain access token
        const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            auth: {
                username: consumerKey,
                password: consumerSecret,
            },
        });
        const accessToken = tokenResponse.data.access_token;

        // Generate password
        const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
        const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

        // Initiate STK Push
        const stkResponse = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: 1,  // Modify the amount as needed
                PartyA: phoneNumber,
                PartyB: shortcode,
                PhoneNumber: phoneNumber,
                CallBackURL: callbackUrl,
                AccountReference: 'Quiz Payment',
                TransactionDesc: 'Pay to Access Quiz',
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.send('STK Push initiated. Please check your phone to complete the payment.');
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Error initiating payment. Please try again later.');
    }
});

// Handle M-Pesa callback
app.post('/mpesa/callback', (req, res) => {
    console.log('M-Pesa Callback:', req.body);
    res.status(200).send('Callback received');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
