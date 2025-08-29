'use client';

import React, { useState, useEffect } from 'react';
import { RhinestoneWallet } from '@/lib/rhinestone';
import { generateNewOwner } from '@/lib/rhinestone';
import { baseSepolia } from 'viem/chains';

interface GuardianSetupProps {
  wallet: RhinestoneWallet;
}

interface Guardian {
  address: string;
  name: string;
  isValid: boolean;
}

export default function GuardianSetup({ wallet }: GuardianSetupProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([
    { address: '', name: '', isValid: false },
    { address: '', name: '', isValid: false }
  ]);
  const [threshold, setThreshold] = useState(2);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasRecoverySetup, setHasRecoverySetup] = useState(false);

  useEffect(() => {
    checkExistingRecovery();
  }, []);

  const checkExistingRecovery = async () => {
    try {
      const recoveryInfo = await RhinestoneWallet.getWalletRecoveryInfo(
        wallet.getAddress(),
        baseSepolia
      );
      setHasRecoverySetup(recoveryInfo.hasRecovery);
    } catch (err) {
      console.log('No existing recovery setup found');
    }
  };

  const isValidAddress = (address: string): boolean => {
    return address.startsWith('0x') && address.length === 42;
  };

  const addGuardian = () => {
    setGuardians([...guardians, { address: '', name: '', isValid: false }]);
  };

  const removeGuardian = (index: number) => {
    if (guardians.length > 1) {
      const newGuardians = guardians.filter((_, i) => i !== index);
      setGuardians(newGuardians);
      if (threshold > newGuardians.length) {
        setThreshold(newGuardians.length);
      }
    }
  };

  const updateGuardian = (index: number, field: 'address' | 'name', value: string) => {
    const newGuardians = [...guardians];
    newGuardians[index][field] = value;
    
    if (field === 'address') {
      newGuardians[index].isValid = isValidAddress(value);
    }
    
    setGuardians(newGuardians);
  };

  const generateRandomGuardian = (index: number) => {
    const { account } = generateNewOwner();
    updateGuardian(index, 'address', account.address);
    updateGuardian(index, 'name', `Guardian ${index + 1}`);
  };

  const setupGuardians = async () => {
    try {
      setIsSettingUp(true);
      setError('');
      setSuccess('');

      const validGuardians = guardians.filter(g => g.isValid && g.address);
      
      if (validGuardians.length < 2) {
        throw new Error('At least 2 guardians are required');
      }

      if (threshold > validGuardians.length) {
        throw new Error('Threshold cannot be higher than number of guardians');
      }

      if (threshold < 1) {
        throw new Error('Threshold must be at least 1');
      }

      console.log('Setting up guardians with Rhinestone SDK...');
      console.log('Guardians:', validGuardians.map(g => ({ address: g.address, name: g.name })));
      console.log('Threshold:', threshold);

      const guardianAccounts = validGuardians.map(guardian => ({
        address: guardian.address as `0x${string}`,
        type: 'json-rpc' as const,
      }));

      const result = await wallet.setUpGuardians(
        {
          guardians: guardianAccounts as any,
          threshold
        },
        baseSepolia
      );

      console.log('Guardian setup result:', result);

      localStorage.setItem('wallet_guardians', JSON.stringify({
        guardians: validGuardians,
        threshold,
        walletAddress: wallet.getAddress(),
        setupTx: result.tx.hash,
        setupAt: Date.now()
      }));

      setSuccess(`✅ Guardian recovery setup complete!
            
        📋 Summary:
        • ${validGuardians.length} guardians configured
        • ${threshold} signatures required for recovery
        • Transaction: ${result.tx.hash}

        Your guardians can now help you recover this wallet if needed.`);

      setHasRecoverySetup(true);

    } catch (err) {
      console.error('Guardian setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up guardians');
    } finally {
      setIsSettingUp(false);
    }
  };

  const validGuardianCount = guardians.filter(g => g.isValid).length;
  const canSetup = validGuardianCount >= 2 && threshold <= validGuardianCount && threshold >= 1;

  return (
    <div className="space-y-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Guardian Recovery Setup</h2>
        {hasRecoverySetup && (
          <div className="flex items-center text-green-400">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Recovery Enabled
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Set up trusted guardians who can help you recover your wallet. Guardians are people you trust
          who can collectively sign a recovery transaction if you lose access to your wallet.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Guardians</h3>
            <button
              onClick={addGuardian}
              disabled={guardians.length >= 5}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Add Guardian
            </button>
          </div>

          {guardians.map((guardian, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-medium">Guardian {index + 1}</h4>
                {guardians.length > 1 && (
                  <button
                    onClick={() => removeGuardian(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={guardian.name}
                    onChange={(e) => updateGuardian(index, 'name', e.target.value)}
                    placeholder={`Guardian ${index + 1}`}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Wallet Address *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={guardian.address}
                      onChange={(e) => updateGuardian(index, 'address', e.target.value)}
                      placeholder="0x..."
                      className={`flex-1 p-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:ring-2 focus:border-transparent ${
                        guardian.address && guardian.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : guardian.address && !guardian.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-600 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      onClick={() => generateRandomGuardian(index)}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                      title="Generate random address for testing"
                    >
                      🎲
                    </button>
                  </div>
                  {guardian.address && !guardian.isValid && (
                    <p className="text-red-400 text-xs mt-1">Invalid address format</p>
                  )}
                  {guardian.address && guardian.isValid && (
                    <p className="text-green-400 text-xs mt-1">✓ Valid address</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-3">Recovery Threshold</h3>
          <p className="text-gray-300 text-sm mb-3">
            How many guardian signatures are required to recover the wallet?
          </p>
          
          <div className="flex items-center space-x-4">
            <label className="text-white">Signatures required:</label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: validGuardianCount }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} of {validGuardianCount}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
            <p className="text-blue-300 text-sm">
              💡 Recommended: Use {Math.ceil(validGuardianCount / 2)} of {validGuardianCount} 
              (majority threshold) for good balance of security and recoverability.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded">
            <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded">
            <p className="text-green-300 text-sm whitespace-pre-line">{success}</p>
          </div>
        )}

        {!hasRecoverySetup && (
          <button
            onClick={setupGuardians}
            disabled={!canSetup || isSettingUp}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
          >
            {isSettingUp ? 'Setting up guardians...' : 'Set Up Guardian Recovery'}
          </button>
        )}

        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <h4 className="text-yellow-300 font-medium mb-2">📚 How Guardian Recovery Works</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• Guardians are trusted people who can help you recover your wallet</li>
            <li>• They cannot spend your funds or access your wallet normally</li>
            <li>• In recovery, they collectively sign a transaction to give you new access</li>
            <li>• Choose people you trust: family, friends, or business partners</li>
            <li>• Make sure guardians can be reached if you need recovery</li>
          </ul>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p><strong>Requirements:</strong></p>
          <p>• At least 2 guardians required</p>
          <p>• Valid Ethereum addresses for all guardians</p>
          <p>• Threshold must be ≤ number of guardians</p>
          <p>• Each guardian should have their own wallet</p>
        </div>
      </div>
    </div>
  );
}
