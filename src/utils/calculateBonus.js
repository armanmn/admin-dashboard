/**
 * Calculates loyalty bonus based on user and price
 * @param {number} totalPrice - The full price (typically room * nights)
 * @param {Object} user - User object containing role and loyaltyRate
 * @returns {number} bonus in AMD
 */
export default function calculateBonus(totalPrice, user) {
    if (!user || !totalPrice) return 0;
  
    let rate = 0;
  
    if (user.role === "b2c") {
      rate = 1; // 1% for B2C
    } else if (user.role === "b2b_sales_partner") {
        rate = user?.loyaltyRate || 0;
    }
  
    return Math.round((totalPrice * rate) / 100);
  }