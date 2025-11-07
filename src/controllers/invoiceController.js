// ========================================
// controllers/invoiceController.js - BUSINESS LOGIC
// ========================================
const Invoice = require("../models/Invoice");
const { generateInvoiceNumber } = require("../utils/invoiceNumber");
const {
  calculateInvoiceTotals,
  processItems,
} = require("../utils/calculations");

// Create Invoice
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      clientName,
      clientEmail,
      clientAddress,
      invoiceDate,
      dueDate,
      items,
      taxRate,
      notes,
      status,
    } = req.body;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Process items and calculate amounts
    const processedItems = processItems(items);

    // Calculate totals
    const { subtotal, taxAmount, total } = calculateInvoiceTotals(
      items,
      taxRate
    );

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      invoiceDate,
      dueDate,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: notes || "",
      status: status || "draft",
      sentAt: status === "pending" ? new Date() : null,
    });

    await invoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Invoices with Filtering and Pagination
exports.getAllInvoices = async (req, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    // Execute query
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Invoice
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

// Update Invoice
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Cannot edit paid invoices
    if (invoice.status === "paid") {
      return res.status(400).json({ error: "Cannot edit paid invoices" });
    }

    const {
      clientName,
      clientEmail,
      clientAddress,
      invoiceDate,
      dueDate,
      items,
      taxRate,
      notes,
    } = req.body;

    // Update fields
    if (clientName) invoice.clientName = clientName;
    if (clientEmail) invoice.clientEmail = clientEmail;
    if (clientAddress) invoice.clientAddress = clientAddress;
    if (invoiceDate) invoice.invoiceDate = invoiceDate;
    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (taxRate !== undefined) invoice.taxRate = taxRate;

    // Update items if provided
    if (items && items.length > 0) {
      invoice.items = processItems(items);
      const { subtotal, taxAmount, total } = calculateInvoiceTotals(
        items,
        invoice.taxRate
      );
      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.total = total;
    }

    await invoice.save();

    res.json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// Update Invoice Status
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Validate status transitions
    if (status === "paid" && invoice.status === "draft") {
      return res.status(400).json({
        error: "Cannot mark draft invoices as paid. Send invoice first.",
      });
    }

    if (invoice.status === "paid" && status !== "paid") {
      return res.status(400).json({
        error: "Cannot change status of paid invoices",
      });
    }

    // Update status
    invoice.status = status;

    // Update timestamps
    if (status === "pending" && !invoice.sentAt) {
      invoice.sentAt = new Date();
    }
    if (status === "paid" && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    res.json({
      message: "Invoice status updated successfully",
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Invoice
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get Invoice Statistics
exports.getStatistics = async (req, res, next) => {
  try {
    const [totalInvoices, draftCount, pendingCount, paidCount, totalRevenue] =
      await Promise.all([
        Invoice.countDocuments(),
        Invoice.countDocuments({ status: "draft" }),
        Invoice.countDocuments({ status: "pending" }),
        Invoice.countDocuments({ status: "paid" }),
        Invoice.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: { $toDouble: "$total" } } } },
        ]),
      ]);

    res.json({
      statistics: {
        total: totalInvoices,
        draft: draftCount,
        pending: pendingCount,
        paid: paidCount,
        revenue: totalRevenue[0]?.total?.toFixed(2) || "0.00",
      },
    });
  } catch (error) {
    next(error);
  }
};
