
// pub fn first_lp(amount_a : u64, amount_b : u64)-> u64{
//     let product = amount_a * amount_b;
//     product.isqrt()
// }
use crate::error::ErrorCode;


pub fn first_lp(amount_a: u64, amount_b: u64) -> Result<u64, ErrorCode> {
    let product = amount_a
        .checked_mul(amount_b)
        .ok_or(ErrorCode::MathOverflow)?;
    let lp = product.isqrt();
    Ok(lp)
}

pub fn calculate_lp(amount_a : u64, amount_b : u64, reserve_a : u64, reserve_b : u64, total_supply : u64)-> Result<u64, ErrorCode> {
    // let lp_a = amount_a * total_supply /reserve_a;
    // let lp_b = amount_b * total_supply /reserve_b;

    let lp_a = amount_a
        .checked_mul(total_supply)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(reserve_a)
        .ok_or(ErrorCode::MathOverflow)?;

    let lp_b = amount_b
        .checked_mul(total_supply)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(reserve_b)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(u64::min(lp_a, lp_b))
}

pub fn calculate_swap(reserve_in : u64 , reserve_out : u64, amount_in_with_fee : u64) -> Result<u64, ErrorCode>{
    // let numerator = amount_in_with_fee * reserve_out;
    // let denominator = reserve_in * 1000 + amount_in_with_fee;
    let numerator = amount_in_with_fee
        .checked_mul(reserve_out)
        .ok_or(ErrorCode::MathOverflow)?;

    let denominator = reserve_in
        .checked_mul(1000)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(ErrorCode::MathOverflow)?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(amount_out)
}

pub struct Share{
    pub share_a : u64,
    pub share_b : u64
}

pub fn calculate_remove_share(reserve_a : u64, reserve_b : u64, lp_amount: u64, total_supply : u64) -> Result<Share, ErrorCode>{
    let share_a = lp_amount.checked_mul(reserve_b).ok_or(ErrorCode::MathOverflow)?.checked_div(total_supply).ok_or(ErrorCode::MathOverflow)?;

    let share_b = lp_amount.checked_mul(reserve_a).ok_or(ErrorCode::MathOverflow)?.checked_div(total_supply).ok_or(ErrorCode::MathOverflow)?;

    Ok(Share{
        share_a,
        share_b
    })
}



// pub fn calculate_swap(reserve_a : u64, reserve_b : u64, amount_in_with_fee : u64) -> u64{
//     let constant = reserve_a * reserve_b;
//     //Now user want to swap, so we will increase the token in the pool first.
//     let new_reserve_a = reserve_a + amount_in_with_fee;

//     let new_reserve_b  = constant / new_reserve_a;

//     let amount_out = reserve_b - new_reserve_b;

//     amount_out
// }