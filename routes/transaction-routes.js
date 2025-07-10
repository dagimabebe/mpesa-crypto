
const express = require('express');
const router = express.Router();
const TransactionService = require('../services/transaction-service');
const { authenticateToken } = require('./auth-routes'); // Reuse auth middleware

const transactionService = new TransactionService();


router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum deposit is KSh 10' });
    }

    const result = await transactionService.depositCrypto(req.user.userId, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, phone } = req.body;
    
    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Minimum withdrawal is KSh 50' });
    }
    
    if (!/^2547\d{8}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid M-Pesa phone number' });
    }

    const result = await transactionService.withdrawToMpesa(req.user.userId, amount, phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    
    if (!toAddress || !this.web3.utils.isAddress(toAddress)) {
      return res.status(400).json({ error: 'Invalid blockchain address' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const result = await transactionService.transferCrypto(req.user.userId, toAddress, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    
    const balance = await transactionService.getCryptoBalance(wallet.address);
    res.json({ balance, currency: wallet.currency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

module.exports = router;
