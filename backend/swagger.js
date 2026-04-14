const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexusBank API',
      version: '1.0.0',
      description: 'API for NexusBank Netbanking Application',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./swagger-def.js'],
};

module.exports = swaggerJsdoc(options);
