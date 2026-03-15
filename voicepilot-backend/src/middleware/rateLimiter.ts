/**
 * Rate Limiting Middleware
 * Configures Express rate limiting with health check exclusions
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Skip function to exclude health check endpoints from rate limiting
 */
const skipHealthChecks = (req: Request): boolean => {
  const healthPaths = ['/health', '/api/analyze/health'];
  return healthPaths.includes(req.path);
};

/**
 * Standard rate limiter: 100 requests per 15 minutes per IP
 * Excludes health check endpoints
 */
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipHealthChecks,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
  keyGenerator: (req: Request): string => {
    // Use IP address as the key
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Stricter rate limiter for expensive operations
 * 20 requests per 15 minutes per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded for this endpoint. Please try again later.',
      retryAfter: 900,
    });
  },
  keyGenerator: (req: Request): string => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export default standardRateLimiter;
