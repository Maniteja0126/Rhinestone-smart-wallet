'use client';

import { useState, useEffect } from 'react';
import { RhinestoneWallet } from '@/lib/rhinestone';

interface BalanceDisplayProps {
  wallet: RhinestoneWallet;
}

export default function BalanceDisplay({ wallet }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string>('Loading...');
  const [chain , setChain] = useState("");

  const fetchBalance = async () => {
    try {
        console.log("Fetching balance for address:", wallet.getAddress());
        console.log("On chain:", wallet.getChainInfo().name);
        const bal = await wallet.getBalance();
        console.log("Raw balance:", bal);
        setBalance(bal);
    } catch (error) {
        console.error("Balance fetch error:", error);
        setBalance('Error');
    }
  };

  const fetchChainDetails = async () => {
    try {
      const chainInfo = await wallet.getChainInfo();
      setChain(chainInfo.name);
    } catch (err) {
      setChain("Unknown");
    }
  }

  useEffect(() => {
    fetchBalance();
    fetchChainDetails();
  }, [wallet]);


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Portfolio</h2>
        <button
          onClick={fetchBalance}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-2xl font-bold">Balance: {balance}</span>
        </div>

        <div className="text-gray-400 text-sm">
          Chain: {chain}
        </div>
      </div>
    </div>
  )
}
