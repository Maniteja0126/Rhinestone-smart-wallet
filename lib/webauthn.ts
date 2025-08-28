export interface PasskeyCredential {
    id :string 
    publicKey : `0x${string}`
    type : 'public-key'
}


export class WebauthnHelper {
    static async createCredential(userId : string , userName :string ) : Promise<PasskeyCredential>{
        if(!window.PublicKeyCredential) throw new Error("Webauthn not supported");

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const publicKeyOptions : PublicKeyCredentialCreationOptions = {
            challenge ,
            rp :{
                name : "Rhinestone Wallet",
                id : window.location.hostname
            },
            user :{
                id : new TextEncoder().encode(userId),
                name : userName,
                displayName : userName
            },
            pubKeyCredParams : [
                {type : 'public-key' , alg : -7},

            ],
            timeout : 60000,
            attestation : 'none',
            authenticatorSelection : {
                residentKey : 'preferred',
                userVerification : "preferred"
            }
        }


        const credential = await navigator.credentials.create({
            publicKey : publicKeyOptions
        }) as PublicKeyCredential;

        if(!credential) throw new Error("Failed to create credential");

        const attResp = credential.response as AuthenticatorAttestationResponse;

        const hex = this.arrayBufferToHex(attResp.attestationObject || new ArrayBuffer(0));
        const pubKey = (`0x${hex}`) as `0x${string}`;



        return {
            id: credential.id,
            publicKey: pubKey,
            type: 'public-key'
        }

        
          
    }


    private static arrayBufferToHex(buffer : ArrayBuffer) : string {
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}