# Rhinestone Smart Wallet

A Next.js-based smart wallet application built with the Rhinestone SDK, featuring passkey authentication, guardian recovery, and account abstraction capabilities.

## 🚀 Features

- **Smart Account Wallet**: ERC-4337 compatible smart contract wallet using Rhinestone SDK
- **Passkey Authentication**: Secure biometric authentication with WebAuthn (Touch ID, Face ID, Windows Hello)
- **ECDSA Wallet Support**: Traditional private key-based wallet option with secure backup
- **Guardian Recovery System**: Social recovery with trusted guardians and configurable thresholds
- **Wallet Persistence**: Automatic wallet restoration on page refresh with secure storage
- **Multi-Chain Support**: Base Sepolia and Arbitrum Sepolia testnets
- **Cross-Chain Transactions**: Native token and ERC-20 transfers across supported chains
- **Portfolio Management**: Real-time balance display across multiple chains

## 🏗️ Architecture

### Core Components
- **RhinestoneWallet**: Main wallet class with transaction and recovery methods
- **WalletProvider**: React context for wallet state management and persistence
- **GuardianSetup**: Component for configuring guardian recovery
- **WalletRecovery**: Recovery interface supporting private key and guardian-based restoration
- **WebAuthnHelper**: WebAuthn credential management utilities

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Blockchain**: Rhinestone SDK + viem for Ethereum interactions
- **Styling**: Tailwind CSS for responsive design
- **Networks**: Base Sepolia, Arbitrum Sepolia testnets

## ⚙️ Configuration

### Environment Variables
```env
# Required: Rhinestone API key for smart account operations
NEXT_PUBLIC_RHINESTONE_API_KEY=your_api_key_here
```

### Supported Networks
- **Base Sepolia** (Chain ID: 84532)
- **Arbitrum Sepolia** (Chain ID: 421614)

## 📱 Application Flow

### 1. Wallet Creation

**Passkey Wallet:**
```typescript
// Create WebAuthn credential
const credential = await createWebAuthnCredential({
  name: `Rhinestone Wallet ${Date.now()}`,
});

const passkeyAccount = toWebAuthnAccount({ credential });

// Initialize wallet with Rhinestone SDK
const config: WalletConfig = {
  owners: { type: 'passkey', accounts: [passkeyAccount] },
  rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
};

const wallet = new RhinestoneWallet(config, baseSepolia);
await wallet.initialize();
```

**ECDSA Wallet:**
```typescript
// Generate owner account
const ownerPrivateKey = generatePrivateKey();
const ownerAccount = privateKeyToAccount(ownerPrivateKey);

const config: WalletConfig = {
  owners: { type: 'ecdsa', accounts: [ownerAccount] },
  rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
};

const wallet = new RhinestoneWallet(config, baseSepolia);
await wallet.initialize();
```

### 2. Guardian Recovery Setup

```typescript
// Configure guardian addresses and threshold
const guardianAccounts = validGuardians.map(guardian => ({
  address: guardian.address as `0x${string}`,
  type: 'json-rpc' as const,
}));

// Set up recovery on-chain
await wallet.setUpGuardians(
  {
    guardians: guardianAccounts,
    threshold: 2 // Require 2 of 3 guardians
  },
  baseSepolia
);
```

### 3. Wallet Persistence & Restoration

**Automatic Restoration:**
```typescript
// Wallet data is automatically stored and restored on page refresh
const walletData = getStoredWallet();
if (walletData) {
  await restoreFromStoredData(walletData);
}
```

**Manual Recovery Options:**
```typescript
// Private key recovery
await restoreFromPrivateKey(privateKey);

// Guardian-based recovery (future implementation)
await recoverWalletByGuardians({
  walletAddress,
  newOwner,
  guardianSignatures,
  chain: baseSepolia
});
```

### 4. Transaction Operations

**Send Native Tokens:**
```typescript
await wallet.sendTransaction({
  sourceChain: baseSepolia,
  targetChain: arbitrumSepolia,
  calls: [{
    to: recipientAddress,
    value: parseEther("0.1"),
    data: "0x"
  }]
});
```

**Send ERC-20 Tokens:**
```typescript
await wallet.sendTransaction({
  sourceChain: baseSepolia,
  targetChain: baseSepolia,
  calls: [{
    to: tokenAddress,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipientAddress, parseEther("100")]
    })
  }]
});
```

## 🔐 Security Features

### Passkey Authentication
- **WebAuthn Standard**: FIDO2 compliant biometric authentication
- **Device Security**: Private keys secured by device hardware
- **Cross-Platform**: Works on mobile and desktop devices
- **No Password Required**: Eliminates password-based vulnerabilities

### Guardian Recovery System
- **Social Recovery**: Trusted friends/family can help recover access
- **Configurable Thresholds**: Require majority approval (e.g., 2 of 3 guardians)
- **No Single Point of Failure**: Multiple recovery paths available
- **On-Chain Setup**: Guardian configuration stored securely on blockchain

### Wallet Persistence
- **Secure Storage**: Wallet data encrypted and stored locally
- **Session Management**: Automatic restoration without re-authentication
- **Data Expiration**: Automatic cleanup of old wallet data
- **Recovery Options**: Multiple paths to restore access

## 🎯 User Interface

### Main Wallet Interface
- **Portfolio View**: Real-time balance display across chains
- **Send Transactions**: Intuitive interface for token transfers
- **Guardian Management**: Easy setup and management of recovery guardians
- **Recovery Tools**: Private key and guardian-based recovery options

### Mobile-Responsive Design
- **Touch-Friendly**: Optimized for mobile wallet usage
- **Progressive UI**: Icons on mobile, full labels on desktop
- **Wallet-Like Experience**: Professional interface similar to popular wallets

## 🧪 Testing & Development



### Testing Flow
1. **Create Wallet**: Test both passkey and ECDSA wallet creation
2. **Set Up Guardians**: Configure recovery guardians with test addresses
3. **Test Transactions**: Send native and ERC-20 tokens on testnets
4. **Test Persistence**: Refresh page and verify wallet restoration
5. **Test Recovery**: Use private key recovery method

### Testnet Resources
- **Base Sepolia Faucet**: Get testnet ETH for transactions
- **Test Tokens**: Use provided testnet token addresses (USDC, WETH, DAI)
- **Guardian Addresses**: Generate test addresses for guardian setup

## 📚 API Reference

### RhinestoneWallet Class
```typescript
class RhinestoneWallet {
  // Initialization
  constructor(config: WalletConfig, creationChain?: Chain)
  async initialize(): Promise<any>
  
  // Account info
  getAddress(): string
  async getBalance(chain?: Chain): Promise<string>
  async getPortfolio(): Promise<TokenBalance[]>
  
  // Guardian setup
  async setUpGuardians(setup: RecoverySetup, chain: Chain): Promise<any>
  
  // Recovery methods
  async recoveryPasskey(params: PasskeyRecoveryParams): Promise<any>
  async recoveryEcdsa(params: EcdsaRecoveryParams): Promise<any>
  
  // Transactions
  async sendTransaction(params: TransactionParams): Promise<any>
  async signMessage(message: string): Promise<any>
  
  // Static methods
  static async getWalletRecoveryInfo(address: string, chain: Chain): Promise<WalletRecoveryInfo>
  static async recoverWalletByAddress(params: GuardianRecoveryParams): Promise<any>
}
```



## 🔗 Resources

- [Rhinestone SDK Documentation](https://docs.rhinestone.dev/)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

