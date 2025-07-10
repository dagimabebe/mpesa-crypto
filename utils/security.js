
const crypto = require('crypto');
const config = require('../config');

module.exports = {
  // Hash data with system salt
  hashData: (data) => {
    return crypto.createHmac('sha256', config.crypto.systemSalt)
      .update(data)
      .digest('hex');
  },

  // Encrypt text with AES-256-GCM
  encrypt: (text, secret = config.jwt.secret) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm', 
      Buffer.from(secret.substring(0, 32)),
      iv
    );
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  },

  // Decryption the text with AES-256-GCM
  decrypt: (encryptedText, secret = config.jwt.secret) => {
    const data = Buffer.from(encryptedText, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      Buffer.from(secret.substring(0, 32)),
      iv
    );
    decipher.setAuthTag(tag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  },

  generateRandom: (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
  },

  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>"'`]/g, '');
  }
};
