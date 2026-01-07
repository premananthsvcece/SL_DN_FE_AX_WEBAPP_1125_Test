export function calculateTotals(estimateItems) {
  const grandTotal = estimateItems?.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  const totalDiscount = estimateItems?.reduce((acc, item) => {
    const discountValue =
      item.discountType === "percentage"
        ? item.price * (item.discount / 100)
        : item.discount;
    return acc + Math.min(discountValue, item.price) * item.qty;
  }, 0);

  // Updated tax calculation
  const totalTax = estimateItems?.reduce((acc, item) => {
    const taxRate = item.tax / 100;
    // Calculate tax amount using the formula: (base amount * tax rate) / (1 + tax rate)
    const taxAmount = (item.price * item.qty * taxRate) / (1 + taxRate);
    return acc + taxAmount;
  }, 0);

  const overallTotal = grandTotal;
  return { grandTotal, totalDiscount, totalTax, overallTotal };
}

// export function GSTCalculation(totalAmount, gstRate) {
//     //formula is total amount -(total amount * (gst rate / 100))
//     const gstAmount = totalAmount * (gstRate / 100);
//     const totalAmountWithGst = totalAmount - gstAmount;
//     return totalAmountWithGst;
// }

