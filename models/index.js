
module.exports = {
  User: require('./User'),
  Wallet: require('./Wallet'),
  Transaction: require('./Transaction') 
};
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connecting mechanizmss
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));


module.exports = {
  User: require('./User'),
  Wallet: require('./Wallet')
};
