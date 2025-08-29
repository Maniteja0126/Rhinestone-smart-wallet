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

      if (!WebauthnHelper.isSupported()) {
        throw new Error("WebAuthn is not supported in this browser")
      }

      const userId = `user_${Date.now()}`
      const userName = 'Wallet User'

      const credential = await WebauthnHelper.createCredential(userId, userName)
      
      localStorage.setItem('passkey_credential', JSON.stringify({
        id: credential.id,
        publicKey: credential.publicKey
      }))
      
      setSuccess('Passkey registered successfully! You can now use it to sign transactions.')
    } catch (err) {
      console.error('Passkey registration error:', err)
      setError(err instanceof Error ? err.message : 'Failed to register passkey')
    } finally {
      setIsRegistering(false)
    }
  }

  const removePasskey = () => {
    localStorage.removeItem('passkey_credential')
    setSuccess('Passkey removed successfully!')
    setError('')
  }

  const hasPasskey = !!localStorage.getItem('passkey_credential')

  return (
    <div className="space-y-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white">Passkey Setup</h2>
      
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Set up a passkey for secure, biometric authentication. This will use your device's 
          built-in security features like Touch ID, Face ID, or Windows Hello.
        </p>

        {error && (
          <div className="p-3 rounded bg-red-900/20 border border-red-700">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded bg-green-900/20 border border-green-700">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        <div className="space-y-3">
          {!hasPasskey ? (
            <button
              onClick={registerPasskey}
              disabled={isRegistering || !WebauthnHelper.isSupported()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isRegistering ? 'Registering...' : 'Register Passkey'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded bg-green-900/20 border border-green-700">
                <p className="text-green-300 text-sm">✓ Passkey is registered</p>
              </div>
              <button
                onClick={removePasskey}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Remove Passkey
              </button>
            </div>
          )}

          {!WebauthnHelper.isSupported() && (
            <div className="p-3 rounded bg-yellow-900/20 border border-yellow-700">
              <p className="text-yellow-300 text-sm">
                ⚠️ WebAuthn is not supported in this browser. Please use a modern browser 
                with WebAuthn support.
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p><strong>Note:</strong> Passkeys are stored securely on your device</p>
          <p>Supported: Touch ID, Face ID, Windows Hello, security keys</p>
        </div>
      </div>
    </div>
  )
}

