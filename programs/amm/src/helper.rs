
pub fn first_lp(amount_a : u64, amount_b : u64)-> u64{
    let product = amount_a * amount_b;
    product.isqrt()
}