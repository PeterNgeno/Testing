const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like index.html

// Daraja API credentials (use environment variables for security)
const consumerKey = "F9vcsSTCL9UnAurbhDyeFFtJpFPLmumfpsNEfx2cuBZajfu4";
const consumerSecret = "TFYNehMxAjfvmFbHmnDGV2EuKhplVWKGiqAP5bFc1QRgrzZC9BUoZMX2HH2SyNhE";
const shortcode = "5482174";
const passkey = "b66e0843a832196d3b5afe708a4c6bb7b00b23651f2da65a0e63b75f323tre1";
const callbackURL = "https://yourdomain.com/callback"; // Replace with your callback URL

// Generate Safaricom API token
const generateToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await axios.get(
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  return response.data.access_token;
};

// Initiate STK Push
app.post("/api/stkpush", async (req, res) => {
  const { phoneNumber, amount } = req.body;

  try {
    const token = await generateToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackURL,
      AccountReference: "STK Push Test",
      TransactionDesc: "Test Payment",
    };

    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );

    res.json({
      success: true,
      message: "STK Push request sent. Check your phone to complete the transaction.",
      data: response.data,
    });
  } catch (error) {
    console.error("Error initiating STK Push:", error.response.data);
    res.status(500).json({ success: false, message: "STK Push failed.", error: error.response.data });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
