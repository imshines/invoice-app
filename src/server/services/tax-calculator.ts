export interface TaxCalculationItem {
  productId: string;
  itemName: string;
  hsnSac: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  taxPercent: number;
  discountPercent?: number;
}

export interface TaxCalculationResult {
  items: Array<{
    productId: string;
    itemName: string;
    hsnSac: string;
    unitOfMeasure: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    discountPercent: number;
    discountAmount: number;
    taxableValue: number;
    taxPercent: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  itemDiscountTotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Calculates Indian GST based on seller state code vs buyer state code.
 * Intra-state (same state): Split 50% CGST + 50% SGST
 * Inter-state (different state): 100% IGST
 */
export function calculateInvoiceTaxes(
  items: TaxCalculationItem[],
  sellerStateCode: string,
  buyerStateCode: string,
  specialDiscount: number = 0
): TaxCalculationResult {
  const isIntraState = sellerStateCode === buyerStateCode || !buyerStateCode;

  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems = items.map((item) => {
    const rawTotal = item.quantity * item.unitPrice;
    subtotal += rawTotal;

    const discountPercent = item.discountPercent || 0;
    const discountAmount = Number(((rawTotal * discountPercent) / 100).toFixed(2));
    itemDiscountTotal += discountAmount;

    const taxableValue = Number((rawTotal - discountAmount).toFixed(2));
    taxableAmount += taxableValue;

    const totalTaxForLine = Number(((taxableValue * item.taxPercent) / 100).toFixed(2));

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstRate = Number((item.taxPercent / 2).toFixed(2));
      cgstAmount = Number((totalTaxForLine / 2).toFixed(2));
      sgstRate = cgstRate;
      sgstAmount = Number((totalTaxForLine - cgstAmount).toFixed(2)); // avoid half-cent rounding loss
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
    } else {
      igstRate = item.taxPercent;
      igstAmount = totalTaxForLine;
      igstTotal += igstAmount;
    }

    const totalAmount = Number((taxableValue + totalTaxForLine).toFixed(2));

    return {
      productId: item.productId,
      itemName: item.itemName,
      hsnSac: item.hsnSac,
      unitOfMeasure: item.unitOfMeasure,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
      discountPercent,
      discountAmount,
      taxableValue,
      taxPercent: item.taxPercent,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalAmount,
    };
  });

  const totalTaxAmount = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));
  const rawGrandTotal = Number((taxableAmount + totalTaxAmount - specialDiscount).toFixed(2));
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  return {
    items: processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    itemDiscountTotal: Number(itemDiscountTotal.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstAmount: Number(cgstTotal.toFixed(2)),
    sgstAmount: Number(sgstTotal.toFixed(2)),
    igstAmount: Number(igstTotal.toFixed(2)),
    totalTaxAmount,
    roundOff,
    grandTotal: roundedGrandTotal,
  };
}
