/**
 * Request ID Middleware
 * Generates and attaches correlation IDs to requests
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setRequestId, clearRequestId } from '../utils/logger';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware to generate and attach request correlation IDs
 * - Generates x-request-id if not provided in headers
 * - Attaches requestId to req object
 * - Sets requestId in logger context
 * - Returns requestId in response headers
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Use existing request ID from header or generate new one
  const requestId = req.headers['x-request-id'] as string | undefined;
  req.requestId = requestId || uuidv4();

  // Set request ID in logger context
  setRequestId(req.requestId);

  // Add request ID to response headers
  res.setHeader('x-request-id', req.requestId);

  // Clear request ID from logger after response is sent
  res.on('finish', () => {
    clearRequestId();
  });

  next();
};

export default requestIdMiddleware;
