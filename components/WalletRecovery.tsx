'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

interface GuardianSignature {
  guardian: string;
  signature: string;
}

export default function WalletRecovery() {
  const { 
    restoreFromPrivateKey, 
    checkWalletRecovery, 
    recoverWalletByGuardians,
    isLoading, 
    error, 
    clearError 
  } = useWallet();
  
  const [method, setMethod] = useState<'private-key' | 'guardians'>('private-key');
  const [privateKey, setPrivateKey] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [guardianSignatures, setGuardianSignatures] = useState<GuardianSignature[]>([]);
  const [newOwnerPrivateKey, setNewOwnerPrivateKey] = useState('');
  const [recoveryInfo, setRecoveryInfo] = useState<any>(null);
  const [localError, setLocalError] = useState('');

  const handleRestoreFromPrivateKey = async () => {
    try {
      setLocalError('');
      clearError();

      if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new Error('Invalid private key format');
      }

      await restoreFromPrivateKey(privateKey);
      
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Restoration failed');
    }
  };

  const handleCheckRecovery = async () => {
    try {
      setLocalError('');
      clearError();

      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        throw new Error('Invalid wallet address format');
      }

      const info = await checkWalletRecovery(walletAddress);
      setRecoveryInfo(info);

      if (!info.hasRecovery) {
        setLocalError('This wallet does not have guardian recovery set up.');
      } else {
        setGuardianSignatures(info.guardians.map(guardian => ({
          guardian,
          signature: ''
        })));
      }
      
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to check recovery info');
    }
  };

  const handleGuardianRecovery = async () => {
    try {
      setLocalError('');
      clearError();

      if (!newOwnerPrivateKey) {
        setLocalError('Please enter a new private key for the recovered wallet');
        return;
      }

      const validSignatures = guardianSignatures.filter(sig => 
        sig.signature.startsWith('0x') && sig.signature.length === 66
      );

      if (validSignatures.length < recoveryInfo.threshold) {
        setLocalError(`Need at least ${recoveryInfo.threshold} guardian signatures`);
        return;
      }

      const newOwner = privateKeyToAccount(newOwnerPrivateKey as `0x${string}`);

      await recoverWalletByGuardians({
        walletAddress,
        newOwner,
        guardianSignatures: validSignatures,
        chain: baseSepolia
      });

    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Guardian recovery failed');
    }
  };

  const updateGuardianSignature = (index: number, signature: string) => {
    const updated = [...guardianSignatures];
    updated[index].signature = signature;
    setGuardianSignatures(updated);
  };

  const displayError = localError || error;

  return (
    <div className="max-w-md mx-auto space-y-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-xl p-8 shadow-2xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Restore Wallet</h2>
        <p className="text-gray-400 text-sm">Regain access to your existing wallet</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Recovery Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-blue-500">
              <input
                type="radio"
                name="method"
                value="private-key"
                checked={method === 'private-key'}
                onChange={(e) => setMethod(e.target.value as 'private-key' | 'guardians')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-3 text-white">Private Key</span>
            </label>
            
            <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-blue-500">
              <input
                type="radio"
                name="method"
                value="guardians"
                checked={method === 'guardians'}
                onChange={(e) => setMethod(e.target.value as 'private-key' | 'guardians')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-3 text-white">Guardian Recovery</span>
            </label>
          </div>
        </div>

        {method === 'private-key' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Private Key
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the private key you saved when creating your ECDSA wallet
            </p>
          </div>
        )}

        {method === 'guardians' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleCheckRecovery}
                  disabled={isLoading || !walletAddress}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Check
                </button>
              </div>
            </div>

            {recoveryInfo && recoveryInfo.hasRecovery && (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-300 text-sm">
                    Recovery available: {recoveryInfo.guardians.length} guardians, threshold {recoveryInfo.threshold}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Private Key
                  </label>
                  <input
                    type="password"
                    value={newOwnerPrivateKey}
                    onChange={(e) => setNewOwnerPrivateKey(e.target.value)}
                    placeholder="0x... (new private key for recovered wallet)"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setNewOwnerPrivateKey(generatePrivateKey())}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Generate new private key
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Guardian Signatures
                  </label>
                  <div className="space-y-2">
                    {guardianSignatures.map((sig, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-xs text-gray-400">
                          Guardian {index + 1}: {sig.guardian}
                        </p>
                        <input
                          type="password"
                          value={sig.signature}
                          onChange={(e) => updateGuardianSignature(index, e.target.value)}
                          placeholder="Guardian private key for signing..."
                          className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Need {recoveryInfo.threshold} of {recoveryInfo.guardians.length} guardian signatures
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {displayError && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300 text-sm">{displayError}</p>
          </div>
        )}

        <button
          onClick={
            method === 'private-key' 
              ? handleRestoreFromPrivateKey 
              : method === 'guardians' && recoveryInfo?.hasRecovery
                ? handleGuardianRecovery
                : handleCheckRecovery
          }
          disabled={
            isLoading || 
            (method === 'private-key' ? !privateKey : 
             method === 'guardians' && !recoveryInfo?.hasRecovery ? !walletAddress :
             !newOwnerPrivateKey || guardianSignatures.filter(s => s.signature).length < (recoveryInfo?.threshold || 1))
          }
          className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
        >
          {isLoading ? 'Processing...' : 
           method === 'private-key' ? 'Restore Wallet' :
           method === 'guardians' && !recoveryInfo ? 'Check Recovery' :
           'Recover with Guardians'}
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Guardian recovery allows you to restore wallet access using trusted guardian signatures.
          </p>
        </div>
      </div>
    </div>
  );
}
