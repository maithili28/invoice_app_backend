// ========================================
// models/Invoice.js - DATABASE SCHEMA
// ========================================
const mongoose = require('mongoose');

// Line Item Schema
const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true
  },
  quantity: {
    type: mongoose.Types.Decimal128,
    required: [true, 'Quantity is required'],
    validate: {
      validator: function(v) {
        return parseFloat(v.toString()) > 0;
      },
      message: 'Quantity must be greater than 0'
    }
  },
  rate: {
    type: mongoose.Types.Decimal128,
    required: [true, 'Rate is required'],
    validate: {
      validator: function(v) {
        return parseFloat(v.toString()) >= 0;
      },
      message: 'Rate must be greater than or equal to 0'
    }
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: true
  }
}, { _id: false });

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  clientAddress: {
    type: String,
    required: [true, 'Client address is required'],
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(v) {
        return v >= this.invoiceDate;
      },
      message: 'Due date must be after invoice date'
    }
  },
  items: {
    type: [lineItemSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  taxRate: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0,
    validate: {
      validator: function(v) {
        const val = parseFloat(v.toString());
        return val >= 0 && val <= 100;
      },
      message: 'Tax rate must be between 0 and 100'
    }
  },
  taxAmount: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  total: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid'],
    default: 'draft'
  },
  sentAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ clientName: 1 });
invoiceSchema.index({ clientEmail: 1 });

// Convert Decimal128 to string for JSON responses
invoiceSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.subtotal = ret.subtotal.toString();
    ret.taxRate = ret.taxRate.toString();
    ret.taxAmount = ret.taxAmount.toString();
    ret.total = ret.total.toString();
    ret.items = ret.items.map(item => ({
      description: item.description,
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      amount: item.amount.toString()
    }));
    return ret;
  }
});

module.exports = mongoose.model('Invoices', invoiceSchema);