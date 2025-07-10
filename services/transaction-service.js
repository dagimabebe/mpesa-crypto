 
const axios = require('axios');
const config = require('../config');
const { Wallet, Transaction } = require('../models');
const security = require('../utils/security');
const MpesaService = require('./mpesa-service');
const Web3 = require('web3'); // For Ethereum blockchain---only----not on other blockchains

const mpesaService = new MpesaService();

class TransactionService {
  constructor() {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(config.blockchain.nodeUrl)
    );
  }

  async depositCrypto(userId, amount) {
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) throw new Error('Wallet not found');

      const user = await User.findById(userId);
      const stkResponse = await mpesaService.initiateSTKPush(
        user.phone,
        amount,
        `DEPOSIT-${Date.now()}`
      );

      if (!stkResponse.success) {
        throw new Error(`M-Pesa payment failed: ${stkResponse.error}`);
      }

      const transaction = await new Transaction({
        userId,
        type: 'deposit',
        status: 'pending',
        mpesaReference: stkResponse.checkoutRequestID,
        amount,
        currency: wallet.currency
      }).save();

      return {
        success: true,
        message: 'Payment initiated. Crypto will be credited after confirmation.',
        transactionId: transaction._id
      };
    } catch (error) {
      console.error('Deposit error:', error);
      throw new Error('Deposit failed');
    }
  }

  async withdrawToMpesa(userId, amount, phone) {
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) throw new Error('Wallet not found');

      const balance = await this.getCryptoBalance(wallet.address);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      const result = await mpesaService.initiateB2CPayment(
        phone,
        amount,
        `WITHDRAW-${Date.now()}`
      );

      const transaction = await new Transaction({
        userId,
        type: 'withdrawal',
        status: 'processing',
        mpesaReference: result.transactionId,
        amount,
        currency: wallet.currency
      }).save();

      return {
        success: true,
        transactionId: transaction._id
      };
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw new Error('Withdrawal failed');
    }
  }

  async transferCrypto(userId, toAddress, amount) {
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) throw new Error('Wallet not found');

      const privateKey = security.decrypt(wallet.encryptedSeed);

      const balance = await this.getCryptoBalance(wallet.address);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      const txData = {
        from: wallet.address,
        to: toAddress,
        value: this.web3.utils.toWei(amount.toString(), 'ether'),
        gas: 21000
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(
        txData,
        privateKey
      );

      // Send to blockchain
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      const transaction = await new Transaction({
        userId,
        type: 'transfer',
        status: 'confirmed',
        txHash: receipt.transactionHash,
        amount,
        currency: wallet.currency,
        toAddress
      }).save();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        transactionId: transaction._id
      };
    } catch (error) {
      console.error('Transfer error:', error);
      throw new Error('Crypto transfer failed');
    }
  }

  //  Get crypto balance
  async getCryptoBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Balance check error:', error);
      throw new Error('Failed to get balance');
    }
  }

 
  async confirmDeposit(callbackData) {
    try {
      const result = mpesaService.processPaymentCallback(callbackData);
      if (!result.success) return false;

    
      const transaction = await Transaction.findOne({
        mpesaReference: result.checkoutRequestID,
        status: 'pending'
      });

      if (!transaction) return false;

     
      const wallet = await Wallet.findOne({ userId: transaction.userId });
      
     
      wallet.balance += parseFloat(transaction.amount);
      await wallet.save();

      // transaction statusvstuff
      transaction.status = 'confirmed';
      transaction.mpesaReceipt = result.mpesaReceipt;
      await transaction.save();

      return true;
    } catch (error) {
      console.error('Deposit confirmation error:', error);
      return false;
    }
  }
}

module.exports = TransactionService;
