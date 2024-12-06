# DAO Governance Application

A decentralized autonomous organization (DAO) application that allows members to create proposals, vote, and manage certificates on the Ethereum blockchain.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension
- [Alchemy](https://www.alchemy.com/) account for Sepolia testnet access
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone [repository-url]
cd dao-1-main

# Install root dependencies
npm install

# Install UI dependencies
cd ui
npm install
```

### 2. Environment Setup

1. Create a `.env` file in the root directory:
```env
# Your MetaMask private key (without 0x prefix)
PRIVATE_KEY=your-private-key-here
# Your Alchemy Sepolia API URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
```

2. Get your MetaMask private key:
   - Open MetaMask
   - Click the three dots menu
   - Go to "Account Details"
   - Click "Export Private Key"
   - Copy and paste into .env file

3. Get your Alchemy API key:
   - Create an account on [Alchemy](https://www.alchemy.com/)
   - Create a new app for Sepolia network
   - Copy the HTTP URL and paste into .env file

### 3. Deploy Smart Contracts

```bash
# From the root directory
npx hardhat run scripts/deploy.js --network sepolia
```

### 4. Update UI Configuration

1. Copy the deployed contract addresses from `seoplia-address.json` to `ui/src/contract-data/deployedAddresses.json`
2. Set your MetaMask account address as the `DEFAULT_ADMIN`

### 5. Start the Application

```bash
cd ui
npm run dev
```

## Using the Application

### Initial Setup

1. Connect MetaMask:
   - Switch to Sepolia testnet in MetaMask
   - Click "Connect Wallet" in the application
   - Approve the connection in MetaMask

2. Get Governance Tokens:
   - Must be granted by an admin
   - Required for voting rights

3. Delegate Voting Power:
   - Click "Delegate" to delegate tokens to yourself
   - Required before you can vote

### Core Features

#### Voting on Proposals
1. Find an active proposal in the proposals list
2. Click 👍 for support or 👎 against
3. Confirm the transaction in MetaMask
4. Wait for transaction confirmation

#### Creating Proposals (Admin Only)
1. Click "Create Proposal"
2. Fill in the proposal details:
   - Description
   - Function to call
   - Target contract
3. Submit and confirm the transaction

#### Managing Certificates (Admin Only)
1. Access the admin dashboard
2. Use the certificate management interface to:
   - Issue new certificates
   - View existing certificates
   - Manage certificate details

### Troubleshooting

1. If transactions fail:
   - Ensure you have enough Sepolia ETH for gas
   - Check that you're connected to Sepolia network
   - Verify your wallet is properly connected

2. If voting power shows 0:
   - Ensure you have governance tokens
   - Check if you've delegated tokens to yourself
   - Wait for delegation transaction to confirm

3. For admin functions:
   - Verify your address is set as DEFAULT_ADMIN
   - Ensure you have the necessary roles

## Support

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Check the smart contract addresses in deployedAddresses.json