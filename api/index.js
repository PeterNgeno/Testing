const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const app = express();

require("dotenv").config();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));

// Render the payment form
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../views", "index.html"));
});

// Middleware to generate access token
const generateAccessToken = async (req, res, next) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const { data } = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    req.accessToken = data.access_token;
    next();
  } catch (error) {
    console.error("Access Token Error:", error.message);
    res.status(400).json({ message: "Failed to generate access token." });
  }
};

app.use(generateAccessToken);

app.get("/token", generateAccessToken, (req, res) => {
  res.json({ accessToken: req.accessToken });
});

// STK Push payment route
app.post("/pay", generateAccessToken, async (req, res) => {
  const phoneNumber = req.body.phoneNumber.trim().replace(/\s+/g, "");
  const amount = req.body.amount;

  // Replace leading 0 with 254
  const formattedPhoneNumber = phoneNumber.startsWith("0")
    ? "254" + phoneNumber.slice(1)
    : phoneNumber;

  // Validate phone number (ensure it starts with 254)
  const phoneRegex = /^254\d{9}$/;
  if (!formattedPhoneNumber || !phoneRegex.test(formattedPhoneNumber)) {
    return res
      .status(400)
      .send(
        `Invalid phone number. Please use the format 254xxxxxxxxx. Received: ${formattedPhoneNumber}`
      );
  }

  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;
  const callbackUrl = process.env.CALLBACK_URL;

  try {
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const password = Buffer.from(shortcode + passkey + timestamp).toString(
      "base64"
    );

    const stkResponse = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhoneNumber,
        PartyB: shortcode,
        PhoneNumber: formattedPhoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: "PERON TIPS LTD",
        TransactionDesc: "Pay to Access Quiz",
      },
      {
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        },
      }
    );

    res.status(200).json({
      message:
        "STK Push initiated. Please check your phone to complete the payment.",
      stkResponse: stkResponse.data,
    });
  } catch (error) {
    console.error("STK Push error:", error.message);
    res.status(400).json({
      message: "Error initiating payment. Please try again later.",
      error: error.response?.data || error.message,
    });
  }
});

// Handle M-Pesa callback
app.post("/callback", (req, res) => {
  console.log("M-Pesa Callback:", req.body);
  const callbackData = req.body;

  if (!callbackData.Body?.stkCallback?.CallbackMetadata) {
    console.log("Callback Error Data:", callbackData.Body);
    return res.status(400).send("Invalid callback data");
  }

  const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
  const phone = metadata.find((item) => item.Name === "PhoneNumber")?.Value;
  const amount = metadata.find((item) => item.Name === "Amount")?.Value;
  const trax_id = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value;

  console.log("Response data:", { phone, amount, trax_id });
  res.status(200).send("Callback received");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
