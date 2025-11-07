// ========================================
// middleware/validation.js - REQUEST VALIDATION
// ========================================
const { body, param, query, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation Error",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const invoiceValidation = {
  create: [
    body("clientName").trim().notEmpty().withMessage("Client name is required"),
    body("clientEmail").trim().isEmail().withMessage("Valid email is required"),
    body("clientAddress")
      .trim()
      .notEmpty()
      .withMessage("Client address is required"),
    body("invoiceDate")
      .isISO8601()
      .withMessage("Valid invoice date is required"),
    body("dueDate")
      .isISO8601()
      .withMessage("Valid due date is required")
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.invoiceDate)) {
          throw new Error("Due date must be after invoice date");
        }
        return true;
      }),
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one item is required"),
    body("items.*.description")
      .trim()
      .notEmpty()
      .withMessage("Item description is required"),
    body("items.*.quantity")
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be greater than 0"),
    body("items.*.rate")
      .isFloat({ gte: 0 })
      .withMessage("Rate must be 0 or greater"),
    body("taxRate")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax rate must be between 0 and 100"),
    body("status")
      .optional()
      .isIn(["draft", "pending", "paid"])
      .withMessage("Invalid status"),
    validate,
  ],

  update: [
    param("id").isMongoId().withMessage("Invalid invoice ID"),
    body("clientName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Client name cannot be empty"),
    body("clientEmail")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Valid email is required"),
    body("clientAddress")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Client address cannot be empty"),
    body("invoiceDate")
      .optional()
      .isISO8601()
      .withMessage("Valid invoice date is required"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Valid due date is required"),
    body("items")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one item is required"),
    body("items.*.description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Item description is required"),
    body("items.*.quantity")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be greater than 0"),
    body("items.*.rate")
      .optional()
      .isFloat({ gte: 0 })
      .withMessage("Rate must be 0 or greater"),
    body("taxRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax rate must be between 0 and 100"),
    validate,
  ],

  getById: [
    param("id").isMongoId().withMessage("Invalid invoice ID"),
    validate,
  ],

  delete: [param("id").isMongoId().withMessage("Invalid invoice ID"), validate],

  query: [
    query("status")
      .optional()
      .isIn(["draft", "pending", "paid", "all"])
      .withMessage("Invalid status"),
    query("search").optional().trim(),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    validate,
  ],

  updateStatus: [
    param("id").isMongoId().withMessage("Invalid invoice ID"),
    body("status")
      .isIn(["draft", "pending", "paid"])
      .withMessage("Invalid status"),
    validate,
  ],
};

module.exports = { invoiceValidation };
