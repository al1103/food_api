const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendFCM = async (token, title, body, data = {}) => {
  const message = {
    token,
    notification: { title, body },
    data,
  };
  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    throw error;
  }
};

module.exports = { sendFCM }; 