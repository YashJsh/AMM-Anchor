import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor"
import idl from "../idl/amm.json"
import { AnchorWallet } from "@solana/wallet-adapter-react"
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";

export const useProgram = (wallet : AnchorWallet, connection : Connection) => {
    if (!wallet){
        console.log("No wallet connected")
        return;
    }
    const connection_testnet = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new AnchorProvider(connection_testnet, wallet, { commitment: "confirmed" });

    return new Program<Amm>(idl as Amm, provider)
}