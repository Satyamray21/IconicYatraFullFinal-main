import swaggerAutogen from 'swagger-autogen';

const doc = {
  swagger: "2.0",
  info: {
    title: 'Iconic Yatra',
    description: 'Auto-generated Swagger docs',
    version: '1.0.0',
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http'],
  consumes: ['application/json', 'multipart/form-data'],
  produces: ['application/json'],
  definitions: {},
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Enter your JWT token in the format: Bearer <token>',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
 
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen()(outputFile, endpointsFiles, doc);