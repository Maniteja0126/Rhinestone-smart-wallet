'use client'

import { useState } from "react";
import { encodeFunctionData, erc20Abi, parseEther, getAddress, isAddress } from "viem";
import { RhinestoneWallet } from "@/lib/rhinestone";
import { baseSepolia, arbitrumSepolia } from "viem/chains";

const TESTNET_TOKENS = {
  'USDC': '0x036CbD53842c5426634e7929541eC2318f3cF7c5',
  'WETH': '0x4200000000000000000000000000000000000006',
  'DAI': '0x50c5725949A6F6c56Db1DfE965a05327d3324f75'
};

interface SendTransactionProps {
  wallet: RhinestoneWallet;
}

export default function SendTransaction({ wallet }: SendTransactionProps) {
  const [transactionType, setTransactionType] = useState<'native' | 'erc20' | 'crosschain'>('native')
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState<'USDC' | 'WETH' | 'DAI'>('USDC');
  const [sourceChain, setSourceChain] = useState<number>(baseSepolia.id);
  const [targetChain, setTargetChain] = useState<number>(arbitrumSepolia.id);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState("");

  const chains = [baseSepolia, arbitrumSepolia];

  const sendTransaction = async () => {
    try {
      setIsSending(true);
      setError('');
      setSuccess("");

      const sourceChainObj = chains.find(chain => chain.id === sourceChain);
      const targetChainObj = chains.find(chain => chain.id === targetChain);

      if (!sourceChainObj || !targetChainObj) {
        throw new Error('Invalid chain selection');
      }

      if (!isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      if (!amount || isNaN(Number(amount))) {
        throw new Error("Invalid amount");
      }

      const toRecipient = getAddress(recipient);
      const tokenAddress = TESTNET_TOKENS[tokenSymbol];
      const toToken = isAddress(tokenAddress) ? getAddress(tokenAddress) : undefined;

      let calls: any[] = [];
      let tokenRequests: any[] = [];

      if (transactionType === 'native') {
        calls = [{
          to: toRecipient,
          value: parseEther(amount),
          data: "0x",
        }]
      } else if (transactionType === 'erc20') {
        if (!toToken) throw new Error('Invalid token address');
        calls = [{
          to: toToken,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [toRecipient, parseEther(amount)]
          })
        }]
      } else if (transactionType === 'crosschain') {
        if (!toToken) throw new Error('Invalid token address');
        calls = [{
          to: toToken,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [toRecipient, parseEther(amount)]
          })
        }]
        tokenRequests = [{
          address: toToken,
          amount: parseEther(amount),
        }]
      }

      const result = await wallet.sendTransaction({
        sourceChain: sourceChainObj,
        targetChain: targetChainObj,
        calls,
        tokenRequests,
      })

      setSuccess(`Transaction sent successfully! Hash: ${result.intent.hash}`);
      setRecipient('')
      setAmount('')
      setTokenSymbol('USDC')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setIsSending(false)
    }
  }

  const needsToken = transactionType === 'erc20' || transactionType === 'crosschain';
  const disableSend = isSending || !recipient || !amount || (needsToken && !tokenSymbol);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Send Transaction</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setTransactionType('native')}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            transactionType === 'native'
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
          }`}
        >
          <div className="text-2xl mb-2">💎</div>
          <div className="font-medium">Native Token</div>
          <div className="text-sm text-gray-400">Send ETH/MATIC</div>
        </button>
        <button
          onClick={() => setTransactionType('erc20')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            transactionType === 'erc20'
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
          }`}
        >
          <div className="text-2xl mb-2">🪙</div>
          <div className="font-medium">ERC20 Token</div>
          <div className="text-sm text-gray-500">Send USDC/DAI/WETH</div>
        </button>

        <button
          onClick={() => setTransactionType('crosschain')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            transactionType === 'crosschain'
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
          }`}
        >
          <div className="text-2xl mb-2">🌉</div>
          <div className="font-medium">Cross-Chain</div>
          <div className="text-sm text-gray-500">Bridge tokens</div>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            className="input-field text-gray-600"
          />
        </div>

        {needsToken && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token
            </label>
            <select
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value as 'USDC' | 'WETH' | 'DAI')}
              className="input-field text-gray-600"
            >
              <option value="USDC">USDC</option>
              <option value="WETH">WETH</option>
              <option value="DAI">DAI</option>
            </select>
          </div>
        )}

        {transactionType === 'crosschain' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Chain
              </label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(Number(e.target.value))}
                className="input-field text-gray-600"
              >
                {chains.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Chain
              </label>
              <select
                value={targetChain}
                onChange={(e) => setTargetChain(Number(e.target.value))}
                className="input-field text-gray-600"
              >
                {chains.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={sendTransaction}
          disabled={disableSend}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
        >
          {isSending ? 'Sending...' : 'Send Transaction'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}
      </div>
    </div>
  )
}
