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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Rhinestone Wallet
        </h1>

        {!wallet ? (
          <CreateWallet onWalletCreated={setWallet} />
        ) : (
          <div className="space-y-6">
            
            <div className="bg-white rounded-lg shadow">
              <nav className="flex space-x-8 px-6 border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Wallet Overview</h3>
                  <p className="text-gray-600">
                    Address: {wallet.getAddress()}
                  </p>
                  <p className="text-gray-600">
                    Balance: <BalanceDisplay wallet={wallet} />
                  </p>
                  
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
          </div>
        )}
      </div>
    </div>
  )
}