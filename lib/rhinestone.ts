import { 
  createRhinestoneAccount, 
  setUpRecovery, 
  recoverPasskeyOwnership, 
  recoverEcdsaOwnership 
} from "@rhinestone/sdk";
import { generatePrivateKey, type Account } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, arbitrumSepolia, type Chain } from "viem/chains";
import { createPublicClient, erc20Abi, formatEther, formatUnits, http } from "viem";
import { toWebAuthnAccount } from "viem/account-abstraction";
import type { PasskeyCredential } from "./webauthn";

export const SUPPORTED_CHAINS = [baseSepolia, arbitrumSepolia];

const CHAIN_MAP = new Map<number, Chain>([
  [baseSepolia.id, baseSepolia],
  [arbitrumSepolia.id, arbitrumSepolia],
]);

export interface WalletConfig {
  owners: {
    type: "ecdsa" | "passkey";
    accounts: Account[];
  };
  recovery?: {
    guardians: string[];
    threshold: number;
  };
  rhinestoneApiKey?: string;
}

export type RecoverySetup = {
  guardians: Account[];
  threshold?: number;
};

export interface GuardianRecoveryParams {
  walletAddress: string;
  newOwner: Account;
  guardianSignatures: {
    guardian: string;
    signature: string;
  }[];
  chain: Chain;
}

export interface WalletRecoveryInfo {
  hasRecovery: boolean;
  guardians: string[];
  threshold: number;
  isRecoveryPending: boolean;
}

export interface TokenBalance {
  symbol: string;
  totalBalance: string;
  lockedBalance: string;
  unlockedBalance: string;
  decimals: number;
  chains: Array<{
    chainId: number;
    chainName: string;
    balance: string;
    formatedBalance: string;
    lockedBalance: string;
    unlockedBalance: string;
    formatedLockedBalance: string;
    formatedUnlockedBalance: string;
  }>;
}

export class RhinestoneWallet {
  private account: any;
  private config: WalletConfig;
  private creationChain: Chain;
  private rhinestoneApiKey: string;

  constructor(config: WalletConfig, creationChain?: Chain) {
    this.config = config;
    this.creationChain = creationChain || SUPPORTED_CHAINS[0];
    this.rhinestoneApiKey = config.rhinestoneApiKey || process.env.NEXT_PUBLIC_RHINESTONE_API_KEY || '';
  }

  async initialize() {
    const initConfig: any = {
      owners: {
        type: this.config.owners.type,
        accounts:
          this.config.owners.type === "passkey"
            ? (this.config.owners.accounts as any)
            : [this.config.owners.accounts[0]],
      },
    };

    if (this.rhinestoneApiKey) {
      initConfig.rhinestoneApiKey = this.rhinestoneApiKey;
    }

    this.account = await createRhinestoneAccount(initConfig);
    return this.account;
  }

  static async getWalletRecoveryInfo(
    walletAddress: string, 
    chain: Chain = baseSepolia,
    rhinestoneApiKey?: string
  ): Promise<WalletRecoveryInfo> {
    try {
      const client = createPublicClient({
        chain,
        transport: http()
      });

      const code = await client.getBytecode({ address: walletAddress as `0x${string}` });
      if (!code || code === '0x') {
        throw new Error('Address is not a smart wallet');
      }

      const tempOwner = privateKeyToAccount(generatePrivateKey());
      const tempAccount = await createRhinestoneAccount({
        owners: { type: 'ecdsa', accounts: [tempOwner] },
        ...(rhinestoneApiKey && { rhinestoneApiKey }),
      });

      return {
        hasRecovery: true,
        guardians: [],
        threshold: 2,
        isRecoveryPending: false
      };

    } catch (error) {
      console.error('Error checking wallet recovery info:', error);
      return {
        hasRecovery: false,
        guardians: [],
        threshold: 0,
        isRecoveryPending: false
      };
    }
  }

