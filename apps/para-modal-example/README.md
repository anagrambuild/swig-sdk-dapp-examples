# Para Modal Example

This example demonstrates how to integrate Para's Solana Web3.js integration for transaction signing in a React application. The app showcases how to create a Swig account using Para's wallet infrastructure.

## Features

- Para wallet integration with Solana
- Real-time SOL balance display
- Swig account creation
- Transaction signing using Para's Solana Web3.js integration

## Prerequisites

- Node.js (v14 or higher)
- A Para account
- Solana devnet SOL (for testing)

## Getting Started

1. Install dependencies:

```bash
yarn install
```

2. Start the development server:

```bash
yarn dev
```

## Key Components

### AppContent

The main component that handles:

- Para wallet connection
- SOL balance fetching
- Swig account creation

### LoginButton

Handles Para wallet authentication and connection.

### CreateSwigButton

Manages the creation of new Swig accounts with proper transaction signing.

## Implementation Details

The app demonstrates several key Para integration features:

1. **Wallet Connection**

   - Uses Para's React SDK hooks (`useAccount`, `useWallet`, `useClient`)
   - Displays connected wallet address and balance

2. **Swig Account Creation**

   - Generates random ID for Swig accounts
   - Creates and signs transactions using Para's Solana Web3.js integration
   - Handles transaction confirmation and error states

3. **Transaction Signing**
   - Uses `ParaSolanaWeb3Signer` for transaction signing
   - Implements proper transaction building and confirmation flow

## Technologies Used

- React
- Para SDK (`@getpara/react-sdk`)
- Para Solana Web3.js Integration (`@getpara/solana-web3.js-v1-integration`)
- Solana Web3.js
- Swig Wallet SDK (`@swig-wallet/classic`)
- Tailwind

## Learn More

- [Para Documentation](https://docs.para.xyz)
- [Swig Wallet Documentation](https://docs.swig.xyz)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
