
async initiateB2CPayment(phone, amount, reference) {
  await this.getAccessToken();
  
  const payload = {
    InitiatorName: config.mpesa.initiatorName,
    SecurityCredential: this._getSecurityCredential(),
    CommandID: 'BusinessPayment',
    Amount: amount,
    PartyA: config.mpesa.businessShortCode,
    PartyB: phone,
    Remarks: `Crypto withdrawal: ${reference}`,
    QueueTimeOutURL: `${config.server.baseUrl}/api/mpesa/b2c-timeout`,
    ResultURL: `${config.server.baseUrl}/api/mpesa/b2c-result`,
    Occasion: 'Withdrawal'
  };

  try {
    const response = await axios.post(
      `${config.mpesa.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      transactionId: response.data.ConversationID,
      response: response.data
    };
  } catch (error) {
    console.error('B2C error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || 'B2C payment failed'
    };
  }
}

_getSecurityCredential() {

  const initiatorPassword = config.mpesa.initiatorPassword;
  const publicKey = fs.readFileSync(config.mpesa.certPath, 'utf8');
  
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    Buffer.from(initiatorPassword)
  ).toString('base64');
}
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class MpesaService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  generatePassword() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    
    return Buffer.from(
      `${config.mpesa.businessShortCode}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
    ).toString('base64');

    try {
      const response = await axios.get(
        `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${credentials}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('M-Pesa token error:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  async initiateSTKPush(phone, amount, reference) {
    await this.getAccessToken();
    
    const payload = {
      BusinessShortCode: config.mpesa.businessShortCode,
      Password: this.generatePassword(),
      Timestamp: new Date()
        .toISOString()
        .replace(/[-:T.]/g, '')
        .slice(0, 14),
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: config.mpesa.businessShortCode,
      PhoneNumber: phone,
      CallBackURL: `${config.server.baseUrl}/api/mpesa/callback`,
      AccountReference: reference,
      TransactionDesc: 'Crypto Wallet Funding'
    };

    try {
      const response = await axios.post(
        `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        message: response.data.ResponseDescription
      };
    } catch (error) {
      console.error('STK Push error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || 'STK Push failed'
      };
    }
  }

  // M-Pesa callback
  validateCallback(callbackData) {
    //signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = crypto.createHmac('sha256', config.mpesa.validationKey)
        .update(JSON.stringify(callbackData))
        .digest('base64');
      
      if (signature !== callbackData.headers['x-mpesa-signature']) {
        throw new Error('Invalid callback signature');
      }
    }
    
    return callbackData.body;
  }

  //payment callback... 
  processPaymentCallback(callbackData) {
    const result = this.validateCallback(callbackData);
    
    if (result.ResultCode !== 0) {
      return {
        success: false,
        error: result.ResultDesc,
        resultCode: result.ResultCode
      };
    }

    const metadata = result.CallbackMetadata?.Item || [];
    const getValue = (index) => metadata.find(item => item.Name === `Value${index}`)?.Value;

    return {
      success: true,
      amount: getValue(0),
      mpesaReceipt: getValue(1),
      phone: getValue(2),
      reference: getValue(3),
      transactionDate: getValue(4),
      merchantRequestID: result.MerchantRequestID,
      checkoutRequestID: result.CheckoutRequestID
    };
  }
}

module.exports = MpesaService;
