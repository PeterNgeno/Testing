const axios = require('axios');

const initiatePayment = async (req, res) => {
    const { phoneNumber } = req.body;
    const amount = 1;

    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const shortcode = process.env.LIPA_NA_MPESA_SHORTCODE;
    const lipaNaMpesaOnlineShortcodeKey = process.env.LIPA_NA_MPESA_ONLINE_SHORTCODE_KEY;

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const tokenResponse = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        });

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
};

module.exports = { initiatePayment };
