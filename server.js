
const app = require('./app');
const config = require('./config');
const https = require('https');
const fs = require('fs');

//port from environment or config
const PORT = config.server.port || 3000;

// Create HTTP or HTTPS server
let server;
if (process.env.NODE_ENV === 'production') {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    ca: fs.readFileSync(process.env.SSL_CA_PATH)
  };
  server = https.createServer(sslOptions, app);
} else {
  server = require('http').createServer(app);
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on port ${PORT}`);
  
  console.log('Configuration:');
  console.log(`- M-Pesa Base URL: ${config.mpesa.baseUrl}`);
  console.log(`- JWT Expires In: ${config.jwt.expiresIn}`);
  console.log(`- Default Crypto: ${config.crypto.defaultAsset}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
