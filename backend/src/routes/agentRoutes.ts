import { Router, Response } from 'express';
import aiService from '../services/aiService';
import agentOrchestrator from '../services/agentOrchestrator';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/agent/chat
 * Chat with AI agent (with tool execution capabilities)
 */
router.post('/chat', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        message: 'Message is required',
      });
      return;
    }

    // Use agent orchestrator to process message with tool execution
    const response = await agentOrchestrator.processMessage(
      message,
      req.userId,
      conversationHistory
    );

    // Save chat message to database if user is authenticated
    if (req.userId) {
      try {
        await supabase.from('chat_messages').insert([
          {
            user_id: req.userId,
            role: 'user',
            content: message
          },
          {
            user_id: req.userId,
            role: 'assistant',
            content: response
          }
        ]);
      } catch (dbError) {
        console.error('Failed to save chat messages:', dbError);
        // Continue even if database save fails
      }
    }

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
 * Process a task with AI (optional authentication)
 */
router.post('/task', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
 * Analyze text with AI (optional authentication)
 */
router.post('/analyze', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
