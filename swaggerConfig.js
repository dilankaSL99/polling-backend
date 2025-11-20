import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'Polling API',
      version: '1.0.0',
      description: 'A simple Express API for the Polling App (Auth + Polls)',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      schemas: {
        // --- AUTH SCHEMAS ---
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 6 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string', description: 'JWT Bearer token' },
          },
        },
        ProfileResponse: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            userId: { type: 'string' },
          },
        },
        
        // --- POLL SCHEMAS (NEW) ---
        CreatePollRequest: {
          type: 'object',
          required: ['title', 'category', 'options'],
          properties: {
            title: { type: 'string', example: 'Best Programming Language?' },
            description: { type: 'string', example: 'Vote for your favorite.' },
            category: { type: 'string', example: 'Technology' },
            options: { 
              type: 'array',
              items: { type: 'string' },
              example: ['Python', 'JavaScript', 'Dart']
            },
          },
        },
        PollResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            category: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  votes: { type: 'number' }
                }
              }
            },
            creatorId: { 
              type: 'object',
              properties: {
                _id: { type: 'string' },
                email: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // --- GENERAL ERROR ---
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;