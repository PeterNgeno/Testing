const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like index.html

// Daraja API sandbox credentials
const consumerKey = "guO0rm165Vt8gARvEG4a7GTwy0ATHc1RxG6TSLgyAsh5NeZF"; // Replace with your sandbox consumer key
const consumerSecret = "your_sandbox_consumer_secret"; // Replace with your sandbox consumer secret
const shortcode = "174379"; // Default Daraja sandbox shortcode
const passkey =
  "bfb279f9aa9bdbcf158e97dd71a467cd2c2f86f45d254c546e8f505de918c260"; // Default Daraja sandbox passkey
const callbackURL = "https://testing-gold-two.vercel.app/callback"; // Ensure this URL is accessible

// Generate Safaricom API token
const generateToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", // Sandbox endpoint
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
      AccountReference: "TestAccount",
      TransactionDesc: "TestTransaction",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", // Sandbox endpoint
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
    res.status(500).json({
      success: false,
      message: "STK Push failed.",
      error: error.response ? error.response.data : error.message,
    });
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
    console.error("Token Generation Error:", err.response ? err.response.data : err.message);
  }
})();
