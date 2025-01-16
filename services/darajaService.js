const axios = require('axios');

const generateAccessToken = async () => {
  const credentials = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${credentials}` },
  });
  return response.data.access_token;
};

const initiateMpesaSTK = async (phoneNumber, amount) => {
  const accessToken = await generateAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '');
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: 'TestAPI',
      TransactionDesc: 'Payment',
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
};

const saveTransaction = async (transaction) => {
  console.log('Saving transaction:', transaction);
};

module.exports = { initiateMpesaSTK, saveTransaction };
