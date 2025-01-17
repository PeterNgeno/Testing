const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like index.html

// Daraja API credentials
const consumerKey = "F9vcsSTCL9UnAurbhDyeFFtJpFPLmumfpsNEfx2cuBZajfI6";
const consumerSecret = "xz8evol1G1OdUzHGTve4hPBIUQASJK1hMy1PdPWf4ozgAKgYRLPgtU4fAVZl47Gq";
const shortcode = "5482174";
const passkey = "b66e0843a832196d3b5afe708a4c6bb7b00b23651f2da65a0e63b75f3bb0c65a";
const callbackURL = "https://testing-gold-two.vercel.app/callback"; // Your domain's callback URL

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
    console.error("Error initiating STK Push:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: "STK Push failed.", error: error.response.data });
  }
});

// Handle Callback from Safaricom
app.post("/callback", (req, res) => {
  try {
    const callbackData = req.body;
    console.log("Callback Data:", JSON.stringify(callbackData));

    // Process the callback data as required
    res.status(200).send("Callback received successfully");
  } catch (error) {
    console.error("Error handling callback:", error.message);
    res.status(500).send("Error handling callback");
  }
});

// Test Callback URL
app.get("/callback", (req, res) => {
  res.send("Callback URL is reachable!");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
(async () => {
  try {
    const token = await generateToken();
    console.log("Generated Token:", token);
  } catch (err) {
    console.error("Token Generation Error:", err.response.data);
  }
})();
