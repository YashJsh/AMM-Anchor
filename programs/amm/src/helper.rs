
pub fn first_lp(amount_a : u64, amount_b : u64)-> u64{
    let product = amount_a * amount_b;
    product.isqrt()
}

pub fn calculate_lp(amount_a : u64, amount_b : u64, reserve_a : u64, reserve_b : u64, total_supply : u64)-> u64{
    let lp_a = amount_a * total_supply /reserve_a;
    let lp_b = amount_b * total_supply /reserve_b;
    u64::min(lp_a, lp_b)
}

