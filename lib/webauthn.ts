import { createWebAuthnCredential } from "viem/account-abstraction";

export interface PasskeyCredential {
  id: string;
  publicKey: `0x${string}`;
  type: 'public-key';
  credential: any;
}

export class WebauthnHelper {
  static async createCredential(userId: string, userName: string): Promise<PasskeyCredential> {
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn not supported");
    }

    try {
      const credential = await createWebAuthnCredential({
        name: userName,
      });

      const publicKeyHex = credential.publicKey as `0x${string}`;

      return {
        id: credential.id,
        publicKey: publicKeyHex,
        type: 'public-key',
        credential: credential
      };
    } catch (error) {
      console.error('Error creating WebAuthn credential:', error);
      throw new Error(`Failed to create WebAuthn credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static isSupported(): boolean {
    return !!window.PublicKeyCredential && !!navigator.credentials;
  }
}