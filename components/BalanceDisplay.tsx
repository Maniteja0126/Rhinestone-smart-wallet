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
      setChain(chainInfo.name ?? "");
    } catch (err) {
      setChain("Unknown");
    }
  }

  useEffect(() => {
    fetchBalance();
    fetchChainDetails();
  }, [wallet]);


  return (
    <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-2xl font-bold">Balance: {balance}</span>
        <button onClick={fetchBalance} className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors'>
          Refresh
        </button>
      </div>

      <div className="text-gray-400 text-sm">
        Chain: {chain}
      </div>
    </div>
  )
}
