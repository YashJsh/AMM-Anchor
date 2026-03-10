import { getMint } from "@solana/spl-token"
import { Connection, PublicKey } from "@solana/web3.js"

export const getTokenMint = async (connection : Connection, mintAddress : PublicKey) => {
    const mintInfo = await getMint(connection, mintAddress)
    console.log(mintInfo.decimals)
    return mintInfo
}