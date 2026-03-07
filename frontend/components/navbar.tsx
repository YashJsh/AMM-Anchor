import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b-1 border-slate-200">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
    
                <div className="flex items-center gap-2">
                    <h1 className="font-bold text-xl tracking-tighter">
                        AMM.xyz
                    </h1>
                </div>

                {/* Wallet Connector */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-xs text-slate-400 font-mono">
                        Devnet
                    </div>
                    <WalletMultiButton className="" />
                </div>
            </div>
        </nav>
    );
};