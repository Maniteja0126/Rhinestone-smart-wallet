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
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800">Passkey Management</h3>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          Passkeys provide secure, biometric authentication for your wallet. 
          They're stored on your device and can't be stolen like private keys.
        </p>

        {hasPasskey ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <span className="text-xl">✅</span>
              <span>Passkey is registered</span>
            </div>
            
            <button
              onClick={removePasskey}
              className="btn-secondary"
            >
              Remove Passkey
            </button>
          </div>
        ) : (
          <button
            onClick={registerPasskey}
            disabled={isRegistering}
            className="btn-primary disabled:opacity-50"
          >
            {isRegistering ? 'Registering...' : 'Register Passkey'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
          {success}
        </div>
      )}
    </div>
  )
}

