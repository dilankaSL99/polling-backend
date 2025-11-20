// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
import express, { json } from 'express';
import Database from './config/Database';
import authRoutes from './routes/auth';
import pollRoutes from './routes/polls'; // <-- IMPORT THIS
import { handle } from './middleware/ErrorHandler';
import { serve, setup } from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig'; 

//Initialize the app
const app = express();

//Set the port
const PORT = process.env.PORT || 3000;

//Connect to Database
Database.connect();

// Add Middleware
app.use(json());

//Sets up Swagger UI at /api-docs
app.use('/api-docs', serve, setup(swaggerSpec));

//API Routes
app.use('/api', authRoutes);
app.use('/api/polls', pollRoutes); 

//Error Handler
app.use(handle);

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});