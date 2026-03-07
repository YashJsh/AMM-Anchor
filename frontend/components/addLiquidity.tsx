import { getProgramInstance } from "@/program/getProgramInstance"
import { InitializePool } from "@/program/initialize_pool";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"


export const AddLiquidity = ()=> {
    const wallet = useAnchorWallet();
    const {connection} = useConnection();
    if (!wallet){
        console.log("No wallet present");
        return;
    }
    const program = getProgramInstance(wallet, connection);
    
    const addLiquidity = ()=> {
        if (!program){
            return;
        }
        const tokenAMint = "123";
        const tokenBMint = "123";
        const tx = InitializePool(program, tokenAMint, tokenBMint, 30);
    }
    
    return <div>
        Add Liquidity
    </div>
}