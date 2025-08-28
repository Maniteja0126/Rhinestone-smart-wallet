import { createRhinestoneAccount, setUpRecovery , recoverPasskeyOwnership, recoverEcdsaOwnership} from "@rhinestone/sdk";
import { generatePrivateKey , PrivateKeyAccount , type Account} from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia , arbitrumSepolia , type Chain } from "viem/chains";
import { createPublicClient , formatEther , http } from "viem";
import { toWebAuthnAccount } from "viem/account-abstraction";
import type { PasskeyCredential } from "./webauthn";


export const SUPPORTED_CHAINS = [baseSepolia , arbitrumSepolia];

export interface WalletConfig {
    owners : {
        type : "ecdsa" | "passkey"
        accounts : Account[]
    }
    recovery?: {
        guardians : string[]
        threshold : number
        delaySeconds : number
    }
}

export type RecoverySetup = {
    guardians : Account[]
    threshold? : number
}

export class RhinestoneWallet {
    private account : any;
    private config : WalletConfig;
    private creationChain: Chain;

    constructor(config : WalletConfig, creationChain?: Chain) {
        this.config = config;
        this.creationChain = creationChain || SUPPORTED_CHAINS[0];
    }

    async initialize() {
        // let accountConfig: any;
        // if (this.config.owners.type === "passkey") {
        //     accountConfig = {
        //         ...this.config,
        //         owners: [this.config.owners]
        //     };
        // } else if (this.config.owners.type === "ecdsa") {
        //     accountConfig = {
        //         ...this.config,
        //         owners: [this.config.owners]
        //     };
        // } else {
        //     throw new Error("Unsupported owner type");
        // }
        // this.account = await createRhinestoneAccount(accountConfig);

        const primaryAccount = this.config.owners.accounts[0];

        this.account = await createRhinestoneAccount({
          owners: {
            type: this.config.owners.type,
            accounts:
              this.config.owners.type === "passkey"
                ? (this.config.owners.accounts as any)
                : [this.config.owners.accounts[0]],  
          },
        });
        return this.account;
    }

    getAddress(): string {
        if (!this.account) throw new Error('Wallet not initialized');
        return this.account.getAddress?.() ?? '';
    }

    async getBalance(chain?: Chain): Promise<string> {
        if (!this.account) throw new Error('Wallet not initialized');
        
        try {
            const targetChain = chain || this.creationChain;
            const client = createPublicClient({
                chain: targetChain,
                transport: http()
            });
            const address = this.getAddress() as `0x${string}`;
            const bal = await client.getBalance({ address });
            return formatEther(bal);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }


    async setUpguardians({guardians , threshold} : RecoverySetup , chain : Chain) {
        if(!this.account) throw new Error('Wallet not initialized');
        const tx = await this.account.sendTransaction({
            chain ,
            calls : setUpRecovery({
                rhinestoneAccount : this.account,
                guardians,
                ...(threshold ? {threshold} : {}),
            }),
            tokenRequests :[]
        });
        await this.account.waitForExecution(tx, true);
        return tx;
    }

    async recoveryPasskey({
        oldPasskeyPubKey,
        newCredential,
        guardians,
        chain
    }:{
        oldPasskeyPubKey : `0x${string}`
        newCredential : PasskeyCredential
        guardians : Account[]
        chain : Chain
    }) {
        if(!this.account) throw new Error('Wallet not initialized');

        const newOwner = toWebAuthnAccount({credential : newCredential});

        const hex = oldPasskeyPubKey.startsWith('0x') ? oldPasskeyPubKey.slice(2) : oldPasskeyPubKey;
        const xHex = '0x' + hex.slice(0,64);
        const yHex = '0x' + hex.slice(64,128);
        const existingOwners = [{pubKeyX : BigInt(xHex) , pubKeyY : BigInt(yHex)}];

        const address = this.getAddress() as `0x${string}`;
        const calls = await recoverPasskeyOwnership(
            address,
            existingOwners,
            { type: 'passkey', accounts: [newOwner as any] },
            chain
        );

        for (const call of calls){
            const tx = await this.account.sendTransaction({
                chain , 
                calls : [call],
                tokenRequests : [],
                signers : {
                    type : 'guardians',
                    guardians
                }
            });
            await this.account.waitForExecution(tx , true);
        }
    }

    async recoveryEcdsa({
        newOwner ,
        guardians,
        chain
    } : {
        newOwner : Account,
        guardians : Account[],
        chain : Chain
    }) {
        if(!this.account) throw new Error('Wallet not initialized');

        const address = this.getAddress() as `0x${string}`;
        const calls = await recoverEcdsaOwnership(
            address,
            { type: 'ecdsa', accounts: [newOwner] },
            chain,
        );

        for (const call of calls){
            const tx = await this.account.sendTransaction({
                chain,
                calls : [call],
                tokenRequests : [],
                signers : {
                    type : 'guardians',
                    guardians
                }
            });

            await this.account.waitForExecution(tx ,true);
        }
    }


    async sendTransaction(params : {
        sourceChain : Chain,
        targetChain : Chain,
        calls : Array<{
            to :string,
            value : bigint,
            data :string
        }>
        tokenRequests?: Array<{
            address : string,
            amount : bigint
        }>
    }) {
        if(!this.account) throw new Error("wallet not initialized");

        const intent = await this.account.sendTransaction(params);
        const result = await this.account.waitForExecution(intent);
        return {intent , result};
    }

    async signMessage(message: string) {
        if(!this.account) throw new Error("wallet not initialized");

        return this.account.signMessage(message);

    }

    getChainId(): number {
        return this.creationChain.id;
    }

    getChainInfo(): Chain {
        return this.creationChain;
    }

    setChain(chain: Chain) {
        this.creationChain = chain;
    }
}

export const generateNewOwner = () =>{
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {privateKey, account};
}


export { baseSepolia };
