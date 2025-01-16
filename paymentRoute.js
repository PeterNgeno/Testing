module.exports = (db, mpesa) => ({
  processPayment: async (userId, amount, phoneNumber) => {
    try {
      const phonePattern = /^\+254\d{9}$/;
      if (!phonePattern.test(phoneNumber)) {
        throw new Error('Invalid phone number. It must start with +254 followed by 9 digits.');
      }

      const result = await mpesa.stkPush(userId, amount, phoneNumber);

      const paymentData = {
        userId,
        amount,
        phoneNumber,
        status: result.status,
        paymentDate: new Date().toISOString(),
      };

      await db.collection('payments').add(paymentData);
      return { success: true, result };
    } catch (err) {
      console.error('Error processing payment:', err.message);
      return { success: false, error: err.message };
    }
  },
});
