/**
 * Analyze Route - POST /api/analyze
 * Processes screenshot + audio and returns code changes
 */

import { Router, Request, Response } from 'express';
import { analyzeWithGemini } from '../services/gemini';
import { generateCodeChange, applyCodeChange } from '../services/codeGenerator';
import { logger } from '../utils/logger';

const router = Router();

// Request body interface
interface AnalyzeRequest {
  screenshot: string; // base64 encoded
  audio: string; // base64 encoded
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Response interface
interface AnalyzeResponse {
  targetFile: string;
  codeChange: string;
  description: string;
  confidence: number;
  element: string;
  intent: string;
}

/**
 * @openapi
 * /api/analyze:
 *   post:
 *     summary: Analyze screenshot + audio and return code changes
 *     description: |
 *       Main endpoint for processing screenshot + audio commands.
 *       Takes a screenshot, audio recording, and selection coordinates,
 *       then uses Gemini AI to understand the intent and generate code changes.
 *     tags: [Analyze]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyzeRequest'
 *           examples:
 *             button-blue:
 *               summary: Change button to blue
 *               value:
 *                 screenshot: "data:image/png;base64,iVBORw0KGgoAAAANS..."
 *                 audio: "data:audio/webm;base64,GkXfo59ChoEBQveBA..."
 *                 selection:
 *                   x: 100
 *                   y: 200
 *                   width: 150
 *                   height: 50
 *     responses:
 *       200:
 *         description: Successfully analyzed and generated code changes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyzeResponse'
 *             example:
 *               targetFile: "src/components/Button.tsx"
 *               codeChange: "background-color: #3b82f6;"
 *               description: "Change button background to blue"
 *               confidence: 0.92
 *               element: "button"
 *               intent: "change color to blue"
 *       400:
 *         description: Invalid request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Missing required fields"
 *               required: ["screenshot", "audio", "selection"]
 *               received: ["screenshot"]
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { screenshot, audio, selection } = req.body as AnalyzeRequest;

    // Validate request
    if (!screenshot || !audio || !selection) {
      logger.warn('Missing required fields in analyze request', {
        received: Object.keys(req.body),
      });
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['screenshot', 'audio', 'selection'],
        received: Object.keys(req.body),
      });
    }

    // Validate selection coordinates
    if (
      typeof selection.x !== 'number' ||
      typeof selection.y !== 'number' ||
      typeof selection.width !== 'number' ||
      typeof selection.height !== 'number'
    ) {
      logger.warn('Invalid selection coordinates', { selection });
      return res.status(400).json({
        error: 'Invalid selection coordinates',
        selection,
      });
    }

    logger.info('Processing analyze request', {
      selection,
      screenshotLength: screenshot.length,
      audioLength: audio.length,
    });

    // Step 1: Analyze with Gemini
    const geminiResult = await analyzeWithGemini({
      screenshot,
      audio,
      selection,
    });

    logger.info('Gemini analysis completed', {
      element: geminiResult.element,
      intent: geminiResult.intent,
      confidence: geminiResult.confidence,
    });

    // Step 2: Generate code change
    const codeChange = generateCodeChange({
      element: geminiResult.element,
      intent: geminiResult.intent,
      selection,
    });

    logger.info('Code change generated', {
      targetFile: codeChange.targetFile,
      description: codeChange.description,
    });

    // Step 3: Return response
    const response: AnalyzeResponse = {
      targetFile: codeChange.targetFile,
      codeChange: codeChange.codeChange,
      description: codeChange.description,
      confidence: Math.min(geminiResult.confidence, codeChange.confidence),
      element: codeChange.element,
      intent: codeChange.intent,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error in analyze endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @openapi
 * /api/analyze/apply:
 *   post:
 *     summary: Apply code changes to file system
 *     description: Applies a generated code change to the specified file path
 *     tags: [Analyze]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyRequest'
 *           example:
 *             filePath: "src/components/Button.tsx"
 *             codeChange: "background-color: #3b82f6;"
 *     responses:
 *       200:
 *         description: Successfully applied code changes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplyResponse'
 *             example:
 *               success: true
 *               message: "Successfully applied changes to src/components/Button.tsx"
 *       400:
 *         description: Invalid request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { filePath, codeChange } = req.body;

    if (!filePath || !codeChange) {
      logger.warn('Missing required fields in apply request', {
        received: Object.keys(req.body),
      });
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['filePath', 'codeChange'],
      });
    }

    logger.info('Applying code change', { filePath });

    const result = await applyCodeChange(filePath, codeChange);

    logger.info('Code change applied successfully', { filePath });

    res.json(result);
  } catch (error) {
    logger.error('Error in apply endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @openapi
 * /api/analyze/health:
 *   get:
 *     summary: Health check for analyze service
 *     description: Returns the health status of the analyze service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "ok"
 *               service: "voicepilot-analyze"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 */
router.get('/health', (_req: Request, res: Response) => {
  logger.info('Analyze service health check requested');
  res.json({
    status: 'ok',
    service: 'voicepilot-analyze',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /api/analyze/demo:
 *   post:
 *     summary: Demo endpoint with hardcoded responses
 *     description: |
 *       Returns hardcoded demo responses for testing without calling Gemini API.
 *       Useful for frontend development and testing.
 *     tags: [Analyze]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemoRequest'
 *           examples:
 *             button-blue:
 *               summary: Change button to blue
 *               value:
 *                 demoType: "button-blue"
 *             card-padding:
 *               summary: Add padding to card
 *               value:
 *                 demoType: "card-padding"
 *     responses:
 *       200:
 *         description: Demo response returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyzeResponse'
 *             examples:
 *               button-blue:
 *                 summary: Button blue response
 *                 value:
 *                   targetFile: "src/components/Button.tsx"
 *                   codeChange: "// Button.tsx changes:\nconst Button = styled.button`\n  background-color: #3b82f6;\n  color: white;\n  padding: 0.5rem 1rem;\n  border-radius: 0.375rem;\n`;"
 *                   description: "Change button background to blue"
 *                   confidence: 0.92
 *                   element: "button"
 *                   intent: "change color to blue"
 *               card-padding:
 *                 summary: Card padding response
 *                 value:
 *                   targetFile: "src/components/Card.tsx"
 *                   codeChange: "// Card.tsx changes:\nconst Card = styled.div`\n  padding: 1rem;\n  background-color: white;\n  border-radius: 0.5rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n`;"
 *                   description: "Add padding to card component"
 *                   confidence: 0.88
 *                   element: "card"
 *                   intent: "add padding"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const { demoType } = req.body;

    logger.info('Demo request received', { demoType });

    // Hardcoded demo responses
    const demoResponses: Record<string, AnalyzeResponse> = {
      'button-blue': {
        targetFile: 'src/components/Button.tsx',
        codeChange: `// Button.tsx changes:
const Button = styled.button\`
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
\`;`,
        description: 'Change button background to blue',
        confidence: 0.92,
        element: 'button',
        intent: 'change color to blue',
      },
      'card-padding': {
        targetFile: 'src/components/Card.tsx',
        codeChange: `// Card.tsx changes:
const Card = styled.div\`
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
\`;`,
        description: 'Add padding to card component',
        confidence: 0.88,
        element: 'card',
        intent: 'add padding',
      },
      'text-bigger': {
        targetFile: 'src/styles/typography.css',
        codeChange: `// typography.css changes:
.text-element {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

// Or Tailwind class update:
// className="text-xl"`,
        description: 'Increase font size for text element',
        confidence: 0.85,
        element: 'text',
        intent: 'bigger font',
      },
      'grid-layout': {
        targetFile: 'src/components/Container.tsx',
        codeChange: `// Container.tsx changes:
const Container = styled.div\`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
\`;`,
        description: 'Change layout to grid with 3 columns',
        confidence: 0.90,
        element: 'container',
        intent: 'grid layout',
      },
    };

    const response = demoResponses[demoType] || demoResponses['button-blue'];
    
    logger.info('Demo response sent', { demoType: demoType || 'button-blue' });
    
    res.json(response);
  } catch (error) {
    logger.error('Error in demo endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
