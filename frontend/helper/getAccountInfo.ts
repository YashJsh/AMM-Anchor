import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js"

export interface UserTokens{
    pubkey: PublicKey;
    mint: PublicKey;
    amount: string;
    owner: PublicKey;
}

export const getUserAccountInfo = async (publicKey: string) => {
    const connection = new Connection(clusterApiUrl("devnet"));
    const pubKey = new PublicKey(publicKey);
    const tokens_account = await connection.getTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID
    });
    const toke = tokens_account.value.map((token) => {
        const data = AccountLayout.decode(token.account.data);
        return {
            pubkey: token.pubkey,         
            mint: data.mint,                      
            amount: data.amount.toLocaleString(),        
            owner: data.owner,                     

        }
    });
    return toke;
}

