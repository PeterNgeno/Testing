const { initiateMpesaSTK, saveTransaction } = require('../services/darajaService');

exports.initiateSTKPush = async (req, res, next) => {
  try {
    const { phoneNumber, amount } = req.body;
    const result = await initiateMpesaSTK(phoneNumber, amount);
    res.status(200).json({ success: true, message: 'STK Push sent', data: result });
  } catch (error) {
    next(error);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const transaction = req.body;
    await saveTransaction(transaction);
    res.status(200).json({ success: true, message: 'Callback received' });
  } catch (error) {
    next(error);
  }
};
