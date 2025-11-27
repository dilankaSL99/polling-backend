require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');

// Imports
const Database = require('./config/Database'); 
const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/pollRoutes');
const ErrorHandler = require('./middleware/ErrorHandler'); 
const swaggerSpec = require('./swaggerConfig');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
Database.connect();

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api', authRoutes);
app.use('/api/polls', pollRoutes);

// Error Handler (Must be last)
app.use(ErrorHandler.handle);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});