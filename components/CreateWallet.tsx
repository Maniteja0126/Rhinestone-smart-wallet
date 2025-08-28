'use client';

import {useState} from "react";
import { RhinestoneWallet , generateNewOwner, baseSepolia } from "@/lib/rhinestone";
import { WebauthnHelper } from "@/lib/webauthn";
import { toWebAuthnAccount } from "viem/account-abstraction";


interface CreateWalletProps {
    onWalletCreated : (wallet : RhinestoneWallet) => void;
}


export default function CreateWallet({onWalletCreated} : CreateWalletProps) {
    const [walletType , setWalletType ] = useState<"passkey" | "ecdsa">("passkey");
    const [isCreating , setIsCreating] = useState(false);
    const [error , setError] = useState("");

    const createEcdsaWallet = async () =>{
        try{
            setIsCreating(true);
            setError("");
            const { privateKey, account } = generateNewOwner();


            const wallet = new RhinestoneWallet({
                owners : {
                    type : "ecdsa",
                    accounts : [account]
                },
            }, baseSepolia);

            await wallet.initialize();
            const walletAddress = wallet.getAddress();
            sessionStorage.setItem('wallet_address', walletAddress);

            onWalletCreated(wallet);
        }catch(err) {
            console.error("Error creating ECDSA wallet:", err);
            setError("Failed to create wallet. Please try again.");
        }finally{
            setIsCreating(false);
        }
    }

    const createPasskeyWallet = async () =>{
        try{
            setIsCreating(true);
            setError("");

            const userId = crypto.randomUUID();
            const userName = `User ${userId.slice(0, 8)}`;

            const credential = await WebauthnHelper.createCredential(userId, userName);

            const publicKeyCredential = {
                id: credential.id,
                publicKey: credential.publicKey,
                type: 'public-key',
                rawId: new Uint8Array(),
                response: {} as any,
                getClientExtensionResults: () => ({}),
                authenticatorAttachment: null
            };

            const passkeyAccount = toWebAuthnAccount({ 
                credential: publicKeyCredential as any
            });

            sessionStorage.setItem("passkey_pubkey" , (passkeyAccount as any).publicKey);


            const wallet = new RhinestoneWallet({
                owners : {
                    type : "passkey",
                    accounts : [passkeyAccount as any]
                },
            }, baseSepolia);

            await wallet.initialize();

            const walletAddress = wallet.getAddress();
            sessionStorage.setItem('wallet_address', walletAddress);

            onWalletCreated(wallet);
        }catch(err) {
            console.error("Error creating Passkey wallet:", err);
            setError("Failed to create wallet. Please try again.");
        }finally{
            setIsCreating(false);
        }
    }

    return (
        <div className="max-w-md mx-auto bg-gray-900 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Create Your Wallet
          </h2>
    
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setWalletType('ecdsa')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  walletType === 'ecdsa'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                🔐 ECDSA Wallet
              </button>
              <button
                onClick={() => setWalletType('passkey')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  walletType === 'passkey'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                🔑 Passkey Wallet
              </button>
            </div>
            
            <p className="text-sm text-gray-400">
          {walletType === 'ecdsa' 
            ? 'Traditional private key-based wallet'
            : 'Secure biometric/device-based authentication'
          }
        </p>

        <button
          onClick={walletType === 'ecdsa' ? createEcdsaWallet : createPasskeyWallet}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create Wallet'}
        </button>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}