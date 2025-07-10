
require('dotenv').config();

module.exports = {
  mpesa: {
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY,
    validationKey: process.env.MPESA_VALIDATION_KEY || 'your_validation_secret'
  },
  server: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    port: process.env.PORT || 3000
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_ultra_secure_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  crypto: {
    systemSalt: process.env.SYSTEM_SALT || 'secure_system_salt_value',
    defaultAsset: process.env.DEFAULT_CRYPTO_ASSET || 'ETH'
  }
};