  static async recoverWalletByAddress({
    walletAddress,
    newOwner,
    guardianSignatures,
    chain
  }: GuardianRecoveryParams): Promise<any> {
    try {
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        throw new Error('Invalid wallet address');
      }

      if (guardianSignatures.length === 0) {
        throw new Error('At least one guardian signature required');
      }

      const guardians = guardianSignatures.map(sig => 
        privateKeyToAccount(sig.signature as `0x${string}`)
      );

      const tempAccount = await createRhinestoneAccount({
        owners: { type: 'ecdsa', accounts: [newOwner] },
        rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
      });

      const calls = await recoverEcdsaOwnership(
        walletAddress as `0x${string}`,
        { type: 'ecdsa', accounts: [newOwner] },
        chain,
      );

      const results = [];
      for (const call of calls) {
        const tx = await tempAccount.sendTransaction({
          chain,
          calls: [call],
          tokenRequests: [],
          signers: {
            type: 'guardians',
            guardians
          }
        });

        const result = await tempAccount.waitForExecution(tx);
        results.push({ tx, result });
      }

      return results;

    } catch (error) {
      console.error('Recovery by address failed:', error);
      throw error;
    }
  }

  getAddress(): string {
    if (!this.account) throw new Error('Wallet not initialized');
    return this.account.getAddress?.() ?? '';
  }

  async getPortfolio(): Promise<TokenBalance[]> {   // This function can be used when hoving the Rhinestone API
    if (!this.account) throw new Error('wallet not initialized');

    try {
      const portfolio = await this.account.getPortfolio();
      const formattedPortfolio: TokenBalance[] = portfolio.map((token: any) => {
        const tokenLocked = BigInt(token.balance?.locked || 0);
        const totalUnlocked = BigInt(token.balance?.unlocked || 0);

        const formattedAvailable = formatUnits(totalUnlocked, token.decimals);
        const formattedLocked = formatUnits(tokenLocked, token.decimals);
        const formattedTotal = formatUnits(totalUnlocked + tokenLocked, token.decimals);

        const chains = (token.chains || []).map((chain: any) => {
          const chainLocked = BigInt(chain.locked || 0);
          const chainUnlocked = BigInt(chain.unlocked || 0);

          const formattedChainAvailable = formatUnits(chainUnlocked, token.decimals);
          const formatChainLocked = formatUnits(chainLocked, token.decimals);

          const chainInfo = CHAIN_MAP.get(chain.chain) || this.getChainInfo();

          return {
            chainId: chain.chain,
            chainName: chainInfo.name,
            balance: chainUnlocked.toString(),
            formatedBalance: formattedChainAvailable,
            lockedBalance: chainLocked.toString(),
            unlockedBalance: chainUnlocked.toString(),
            formatedLockedBalance: formatChainLocked,
            formatedUnlockedBalance: formattedChainAvailable
          };
        })
          .filter((chain: any) =>
            BigInt(chain.balance) > BigInt(0) ||
            BigInt(chain.lockedBalance) > BigInt(0) ||
            BigInt(chain.unlockedBalance) > BigInt(0)
          );

        return {
          symbol: token.symbol,
          totalBalance: formattedTotal,
          lockedBalance: formattedLocked,
          unlockedBalance: formattedAvailable,
          decimals: token.decimals,
          chains: chains
        };
      })
        .filter((token: any) => {
          const hasBalance = token.chains.length > 0 ||
            parseFloat(token.totalBalance) > 0 ||
            parseFloat(token.lockedBalance) > 0;

          return hasBalance;
        });

      return formattedPortfolio;
    } catch (err) {
      console.error('Error getting portfolio:', err);
      return [];
    }
  }

  async getBalance(chain?: Chain): Promise<string> {
    if (!this.account) throw new Error('Wallet not initialized');

    try {
      const targetChain = chain || this.creationChain;
      const client = createPublicClient({
        chain: targetChain,
        transport: http()
      });
      const address = this.getAddress() as `0x${string}`;
      const bal = await client.getBalance({ address });
      return formatEther(bal);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getTokenBalance(tokenAddress: string, chain?: Chain) {
    if (!this.account) throw new Error('Wallet not initialized');

    try {
      const targetChain = chain || this.creationChain;
      const client = createPublicClient({
        chain: targetChain,
        transport: http()
      });

      const address = this.getAddress() as `0x${string}`;
      const balance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address]
      });

      return balance.toString();
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  }

  async setUpGuardians({ guardians, threshold }: RecoverySetup, chain: Chain) {
    if (!this.account) throw new Error('Wallet not initialized');
    
    const tx = await this.account.sendTransaction({
      chain,
      calls: setUpRecovery({
        rhinestoneAccount: this.account,
        guardians,
        ...(threshold ? { threshold } : {}),
      }),
      tokenRequests: []
    });
    
    const result = await this.account.waitForExecution(tx);
    return { tx, result };
  }

  async recoveryPasskey({
    oldPasskeyPubKey,
    newCredential,
    guardians,
    chain
  }: {
    oldPasskeyPubKey: `0x${string}`;
    newCredential: PasskeyCredential;
    guardians: Account[];
    chain: Chain;
  }) {
    if (!this.account) throw new Error('Wallet not initialized');

    const newOwner = toWebAuthnAccount({ credential: newCredential.credential });

    const hex = oldPasskeyPubKey.startsWith('0x') ? oldPasskeyPubKey.slice(2) : oldPasskeyPubKey;
    const xHex = '0x' + hex.slice(0, 64);
    const yHex = '0x' + hex.slice(64, 128);
    const existingOwners = [{ pubKeyX: BigInt(xHex), pubKeyY: BigInt(yHex) }];

    const address = this.getAddress() as `0x${string}`;
    const calls = await recoverPasskeyOwnership(
      address,
      existingOwners,
      { type: 'passkey', accounts: [newOwner as any] },
      chain
    );

    const results = [];
    for (const call of calls) {
      const tx = await this.account.sendTransaction({
        chain,
        calls: [call],
        tokenRequests: [],
        signers: {
          type: 'guardians',
          guardians
        }
      });
      const result = await this.account.waitForExecution(tx);
      results.push({ tx, result });
    }
    return results;
  }

  async recoveryEcdsa({
    newOwner,
    guardians,
    chain
  }: {
    newOwner: Account;
    guardians: Account[];
    chain: Chain;
  }) {
    if (!this.account) throw new Error('Wallet not initialized');

    const address = this.getAddress() as `0x${string}`;
    const calls = await recoverEcdsaOwnership(
      address,
      { type: 'ecdsa', accounts: [newOwner] },
      chain,
    );

    const results = [];
    for (const call of calls) {
      const tx = await this.account.sendTransaction({
        chain,
        calls: [call],
        tokenRequests: [],
        signers: {
          type: 'guardians',
          guardians
        }
      });

      const result = await this.account.waitForExecution(tx);
      results.push({ tx, result });
    }
    return results;
  }

  async sendTransaction(params: {
    sourceChain: Chain;
    targetChain: Chain;
    calls: Array<{
      to: string;
      value: bigint;
      data: string;
    }>;
    tokenRequests?: Array<{
      address: string;
      amount: bigint;
    }>;
  }) {
    if (!this.account) throw new Error("wallet not initialized");

    const tx = await this.account.sendTransaction({
      chain: params.sourceChain,
      calls: params.calls,
      ...(params.tokenRequests && { tokenRequests: params.tokenRequests })
    });
    
    const result = await this.account.waitForExecution(tx);
    return { tx, result };
  }

  async signMessage(message: string) {
    if (!this.account) throw new Error("wallet not initialized");
    return this.account.signMessage(message);
  }

  getChainInfo(): Chain {
    return this.creationChain;
  }
}

export const generateNewOwner = () => {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, account };
};

export { baseSepolia };