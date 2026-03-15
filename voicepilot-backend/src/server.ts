/**
 * VoicePilot Backend Server
 * Express server for processing screen + voice → code changes
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import analyzeRouter from './routes/analyze';
import { requestIdMiddleware } from './middleware/requestId';
import { standardRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VoicePilot Backend API',
      version: '1.0.0',
      description: 'AI-powered frontend development assistant backend. Processes screenshots + voice commands to generate code changes.',
      contact: {
        name: 'VoicePilot Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local development server',
      },
      {
        url: 'https://voicepilot-backend-xyz-uc.a.run.app',
        description: 'Production server (example)',
      },
    ],
    tags: [
      {
        name: 'Analyze',
        description: 'Screenshot and voice analysis endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      schemas: {
        Selection: {
          type: 'object',
          required: ['x', 'y', 'width', 'height'],
          properties: {
            x: {
              type: 'number',
              description: 'X coordinate of selection',
              example: 100,
            },
            y: {
              type: 'number',
              description: 'Y coordinate of selection',
              example: 200,
            },
            width: {
              type: 'number',
              description: 'Width of selection',
              example: 150,
            },
            height: {
              type: 'number',
              description: 'Height of selection',
              example: 50,
            },
          },
        },
        AnalyzeRequest: {
          type: 'object',
          required: ['screenshot', 'audio', 'selection'],
          properties: {
            screenshot: {
              type: 'string',
              description: 'Base64 encoded screenshot image',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
            },
            audio: {
              type: 'string',
              description: 'Base64 encoded audio data',
              example: 'data:audio/webm;base64,GkXfo59ChoEBQveBA...',
            },
            selection: {
              $ref: '#/components/schemas/Selection',
            },
          },
        },
        AnalyzeResponse: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Path to the file that should be modified',
              example: 'src/components/Button.tsx',
            },
            codeChange: {
              type: 'string',
              description: 'The generated code change',
              example: 'background-color: #3b82f6;',
            },
            description: {
              type: 'string',
              description: 'Human-readable description of the change',
              example: 'Change button background to blue',
            },
            confidence: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score of the analysis',
              example: 0.92,
            },
            element: {
              type: 'string',
              description: 'Identified UI element type',
              example: 'button',
            },
            intent: {
              type: 'string',
              description: 'Parsed user intent',
              example: 'change color to blue',
            },
          },
        },
        ApplyRequest: {
          type: 'object',
          required: ['filePath', 'codeChange'],
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to modify',
              example: 'src/components/Button.tsx',
            },
            codeChange: {
              type: 'string',
              description: 'Code change to apply',
              example: 'background-color: #3b82f6;',
            },
          },
        },
        ApplyResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the operation was successful',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Status message',
              example: 'Successfully applied changes to src/components/Button.tsx',
            },
          },
        },
        DemoRequest: {
          type: 'object',
          properties: {
            demoType: {
              type: 'string',
              enum: ['button-blue', 'card-padding', 'text-bigger', 'grid-layout'],
              description: 'Type of demo response to return',
              example: 'button-blue',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'ok'],
              description: 'Service health status',
            },
            service: {
              type: 'string',
              description: 'Service name',
            },
            version: {
              type: 'string',
              description: 'Service version',
              example: '1.0.0',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current server timestamp',
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}));

app.use(express.json({ limit: '50mb' })); // Allow large payloads for base64 images/audio

// Request ID middleware (must be before logging and rate limiting)
app.use(requestIdMiddleware);

// Rate limiting middleware (excludes health checks)
app.use(standardRateLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'VoicePilot API Documentation',
}));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Overall service health check
 *     description: Returns the health status of the VoicePilot backend service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health', (_req: Request, res: Response) => {
  logger.info('Health check requested');
  res.json({
    status: 'healthy',
    service: 'voicepilot-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/analyze', analyzeRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'VoicePilot Backend',
    description: 'AI-powered frontend development assistant',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      'POST /api/analyze': 'Analyze screenshot + audio and return code changes',
      'POST /api/analyze/apply': 'Apply code changes to file system',
      'POST /api/analyze/demo': 'Demo endpoint with hardcoded responses',
      'GET /api/analyze/health': 'Health check for analyze service',
      'GET /health': 'Overall service health check',
      'GET /api-docs': 'Interactive API documentation (Swagger UI)',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  logger.warn('Endpoint not found', { path: _req.path, method: _req.method });
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      '/api/analyze',
      '/api/analyze/apply',
      '/api/analyze/demo',
      '/api/analyze/health',
      '/health',
      '/api-docs',
    ],
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('VoicePilot Backend Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🎙️  VoicePilot Backend Server                          ║
║                                                          ║
║   Listening on port ${PORT}                              ║
║                                                          ║
║   Endpoints:                                             ║
║   • POST /api/analyze    - Analyze screenshot + audio   ║
║   • POST /api/apply      - Apply code changes            ║
║   • GET  /health         - Health check                  ║
║   • GET  /api-docs       - API Documentation (Swagger)   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
