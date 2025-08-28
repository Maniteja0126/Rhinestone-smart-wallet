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
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create Your Wallet
          </h2>
    
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setWalletType('ecdsa')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  walletType === 'ecdsa'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                🔐 ECDSA Wallet
              </button>
              <button
                onClick={() => setWalletType('passkey')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  walletType === 'passkey'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                🔑 Passkey Wallet
              </button>
            </div>
            <p className="text-sm text-gray-600">
          {walletType === 'ecdsa' 
            ? 'Traditional private key-based wallet'
            : 'Secure biometric/device-based authentication'
          }
        </p>

        <button
          onClick={walletType === 'ecdsa' ? createEcdsaWallet : createPasskeyWallet}
          disabled={isCreating}
          className="w-full btn-primary disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Wallet'}
        </button>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}