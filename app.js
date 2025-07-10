
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const authRoutes = require('./routes/auth-routes');
const { User, Wallet } = require('./models');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mpesa-crypto', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

app.use('/api/auth', authRoutes);

app.get('/admin/status', async (req, res) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const userCount = await User.countDocuments();
    const walletCount = await Wallet.countDocuments();
    const pendingUsers = await User.countDocuments({ verificationStatus: 'pending' });
    
    res.json({
      status: 'operational',
      users: userCount,
      wallets: walletCount,
      pendingVerifications: pendingUsers,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  
  //error handling....
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Key Error',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // Generic error response
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
