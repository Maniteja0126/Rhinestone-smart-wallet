'use client'

import { useState } from "react"
import type { RhinestoneWallet } from "@/lib/rhinestone"
import { WebauthnHelper } from "@/lib/webauthn"
import { baseSepolia } from 'viem/chains'
import {privateKeyToAccount , type Account} from "viem/accounts";

export default function RecoverWallet({wallet} : {wallet : RhinestoneWallet}) {
    const [guardianKeys , setGuardianKeys] = useState<string>('');
    const [threshold , setThreshold] = useState<number>(1);
    const [status , setStatus] = useState<string>('');

    const toGuardianAccounts = () : Account[] => guardianKeys.split(',').map(s => s.trim()).filter(Boolean)
    .map(pk => privateKeyToAccount(pk as `0x${string}`));

    const setUpGuardians = async () => {
        const guardians = toGuardianAccounts();
        await wallet.setUpguardians({guardians , threshold} , baseSepolia);
        setStatus("Gaurdians set up");
    }

    const startPasskeyRecovery = async () => {
        const guardians = toGuardianAccounts();
        const oldPubKey = sessionStorage.getItem('passkey_pubkey') as `0x${string}`;
        if(!oldPubKey) {
            alert("Missing stored old passkey public key");
        }

        const credentials = await WebauthnHelper.createCredential(`recover_${Date.now()}` , 'Recover Owner');
        await wallet.recoveryPasskey({
            oldPasskeyPubKey : oldPubKey,
            newCredential : credentials,
            guardians,
            chain : baseSepolia
        })
        setStatus("recovery completed");
    }
    return (
        <div className="space-y-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white">Recovery</h3>
  
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Guardian Private Keys</label>
          <input
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0xabc...,0xdef..."
            value={guardianKeys}
            onChange={e => setGuardianKeys(e.target.value)}
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Threshold</label>
          <input
            type="number"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={1}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
          />
        </div>
  
        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" onClick={setUpGuardians}>Set Up Guardians</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" onClick={startPasskeyRecovery}>Recover Passkey</button>
        </div>
  
        {status && <div className="text-sm text-green-400 bg-green-900/20 border border-green-500/30 p-3 rounded">{status}</div>}
      </div>
    )
}