"use server"

import { TokenListProvider } from "@solana/spl-token-registry";

export const getTokenMetadata = async () => {
    const tokens = await new TokenListProvider().resolve();
    const tokenList = tokens.filterByChainId(103).getList();
    const tokenMap = new Map();
    tokenList.forEach((token) => {
        tokenMap.set(token.address, token);
    });
    return tokenMap;
}