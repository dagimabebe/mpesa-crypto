# M-Pesa Crypto Integration System 🔗💰

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

A secure and scalable system for bridging Safaricom's M-Pesa mobile money with cryptocurrency assets. Developed by [Dagim abebe](https://github.com/dagimabebe).

[![GitHub stars](https://img.shields.io/github/stars/dagimabebe/mpesa-crypto?style=social)](https://github.com/dagimabebe/mpesa-crypto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Key Features ✨

- 🔒 **M-Pesa Phone Verification** - Verify users via STK Push payments
- 💰 **Crypto Wallet Management** - Generate and secure crypto wallets
- ↔️ **Bi-directional Conversions** - Convert between M-Pesa and crypto assets
- ⛓️ **Blockchain Integration** - Transfer crypto between wallets
- 🛡️ **Bank-grade Security** - JWT authentication, encrypted keys, HMAC validation
- 📊 **Transaction Tracking** - Full audit trail for all operations
- 🐳 **Docker Support** - Containerized deployment
- 📜 **Smart Contracts** - Solidity contracts for asset management

## Getting Started 🚀

### Prerequisites

- Node.js v18+
- MongoDB 5.0+
- Docker (optional)
- Safaricom Developer Account
- Infura or Ethereum Node Access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dagimabebe/mpesa-crypto.git
cd mpesa-crypto
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment configuration:
```bash
cp .env.example .env
```

### Configuration Guide 🛠️

You must fill these placeholders in your `.env` file:

```env
# ===== M-Pesa Configuration =====
# Get from Safaricom Developer Portal: https://developer.safaricom.co.ke/
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_PASSKEY=your_sandbox_passkey

# ===== Security Configuration =====
# Generate strong secrets (min 32 characters)
JWT_SECRET=generate_strong_secret_with_openssl_rand_32
SYSTEM_SALT=another_strong_random_value

# ===== Database Configuration =====
# Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority

# ===== Blockchain Configuration =====
# Get from Infura: https://infura.io/
BLOCKCHAIN_NODE_URL=https://mainnet.infura.io/v3/your_infura_project_id

# ===== Production Only =====
# Add these for production deployment:
# ADMIN_SECRET=strong_admin_password
# SSL_KEY_PATH=/path/to/private.key
# SSL_CERT_PATH=/path/to/certificate.crt
```

### How to Get API Keys 

1. **M-Pesa Sandbox Credentials**:
   - Create account at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
   - Create a new app to get consumer key/secret
   - Use test credentials from the portal
   - [Documentation](https://developer.safaricom.co.ke/docs)

2. **MongoDB Connection**:
   - Sign up for [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create database user and get connection string

3. **Blockchain Access**:
   - Sign up for [Infura](https://infura.io/)
   - Create Ethereum project
   - Get mainnet endpoint URL

### Running the Application

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Docker Deployment 🐳

1. Build the Docker image:
```bash
docker-compose build
```

2. Start the services:
```bash
docker-compose up -d
```

3. View logs:
```bash
docker-compose logs -f
```

## Project Structure ⌨

```
mpesa-crypto/
├── config/               # Configuration files
├── contracts/            # Solidity smart contracts
├── models/               # MongoDB data models
├── routes/               # API endpoints
├── services/             # Business logic services
├── tests/                # Integration tests
├── utils/                # Helper utilities
├── app.js                # Main application
├── server.js             # Server entry point
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Docker build file
├── .env.example          # Environment example
└── README.md             # Project documentation
```

## API Documentation 📄

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Initiate M-Pesa verification |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/profile` | GET | Get user profile |
| `/api/auth/mpesa-callback` | POST | M-Pesa webhook |

### Transaction Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions/deposit` | POST | Deposit funds (M-Pesa → Crypto) |
| `/api/transactions/withdraw` | POST | Withdraw funds (Crypto → M-Pesa) |
| `/api/transactions/transfer` | POST | Transfer crypto to another wallet |
| `/api/transactions/balance` | GET | Get wallet balance |
| `/api/transactions/history` | GET | Get transaction history |

## Smart Contract Deployment ₪

The Solidity smart contract handles the core bridge logic:

```solidity
contract MPesaCryptoBridge {
    function deposit(string memory _mpesaTxID, address _recipient, uint256 _amount) external;
    function withdraw(string memory _phone, uint256 _amount, string memory _mpesaTxID) external;
}
```

To deploy the contract:✱

1. Install Hardhat:
```bash
npm install --save-dev hardhat
```

2. Update `scripts/deploy.js` with your token address

3. Run deployment:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Testing 

Run the full test suite:
```bash
npm test
```

Test coverage includes:
- User registration flow
- M-Pesa verification
- Login authentication
- Deposit/withdrawal transactions
- Crypto transfers
- Error handling

## Contributing ✦

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer ⚠️

This project is for educational purposes only. Use at your own risk. The developer is not responsible for any financial losses or regulatory compliance issues.

**Compliance Notice**: Before using in production, ensure compliance with:
- Kenyan financial regulations
- Blockchain asset regulations
- Safaricom's API usage terms
- GDPR and data protection laws

---
Developed by [Dagim abebe](https://dagi-builds.netlify.app)  
For support or questions, please open an issue on GitHub.
