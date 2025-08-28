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


  return <>
  <span>{balance} </span>
   <button onClick={fetchBalance} className='btn-primary btn-sm ml-2 cursor-pointer'>Refresh</button>

   <div>
    <div>
        <span>Chain: {chain}</span>
    </div>
   </div>
  </> 
}
