export function getSwapOutput(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
    console.log("Amount in getSwapOutout is : ", amountIn);
    console.log("Reserve in is : ", reserveIn);
    console.log("reserve out is : ", reserveOut);

  if (amountIn <= BigInt(0)) return BigInt(0);
  if (reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) return BigInt(0);

  const feeNumerator = BigInt(997);
  const feeDenominator = BigInt(1000);

  const amountInWithFee = amountIn * feeNumerator;

  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * feeDenominator + amountInWithFee;
  console.log("Amount out getSwapOutput is : ", numerator/denominator)
  return numerator / denominator;
}