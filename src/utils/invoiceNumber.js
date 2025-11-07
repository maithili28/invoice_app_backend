// ========================================
// utils/invoiceNumber.js - INVOICE NUMBER GENERATOR
// ========================================
const Invoice = require("../models/Invoice");

const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Format: INV-YYYYMM-XXXX
  const prefix = `INV-${year}${month}`;

  // Find the last invoice with this prefix
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: new RegExp(`^${prefix}`),
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

module.exports = { generateInvoiceNumber };
