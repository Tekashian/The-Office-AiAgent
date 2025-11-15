import { Router, Request, Response } from 'express';
import aiService from '../services/aiService';

const router = Router();

/**
 * POST /api/agent/chat
 * Chat with AI agent
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        message: 'Message is required',
      });
      return;
    }

    const response = await aiService.chat(message, conversationHistory);

    res.json({
      success: true,
      data: {
        content: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agent/task
 * Process a task with AI
 */
router.post('/task', async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, context } = req.body;

    if (!description) {
      res.status(400).json({
        success: false,
        message: 'Task description is required',
      });
      return;
    }

    const result = await aiService.processTask(description, context);

    res.json({
      success: true,
      data: {
        result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Task processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agent/analyze
 * Analyze text with AI
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, analysisType } = req.body;

    if (!text || !analysisType) {
      res.status(400).json({
        success: false,
        message: 'Text and analysis type are required',
      });
      return;
    }

    const result = await aiService.analyzeText(text, analysisType);

    res.json({
      success: true,
      data: {
        analysis: result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
