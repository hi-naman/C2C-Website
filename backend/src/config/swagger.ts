import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'C2C Coding Club API',
      version: '1.0.0',
      description:
        'Backend API for the C2C coding club platform — sessions, contests, camps, hackathons, forum, leaderboard and more.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
  },
  // where to look for JSDoc comments
  apis: [
  './src/routes/*.ts',   // local dev (ts-node-dev)
  './dist/routes/*.js',  // production (compiled, in Docker)
  ]
};

export const swaggerSpec = swaggerJSDoc(options);