import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js"

export interface UserTokens {
    pubkey: PublicKey;
    mint: string;
    amount: number;
    decimals: number;
    symbol?: string;
    name?: string;
    logo?: string;
}

export const getUserTokensInfo = async (publicKey: PublicKey, connection: Connection, data : Map<any, any>
) => {
    const pubKey = new PublicKey(publicKey);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID
    });
    const tokens: UserTokens[] = tokenAccounts.value
        .map((token) => {
            const info = token.account.data.parsed.info;
            const mint = info.mint;
            const meta = data.get(mint);
            
            return {
                pubkey: token.pubkey,
                mint: info.mint,
                amount: info.tokenAmount.uiAmount,
                decimals: info.tokenAmount.decimals,
                symbol: meta?.symbol ?? mint.slice(0,4),
                name: meta?.name ?? "Unknown Token",
                logo: meta?.logoURI ?? ""
            };
    });
    return tokens;
}

