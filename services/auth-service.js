
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { createHmac } = require('crypto');

// Configuration stuff mainy on env file.........
const CONFIG = {
  MPESA_CONSUMER_KEY: 'YOUR_MPESA_CONSUMER_KEY',
  MPESA_CONSUMER_SECRET: 'YOUR_MPESA_CONSUMER_SECRET',
  MPESA_BUSINESS_SHORTCODE: '174379',
  MPESA_PASSKEY: 'YOUR_MPESA_PASSKEY',
  JWT_SECRET: 'your_ultra_secure_jwt_secret',
  JWT_EXPIRES_IN: '1d',
  SYSTEM_SALT: 'secure_system_salt_value',
  CRYPTO_CURRENCY: 'ETH' 
};

class AuthService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  // 1. M-Pesa User Verification
  async verifyUserWithMpesa(phoneNumber) {
    try {
      // Generate unique reference code
      const referenceCode = `CRYPTO-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      
      // Trigger STK Push
      const stkResponse = await this._initiateSTKPush(phoneNumber, referenceCode);
      
      return {
        success: true,
        message: 'Payment request sent to your phone',
        referenceCode,
        checkoutRequestID: stkResponse.CheckoutRequestID
      };
    } catch (error) {
      console.error('MPesa verification error:', error);
      throw new Error('Failed to initiate M-Pesa verification');
    }
  }

  // 2. Handle M-Pesa Callback (Webhook)
  async handleMpesaCallback(callbackData) {
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    
    if (resultCode !== 0) {
      console.error('MPesa payment failed:', callbackData.Body.stkCallback.ResultDesc);
      return { verified: false };
    }

    // Extract payment details
    const metadata = callbackData.Body.stkCallback.CallbackMetadata;
    const amount = metadata.Item[0].Value;
    const mpesaReceipt = metadata.Item[1].Value;
    const phone = metadata.Item[4].Value;
    const referenceCode = metadata.Item[2].Value; // Our custom reference

    // Create hashed phone identifier
    const hashedPhone = this._hashPhone(phone);

    return {
      verified: true,
      hashedPhone,
      amount,
      mpesaReceipt,
      referenceCode
    };
  }

  // 3. Generate JWT Token
  generateAuthToken(hashedPhone) {
    return jwt.sign(
      { sub: hashedPhone, iat: Date.now() },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );
  }

  initializeCryptoWallet(hashedPhone) {
    const walletSeed = crypto.randomBytes(32).toString('hex');
    const address = this._generateWalletAddress(walletSeed);
    
    return {
      hashedPhone,
      walletSeed: this._encryptWalletSeed(walletSeed),
      address,
      currency: CONFIG.CRYPTO_CURRENCY,
      createdAt: new Date()
    };
  }

  // --- Helper Methods stuffffff ---
  
  async _initiateSTKPush(phone, referenceCode) {
    await this._getMpesaToken();
    
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    
    const password = Buffer.from(
      `${CONFIG.MPESA_BUSINESS_SHORTCODE}${CONFIG.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: CONFIG.MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, 
      PartyA: phone,
      PartyB: CONFIG.MPESA_BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: 'https://yourdomain.com/api/mpesa-callback',
      AccountReference: referenceCode,
      TransactionDesc: 'Crypto Wallet Verification'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async _getMpesaToken() {
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${CONFIG.MPESA_CONSUMER_KEY}:${CONFIG.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`
        }
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiration = Date.now() + (response.data.expires_in * 1000);
    return this.accessToken;
  }

  _hashPhone(phone) {
    return createHmac('sha256', CONFIG.SYSTEM_SALT)
      .update(phone)
      .digest('hex');
  }

  _generateWalletAddress(seed) {

    return `0x${crypto.createHash('sha256')
      .update(seed)
      .digest('hex')
      .substring(0, 40)}`;
  }

  _encryptWalletSeed(seed) {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm', 
      Buffer.from(CONFIG.JWT_SECRET.substring(0, 32)),
      crypto.randomBytes(12)
    );
    return cipher.update(seed, 'utf8', 'hex') + cipher.final('hex');
  }
}

module.exports = AuthService;
