
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoiceRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});












// ========================================
// API DOCUMENTATION
// ========================================
/*

BASE URL: http://localhost:5000/api

ENDPOINTS:

1. CREATE INVOICE
   POST /invoices
   Body: {
     "clientName": "John Doe",
     "clientEmail": "john@example.com",
     "clientAddress": "123 Main St",
     "invoiceDate": "2024-01-01",
     "dueDate": "2024-01-31",
     "items": [
       {
         "description": "Web Development",
         "quantity": "10",
         "rate": "100.00"
       }
     ],
     "taxRate": "10.00",
     "notes": "Payment due within 30 days",
     "status": "draft"
   }

2. GET ALL INVOICES (with filtering and pagination)
   GET /invoices?status=pending&search=john&page=1&limit=10&sortBy=createdAt&order=desc

3. GET INVOICE BY ID
   GET /invoices/:id

4. UPDATE INVOICE
   PUT /invoices/:id
   Body: {
     "clientName": "Jane Doe",
     "items": [...],
     "taxRate": "15.00"
   }

5. UPDATE INVOICE STATUS
   PATCH /invoices/:id/status
   Body: {
     "status": "paid"
   }

6. DELETE INVOICE
   DELETE /invoices/:id

7. GET STATISTICS
   GET /invoices/statistics
   Response: {
     "statistics": {
       "total": 100,
       "draft": 20,
       "pending": 50,
       "paid": 30,
       "revenue": "15000.00"
     }
   }

STATUS WORKFLOW:
- draft → pending (send invoice)
- pending → paid (mark as paid)
- paid invoices cannot be edited or status changed

*/