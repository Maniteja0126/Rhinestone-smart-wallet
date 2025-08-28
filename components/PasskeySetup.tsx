'use client'

import { useState } from 'react'
import { WebauthnHelper } from '@/lib/webauthn'

interface PasskeySetupProps {
  wallet: any
}

export default function PasskeySetup({ wallet }: PasskeySetupProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const registerPasskey = async () => {
    try {
      setIsRegistering(true)
      setError('')
      setSuccess('')

      const userId = `user_${Date.now()}`
      const userName = 'Wallet User'

      const credential = await WebauthnHelper.createCredential(userId, userName)
      
      localStorage.setItem('passkey_credential', JSON.stringify({id : credential.id}))
      
      setSuccess('Passkey registered successfully! You can now use it to sign transactions.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register passkey')
    } finally {
      setIsRegistering(false)
    }
  }

  const removePasskey = () => {
    localStorage.removeItem('passkey_credential')
    setSuccess('Passkey removed successfully!')
  }

  const hasPasskey = !!localStorage.getItem('passkey_credential')

  return (
    <div className="space-y-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white">Passkey Management</h3>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-300 mb-4">
          Passkeys provide secure, biometric authentication for your wallet. 
          They're stored on your device and can't be stolen like private keys.
        </p>

        {hasPasskey ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-400 bg-green-900/20 border border-green-500/30 p-3 rounded">
              <span className="text-xl">✅</span>
              <span>Passkey is registered</span>
            </div>
            
            <button
              onClick={removePasskey}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Remove Passkey
            </button>
          </div>
        ) : (
          <button
            onClick={registerPasskey}
            disabled={isRegistering}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isRegistering ? 'Registering...' : 'Register Passkey'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 p-3 rounded">
          {success}
        </div>
      )}
    </div>
  )
}

