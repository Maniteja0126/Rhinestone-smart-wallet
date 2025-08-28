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
        <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Recovery</h3>
  
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Private Keys</label>
          <input
            className="input-field text-gray-600"
            placeholder="0xabc...,0xdef..."
            value={guardianKeys}
            onChange={e => setGuardianKeys(e.target.value)}
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Threshold</label>
          <input
            type="number"
            className="input-field text-gray-600"
            min={1}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
          />
        </div>
  
        <div className="flex gap-2">
          <button className="btn-primary" onClick={setUpGuardians}>Set Up Guardians</button>
          <button className="btn-primary" onClick={startPasskeyRecovery}>Recover Passkey</button>
        </div>
  
        {status && <div className="text-sm text-green-700">{status}</div>}
      </div>
    )
}