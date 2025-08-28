import { createRhinestoneAccount, setUpRecovery , recoverPasskeyOwnership, recoverEcdsaOwnership} from "@rhinestone/sdk";
import { generatePrivateKey , PrivateKeyAccount , type Account} from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia , arbitrumSepolia , type Chain } from "viem/chains";
import { createPublicClient , erc20Abi, formatEther , formatUnits, http } from "viem";
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
    rhinestineApiKey? : string
}

export type RecoverySetup = {
    guardians : Account[]
    threshold? : number
}

export interface TokenBalance {
    symbol : string ;
    totalBalance : string;
    lockedBalance :  string;
    unlockedBalance :string;
    decimals : number;
    chains : Array<{
        chainId : number;
        chainName : string;
        balance : string;
        formatedBalance : string;
        lockedBalance : string;
        unlockedBalance: string;
        formatedLockedBalance : string;
        formatedUnlockedBalance : string;
    }>
}

export class RhinestoneWallet {
    private account : any;
    private config : WalletConfig;
    private creationChain: Chain;
    private rhinestineApiKey : string;

    constructor(config : WalletConfig, creationChain?: Chain) {
        this.config = config;
        this.creationChain = creationChain || SUPPORTED_CHAINS[0];
        this.rhinestineApiKey = config.rhinestineApiKey || process.env.NEXT_PUBLIC_RHINESTONE_API_KEY || '';
    }

    async initialize() {


        const initConfig : any = {
            owners: {
                type: this.config.owners.type,
                accounts:
                  this.config.owners.type === "passkey"
                    ? (this.config.owners.accounts as any)
                    : [this.config.owners.accounts[0]],  
              },

        };
        if(this.rhinestineApiKey){
            initConfig.rhinestineApiKey = this.rhinestineApiKey;
        }


        this.account = await createRhinestoneAccount(initConfig);
        return this.account;
    }

    getAddress(): string {
        if (!this.account) throw new Error('Wallet not initialized');
        return this.account.getAddress?.() ?? '';
    }

    async getPortfolio() : Promise<TokenBalance[]> {
        if(!this.account) throw new Error('wallet not initialized');

        // This requires a rhinestine api key

        try{
            const portfolio = await this.account.getPortfolio();
            const formattedPortfolio : TokenBalance[] = portfolio.map((token : any) => {
                const tokenLocked = BigInt(token.balance?.locked || 0);
                const totalUnlocked = BigInt(token.balance?.unlocked || 0);

                const formattedAvailable = formatUnits(totalUnlocked , token.decimals);
                const formattedLocked = formatUnits(tokenLocked , token.decimals);
                const formattedTotal = formatUnits(totalUnlocked + tokenLocked , token.decimals);

                const chains = (token.chains || []).map((chain : any) => {
                    const chainLocked = BigInt(chain.locked || 0);
                    const chainUnlocked = BigInt(chain.unlocked || 0);

                    const formattedChainAvailable = formatUnits(chainUnlocked , token.decimals);
                    const formatChainLocked = formatUnits(chainLocked , token.decimals);

                    return {
                        chainId : chain.chain,
                        chainName : this.getChainInfo().name,
                        balance : chainUnlocked.toString(),
                        formatedBalance : formattedChainAvailable,
                        lockedBalance : chainLocked.toString(),
                        unlockedBalance : chainUnlocked.toString(),
                        formatedLockedBalance : formatChainLocked,
                        formatedUnlockedBalance : formattedChainAvailable
                    };
                })
                .filter((chain : any) => 
                    BigInt(chain.balance) > BigInt(0) || 
                    BigInt(chain.lockedBalane) > BigInt(0) || 
                    BigInt(chain.unlockedBalance) > BigInt(0)
                );

                return {
                    symbol : token.symbol,
                    totalBalance : formattedTotal,
                    lockedBalance : formattedLocked,
                    unlockedBalance : formattedAvailable,
                    decimals : token.decimals,
                    chains : chains
                }
            })
            .filter((token : any) => {
                const hasBalance = token.chains.length > 0 ||
                    parseFloat(token.totalBalance) > 0 ||
                    parseFloat(token.lockedBalance) > 0;

                    return hasBalance;
            });

            return formattedPortfolio;
        }catch(err){
            console.error('Error getting portfolio:', err);
            return [];
        }
    }

    async getBalance(chain?: Chain): Promise<string> {
        if (!this.account) throw new Error('Wallet not initialized');
        
        try {

            // ℹ️ uncomment this when using the rhinestine api key

            // const portfolio = await this.getPortfolio();
            // const ethToken = portfolio.find(t => t.symbol === 'ETH');

            // if(ethToken){
            //     const chainBalance = ethToken.chains.find(c => c.chainId === (chain || this.creationChain).id);
            //     if(chainBalance){
            //         return chainBalance.formatedBalance;
            //     }
            // }


            // ℹ️ fallback to viem if no api key

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

    async getTokenBalance(tokenAddress : string , chain?: Chain){
        if(!this.account) throw new Error('Wallet not initialized');

        try{
            const targetChain = chain || this.creationChain;
            const client = createPublicClient({
                chain : targetChain,
                transport : http()
            });

            const address = this.getAddress() as `0x${string}`;
            const balance = await client.readContract({
                address : tokenAddress as `0x${string}`,
                abi : erc20Abi,
                functionName : 'balanceOf',
                args : [address]
            });

            return balance.toString();
        }catch(err) {
            console.error('Error getting token balance:', err);
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
