// ========================================
// utils/calculations.js - DECIMAL CALCULATIONS
// ========================================
const Decimal = require('mongoose').Types.Decimal128;

// Convert Decimal128 to number for calculations
const toNumber = (decimal) => {
  if (!decimal) return 0;
  if (typeof decimal === 'string') return parseFloat(decimal);
  if (decimal instanceof Decimal) return parseFloat(decimal.toString());
  return parseFloat(decimal);
};

// Convert number to Decimal128
const toDecimal = (num) => {
  return Decimal.fromString(parseFloat(num).toFixed(2));
};

// Calculate line item amount
const calculateItemAmount = (quantity, rate) => {
  const qty = toNumber(quantity);
  const rt = toNumber(rate);
  return toDecimal(qty * rt);
};

// Calculate invoice totals
const calculateInvoiceTotals = (items, taxRate) => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const qty = toNumber(item.quantity);
    const rate = toNumber(item.rate);
    return sum + (qty * rate);
  }, 0);

  // Calculate tax
  const tax = toNumber(taxRate);
  const taxAmount = (subtotal * tax) / 100;

  // Calculate total
  const total = subtotal + taxAmount;

  return {
    subtotal: toDecimal(subtotal),
    taxAmount: toDecimal(taxAmount),
    total: toDecimal(total)
  };
};

// Process items and calculate amounts
const processItems = (items) => {
  return items.map(item => ({
    description: item.description,
    quantity: toDecimal(item.quantity),
    rate: toDecimal(item.rate),
    amount: calculateItemAmount(item.quantity, item.rate)
  }));
};

module.exports = {
  toNumber,
  toDecimal,
  calculateItemAmount,
  calculateInvoiceTotals,
  processItems
};