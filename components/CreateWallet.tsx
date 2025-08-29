'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';

export default function CreateWallet() {
  const { 
    isLoading, 
    error, 
    createPasskeyWallet, 
    createEcdsaWallet,
    restoreFromStorage,
    hasActiveWallet
  } = useWallet();
  
  const [showRecovery, setShowRecovery] = useState(false);

  return (
    <div className="max-w-md mx-auto space-y-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-xl p-8 shadow-2xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Rhinestone Smart Wallet</h2>
        <p className="text-gray-400 text-sm">Powered by Rhinestone SDK</p>
      </div>

      {!hasActiveWallet() && localStorage.getItem('rhinestone_wallet') && (
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">Wallet found</p>
              <p className="text-blue-400 text-xs">Previous wallet data detected</p>
            </div>
            <button
              onClick={restoreFromStorage}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm underline disabled:opacity-50"
            >
              {isLoading ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
          {error.includes('authentication') && (
            <p className="text-red-400 text-xs mt-1">
              For passkey wallets, you may need to authenticate with your biometric device.
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={createPasskeyWallet}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          <div className="flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Create Passkey Wallet
              </>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-1">Secure biometric authentication</p>
        </button>

        <button
          onClick={createEcdsaWallet}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
            </svg>
            Create ECDSA Wallet
          </div>
          <p className="text-xs text-gray-300 mt-1">Private key based wallet</p>
        </button>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg">
          <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-300 text-xs">Smart Account • Account Abstraction</span>
        </div>
      </div>
    </div>
  );
}