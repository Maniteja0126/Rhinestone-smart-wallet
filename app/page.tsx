'use client'

import { useState, useEffect } from 'react'
import CreateWallet from '@/components/CreateWallet'
import SendTransaction from '@/components/SendTransaction'
import BalanceDisplay from '@/components/BalanceDisplay'
import PasskeySetup from '@/components/PasskeySetup'
import RecoverWallet from '@/components/RecoverySetup'

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')


  useEffect(() =>{
    const existingWalletAddress = sessionStorage.getItem('wallet_address');
    if(existingWalletAddress){
      console.log("Existing wallet address found:", existingWalletAddress);
    }
  },[])

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'send', name: 'Send', icon: '📤' },
    { id: 'passkeys', name: 'Passkeys', icon: '🔑' },
    { id: 'recovery', name: 'Recovery', icon: '🛡️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Rhinestone Wallet
          </h1>
        </div>

        {!wallet ? (
          <CreateWallet onWalletCreated={setWallet} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>🏠</span>
                <span>Overview</span>
              </button>
              
              <button
                onClick={() => setActiveTab('send')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                  activeTab === 'send'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>📤</span>
                <span>Send</span>
              </button>
              
              <button
                onClick={() => setActiveTab('passkeys')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                  activeTab === 'passkeys'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>🔑</span>
                <span>Passkeys</span>
              </button>
              
              <button
                onClick={() => setActiveTab('recovery')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                  activeTab === 'recovery'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>🛡️</span>
                <span>Recovery</span>
              </button>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Wallet Overview</h2>
                  <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-2">Address:</div>
                    <div className="font-mono text-white text-sm break-all">
                      {wallet.getAddress()}
                    </div>
                  </div>
                  <BalanceDisplay wallet={wallet} />
                </div>
              )}
              
              {activeTab === 'send' && (
                <SendTransaction wallet={wallet} />
              )}
              
              {activeTab === 'passkeys' && (
                <PasskeySetup wallet={wallet} />
              )}
              
              {activeTab === 'recovery' && (
                <RecoverWallet wallet={wallet} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}