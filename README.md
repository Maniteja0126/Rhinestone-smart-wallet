# Rhinestone Wallet - Smart Account with Passkey & Social Recovery

A Next.js-based smart wallet application built on Rhinestone SDK, featuring WebAuthn passkey authentication and social recovery capabilities.

## 🚀 Features

- **Smart Account Wallet**: ERC-4337 compatible smart contract wallet
- **Passkey Authentication**: Secure biometric/device-based authentication using WebAuthn
- **ECDSA Support**: Traditional private key-based wallet option
- **Social Recovery**: Guardian-based account recovery system
- **Multi-Chain Support**: Base Sepolia and Arbitrum Sepolia testnets
- **Cross-Chain Transactions**: Native token and ERC-20 transfers across chains

## Architecture

### Core Components
- **RhinestoneWallet**: Smart account wrapper with recovery methods
- **WebAuthnHelper**: WebAuthn credential management
- **Recovery System**: Guardian-based account recovery
- **Transaction Engine**: Multi-chain transaction handling

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Blockchain**: Rhinestone SDK + viem
- **Styling**: Tailwind CSS 4
- **Networks**: Base Sepolia, Arbitrum Sepolia testnets


##  Configuration

### Environment Variables
```env
# Optional: For fee sponsorship on testnet
NEXT_PUBLIC_RHINESTONE_API_KEY=your_api_key_here
```

### Supported Networks
- **Base Sepolia** (Chain ID: 84532)
- **Arbitrum Sepolia** (Chain ID: 421614)

##  Usage Flow

### 1. Wallet Creation
```typescript
// Create passkey wallet
const credential = await WebauthnHelper.createCredential(userId, userName);
const passkeyAccount = toWebAuthnAccount({ credential });

const wallet = new RhinestoneWallet({
  owners: {
    type: "passkey",
    accounts: [passkeyAccount]
  }
}, baseSepolia);

await wallet.initialize();
```

### 2. Social Recovery Setup
```typescript
// Configure guardians
await wallet.setUpguardians({
  guardians: [guardianAccount1, guardianAccount2],
  threshold: 2
}, baseSepolia);
```

### 3. Account Recovery
```typescript
// Create new passkey and recover
const newCredential = await WebauthnHelper.createCredential(userId, userName);
await wallet.recoveryPasskey({
  oldPasskeyPubKey: storedPubKey,
  newCredential,
  guardians,
  chain: baseSepolia
});
```

### 4. Transaction Sending
```typescript
// Send native token
await wallet.sendTransaction({
  sourceChain: baseSepolia,
  targetChain: arbitrumSepolia,
  calls: [{
    to: recipientAddress,
    value: parseEther("0.1"),
    data: "0x"
  }],
  tokenRequests: []
});
```

## 🔐 Security Features

### Passkey Authentication
- **WebAuthn Standard**: FIDO2 compliant authentication
- **Device Storage**: Private keys never leave the device
- **Biometric Support**: Touch ID, Face ID, Windows Hello

### Social Recovery
- **Guardian System**: Multiple trusted accounts can recover access
- **Threshold Control**: Configurable approval requirements
- **No Timelock**: Immediate recovery after threshold met


## 🧪 Testing

### Testnet Setup
1. **Get Testnet ETH**: Use Base Sepolia faucet
2. **Test Passkey Creation**: Create wallet with biometric
3. **Test Recovery Flow**: Set up guardians and test recovery
4. **Test Transactions**: Send native and ERC-20 tokens

### Test Networks
- **Base Sepolia**: Primary testnet for development
- **Arbitrum Sepolia**: Secondary testnet for cross-chain testing


## �� API Reference

### RhinestoneWallet Class
```typescript
class RhinestoneWallet {
  // Core methods
  async initialize(): Promise<any>
  getAddress(): string
  async getBalance(chain?: Chain): Promise<string>
  
  // Recovery methods
  async setUpguardians(config: RecoverySetup, chain: Chain): Promise<any>
  async recoveryPasskey(params: RecoveryParams): Promise<void>
  async recoveryEcdsa(params: RecoveryParams): Promise<void>
  
  // Transaction methods
  async sendTransaction(params: TransactionParams): Promise<any>
  async signMessage(message: string): Promise<any>
}
```

### WebAuthnHelper
```typescript
class WebauthnHelper {
  static async createCredential(userId: string, userName: string): Promise<PasskeyCredential>
}
```



## �� Resources

- [Rhinestone Documentation](https://docs.rhinestone.dev/)
- [Base Network](https://base.org/)
- [Arbitrum](https://arbitrum.io/)

