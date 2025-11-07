// ========================================
// routes/invoiceRoutes.js - API ROUTES
// ========================================
const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { invoiceValidation } = require("../middleware/validation");

// Statistics
router.get("/statistics", invoiceController.getStatistics);

// CRUD Routes
router.post("/", invoiceValidation.create, invoiceController.createInvoice);
router.get("/", invoiceValidation.query, invoiceController.getAllInvoices);
router.get("/:id", invoiceValidation.getById, invoiceController.getInvoiceById);
router.put("/:id", invoiceValidation.update, invoiceController.updateInvoice);
router.patch(
  "/:id/status",
  invoiceValidation.updateStatus,
  invoiceController.updateInvoiceStatus
);
router.delete(
  "/:id",
  invoiceValidation.delete,
  invoiceController.deleteInvoice
);

module.exports = router;
