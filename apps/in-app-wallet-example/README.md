# Para Swig UI

This is an example of how to use swig with Para's embedded wallet solution. The example is currently on localnet. We are working on implementing the examples on devnet as well. We will update this guide as we make progress.

## Prerequisites

- [Para Developer Account](https://developer.getpara.com/)
- [Para Documentation](https://docs.getpara.com/)

## Setup Instructions

### 1. Set up Local Validator

1. Clone and build the swig-ts repository:

```bash
git clone https://github.com/anagrambuild/swig-ts.git
cd swig-ts
bun install
bun run build
```

2. Start a local validator with the deployed swig program:

```bash
solana-test-validator --reset --bpf-program swigDk8JezhiAVde8k6NMwxpZfgGm2NNuMe1KYCmUjP swig.so
```

3. Run the test files to verify SDK functionality:

```bash
cd examples/transfer && bun transfer-local.ts
```

You can also try other test files in the transfer directory.

### 2. Set up the DApp Examples

1. Clone the examples repository:

```bash
git clone https://github.com/anagrambuild/swig-sdk-dapp-examples
cd swig-sdk-dapp-examples
yarn install
```

2. Build the UI components:

```bash
cd packages/ui
yarn build
```

3. Navigate to the in-app-wallet example:

```bash
cd ../../apps/in-app-wallet-example
yarn dev
```

This will start a local version of the web app (typically at http://localhost:5173/)

### 3. Configure Para Integration

1. Create a project in the [Para Developer Portal](https://developer.getpara.com/)
2. Get your API key
3. Create a `.env.local` file in the root of `in-app-wallet-example`:

```
VITE_PARA_API_KEY=<your-new-api-key>
```

4. In the Para Developer Portal, enable both Solana and Ethereum as supported networks

## Testing the Embedded Wallet Examples

### Authentication

- Sign in using one of Para's OAuth options (Google, X, etc.)
- Para will generate a wallet for you
- Relevant files:
  - `src/client/para.ts`
  - `src/components/oauth/OAuthButtons.tsx`
  - `src/components/oauth/ParaOAuth.tsx`

### Solana Wallet Testing

1. **Swig Dashboard**

   - Create a swig wallet with two root authority options:
     - Manage Authority (Can manage other roles but can't spend/send tokens)
     - All Permissions (Can manage roles and has unlimited spend authority)
   - Add additional roles with spend limits
   - Relevant files:
     - `src/components/oauth/Home/SwigDashboard.tsx`
     - `src/contexts/SwigContext.tsx`
     - `src/utils/createSwigAccount.ts`

2. **SOL Transfer Testing**

   - Test sending SOL and role permissions
   - Verify spend limits
   - File: `src/components/oauth/Home/DefiEd25519.tsx`

3. **Gas Fee Sponsorship**

   - Example of dapp sponsoring gas fees
   - File: `src/components/oauth/Home/SwigGasDemo.tsx`

4. **Bundled Transactions**
   - Test transaction bundling functionality
   - File: `src/components/oauth/Home/BundledTransaction.tsx`

### EVM Wallet Testing

**Important**: You must log out and re-authenticate to switch to EVM wallet testing.

1. Switch to EVM Wallet in the dropdown
2. Verify EVM wallet generation (should start with 0x...)
3. Create swig account and add roles
4. Test SOL sending with EVM keys
   - Relevant files:
     - `src/components/oauth/Home/DefiSecpPara.tsx`
     - `src/utils/evm/publickey.ts`
     - `src/utils/swig/createSwigAccountSecp`
