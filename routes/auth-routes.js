
const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth-service');
const MpesaService = require('../services/mpesa-service');
const { User, Wallet } = require('../models');
const config = require('../config');
const jwt = require('jsonwebtoken');

const authService = new AuthService();
const mpesaService = new MpesaService();


router.post('/register', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!/^2547\d{8}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid Kenyan phone number format' });
    }


    const existingUser = await User.findOne({ hashedPhone: authService._hashPhone(phone) });
    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }


    const verification = await authService.verifyUserWithMpesa(phone);
    

    await new User({
      phone,
      hashedPhone: authService._hashPhone(phone),
      verificationStatus: 'pending',
      verificationReference: verification.referenceCode,
      checkoutRequestID: verification.checkoutRequestID
    }).save();

    res.json({
      message: 'Verification request sent to your phone',
      reference: verification.referenceCode
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


router.post('/mpesa-callback', async (req, res) => {
  try {
    // Process callback
    const callbackResult = await mpesaService.processPaymentCallback(req);
    
    if (!callbackResult.success) {
      console.error('Payment failed:', callbackResult.error);
      return res.status(400).json(callbackResult);
    }


    const user = await User.findOne({ 
      verificationReference: callbackResult.reference 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

   
    user.verificationStatus = 'verified';
    user.verifiedAt = new Date();
    await user.save();

   
    const walletData = authService.initializeCryptoWallet(user.hashedPhone);
    
    
    await new Wallet({
      userId: user._id,
      address: walletData.address,
      encryptedSeed: walletData.walletSeed,
      currency: walletData.currency
    }).save();

    const token = authService.generateAuthToken(user.hashedPhone);

    // welcome email/SMS
    console.log(`User ${user.phone} verified successfully`);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// 3. Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const hashedPhone = authService._hashPhone(phone);
    
 
    const user = await User.findOne({ hashedPhone });
    if (!user || user.verificationStatus !== 'verified') {
      return res.status(401).json({ error: 'User not verified' });
    }

    
    const token = authService.generateAuthToken(hashedPhone);

    res.json({ 
      token,
      userId: user._id,
      wallet: await Wallet.findOne({ userId: user._id })
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

//  Profile Endpoint
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const wallet = await Wallet.findOne({ userId: user._id });
    
    res.json({
      phone: user.phone,
      verifiedAt: user.verifiedAt,
      walletAddress: wallet.address,
      currency: wallet.currency
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Profile retrieval failed' });
  }
});

// JWT shits
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = router;
