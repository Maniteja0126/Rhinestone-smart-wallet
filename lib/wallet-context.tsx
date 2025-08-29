'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RhinestoneWallet, type WalletConfig, type WalletRecoveryInfo, type GuardianRecoveryParams } from './rhinestone';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, arbitrumSepolia } from 'viem/chains';
import { createWebAuthnCredential, toWebAuthnAccount } from 'viem/account-abstraction';

interface WalletContextType {
  rhinestoneAccount: any | null;
  wallet: RhinestoneWallet | null;
  isLoading: boolean;
  error: string | null;
  createPasskeyWallet: () => Promise<void>;
  createEcdsaWallet: () => Promise<void>;
  restoreFromStorage: () => Promise<void>;
  restoreFromPrivateKey: (privateKey: string) => Promise<void>;
  restoreWallet: (address: string) => Promise<void>;
  checkWalletRecovery: (address: string) => Promise<WalletRecoveryInfo>;
  recoverWalletByGuardians: (params: GuardianRecoveryParams) => Promise<void>;
  disconnect: () => void;
  hasActiveWallet: () => boolean;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [rhinestoneAccount, setRhinestoneAccount] = useState<any>(null);
  const [wallet, setWallet] = useState<RhinestoneWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeFromStorage();
  }, []);

  const clearError = () => setError(null);

  const initializeFromStorage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const existingWallet = getStoredWallet();
      if (existingWallet) {
        await restoreFromStoredData(existingWallet);
      }
    } catch (err) {
      console.log('No active wallet found:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPasskeyWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const credential = await createWebAuthnCredential({
        name: `Rhinestone Wallet ${Date.now()}`,
      });

      const passkeyAccount = toWebAuthnAccount({ credential });

      const config: WalletConfig = {
        owners: { type: 'passkey', accounts: [passkeyAccount as any] },
        rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
      };

      const rhinestoneWallet = new RhinestoneWallet(config, baseSepolia);
      const account = await rhinestoneWallet.initialize();

      storeWallet({
        address: rhinestoneWallet.getAddress(),
        ownerType: 'passkey',
        credentialId: credential.id,
        credentialPublicKey: credential.publicKey,
        createdAt: Date.now()
      });

      setRhinestoneAccount(account);
      setWallet(rhinestoneWallet);
    } catch (err) {
      console.error('Error creating passkey wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const createEcdsaWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const ownerPrivateKey = generatePrivateKey();
      const ownerAccount = privateKeyToAccount(ownerPrivateKey);

      const config: WalletConfig = {
        owners: { type: 'ecdsa', accounts: [ownerAccount] },
        rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
      };

      const rhinestoneWallet = new RhinestoneWallet(config, baseSepolia);
      const account = await rhinestoneWallet.initialize();

      storeWallet({
        address: rhinestoneWallet.getAddress(),
        ownerType: 'ecdsa',
        ownerPrivateKey,
        createdAt: Date.now()
      });

      setRhinestoneAccount(account);
      setWallet(rhinestoneWallet);

      showBackupModal(ownerPrivateKey, rhinestoneWallet.getAddress());
    } catch (err) {
      console.error('Error creating ECDSA wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromStorage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const walletData = getStoredWallet();
      if (!walletData) {
        throw new Error('No wallet data found');
      }

      await restoreFromStoredData(walletData);
    } catch (err) {
      console.error('Wallet restoration failed:', err);
      setError(err instanceof Error ? err.message : 'Restoration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromPrivateKey = async (privateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new Error('Invalid private key format');
      }

      const ownerAccount = privateKeyToAccount(privateKey as `0x${string}`);

      const config: WalletConfig = {
        owners: { type: 'ecdsa', accounts: [ownerAccount] },
        rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
      };

      const rhinestoneWallet = new RhinestoneWallet(config, baseSepolia);
      const account = await rhinestoneWallet.initialize();

      storeWallet({
        address: rhinestoneWallet.getAddress(),
        ownerType: 'ecdsa',
        ownerPrivateKey: privateKey,
        createdAt: Date.now()
      });

      setRhinestoneAccount(account);
      setWallet(rhinestoneWallet);
    } catch (err) {
      console.error('Private key restoration failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkWalletRecovery = async (address: string): Promise<WalletRecoveryInfo> => {
    try {
      return await RhinestoneWallet.getWalletRecoveryInfo(
        address, 
        baseSepolia, 
        process.env.NEXT_PUBLIC_RHINESTONE_API_KEY
      );
    } catch (err) {
      console.error('Error checking wallet recovery:', err);
      return {
        hasRecovery: false,
        guardians: [],
        threshold: 0,
        isRecoveryPending: false
      };
    }
  };

  const recoverWalletByGuardians = async (params: GuardianRecoveryParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await RhinestoneWallet.recoverWalletByAddress(params);

      const config: WalletConfig = {
        owners: { type: 'ecdsa', accounts: [params.newOwner] },
        rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
      };

      const rhinestoneWallet = new RhinestoneWallet(config, params.chain);
      const account = await rhinestoneWallet.initialize();

      storeWallet({
        address: params.walletAddress,
        ownerType: 'ecdsa',
        ownerPrivateKey: (params.newOwner as any).privateKey,
        createdAt: Date.now(),
        recovered: true,
        recoveryTx: results[0]?.tx?.hash
      });

      setRhinestoneAccount(account);
      setWallet(rhinestoneWallet);

    } catch (err) {
      console.error('Guardian recovery failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreWallet = async (address: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('Invalid wallet address format');
      }

      const recoveryInfo = await checkWalletRecovery(address);
      
      if (!recoveryInfo.hasRecovery) {
        throw new Error('This wallet does not have guardian recovery set up. Please use private key recovery instead.');
      }

      throw new Error(`Guardian recovery available. Found ${recoveryInfo.guardians.length} guardians with threshold ${recoveryInfo.threshold}. Please use the guardian recovery flow.`);
      
    } catch (err) {
      console.error('Wallet restoration failed:', err);
      setError(err instanceof Error ? err.message : 'Restoration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromStoredData = async (walletData: any) => {
    let ownerAccounts;
    
    if (walletData.ownerType === 'ecdsa') {
      const ownerAccount = privateKeyToAccount(walletData.ownerPrivateKey);
      ownerAccounts = { type: 'ecdsa' as const, accounts: [ownerAccount] };
    } else if (walletData.ownerType === 'passkey') {
      if (walletData.credentialId && walletData.credentialPublicKey) {
        try {
          const restoredCredential = {
            id: walletData.credentialId,
            publicKey: walletData.credentialPublicKey,
            type: 'public-key' as const,
            credential: {
              id: walletData.credentialId,
              publicKey: walletData.credentialPublicKey,
              type: 'public-key',
            }
          };
          
          const passkeyAccount = toWebAuthnAccount({ credential: restoredCredential });
          ownerAccounts = { type: 'passkey' as const, accounts: [passkeyAccount as any] };
        } catch (err) {
          console.warn('Failed to restore with existing credential, creating new one:', err);
          const credential = await createWebAuthnCredential({
            name: `Restore Rhinestone Wallet ${Date.now()}`,
          });
          const passkeyAccount = toWebAuthnAccount({ credential });
          ownerAccounts = { type: 'passkey' as const, accounts: [passkeyAccount as any] };
          
          storeWallet({
            ...walletData,
            credentialId: credential.id,
            credentialPublicKey: credential.publicKey,
          });
        }
      } else {
        throw new Error('Passkey credential data not found. Please create a new wallet.');
      }
    } else {
      throw new Error('Unknown owner type');
    }

    const config: WalletConfig = {
      owners: ownerAccounts,
      rhinestoneApiKey: process.env.NEXT_PUBLIC_RHINESTONE_API_KEY,
    };

    const rhinestoneWallet = new RhinestoneWallet(config, baseSepolia);
    const account = await rhinestoneWallet.initialize();

    setRhinestoneAccount(account);
    setWallet(rhinestoneWallet);
  };

  const disconnect = () => {
    setRhinestoneAccount(null);
    setWallet(null);
    clearStoredWallet();
  };

  const hasActiveWallet = (): boolean => {
    return !!wallet && !!rhinestoneAccount;
  };

  return (
    <WalletContext.Provider value={{
      rhinestoneAccount,
      wallet,
      isLoading,
      error,
      createPasskeyWallet,
      createEcdsaWallet,
      restoreFromStorage,
      restoreFromPrivateKey,
      restoreWallet,
      checkWalletRecovery,
      recoverWalletByGuardians,
      disconnect,
      hasActiveWallet,
      clearError
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

function storeWallet(walletData: any) {
  try {
    const dataToStore = {
      ...walletData,
      timestamp: Date.now()
    };
    localStorage.setItem('rhinestone_wallet', JSON.stringify(dataToStore));
  } catch (err) {
    console.error('Failed to store wallet:', err);
  }
}

function getStoredWallet() {
  try {
    const stored = localStorage.getItem('rhinestone_wallet');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    const maxAge = data.ownerType === 'passkey' ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      clearStoredWallet();
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Failed to retrieve wallet:', err);
    return null;
  }
}

function clearStoredWallet() {
  localStorage.removeItem('rhinestone_wallet');
}

function showBackupModal(privateKey: string, address: string) {
  alert(`🔐 BACKUP YOUR WALLET

  Wallet Address: ${address}
  Private Key: ${privateKey}

  ⚠️ IMPORTANT: Save your private key securely!
  This is the only way to restore your wallet if you lose access.

  Write it down and store it safely offline.`);
}