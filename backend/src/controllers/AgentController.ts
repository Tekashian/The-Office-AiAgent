import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { BaseController } from './BaseController';
import { AuthenticatedRequest } from '../middleware/auth';
import agentOrchestrator from '../services/agentOrchestrator';
import aiService from '../services/aiService';
import { supabase } from '../config/supabase';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Agent Controller
 * Handles AI agent chat and task execution
 */
class AgentController extends BaseController {
  /**
   * POST /api/agent/chat
   * Chat with AI agent (with tool execution capabilities)
   */
  chat = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { message, conversationHistory } = req.body;

    if (!message) {
      throw new ValidationError('Message is required');
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
            content: message,
          },
          {
            user_id: req.userId,
            role: 'assistant',
            content: response,
          },
        ]);
      } catch (dbError) {
        logger.error('Failed to save chat messages', dbError);
        // Continue even if database save fails
      }
    }

    this.success(res, {
      content: response,
    });
  });

  /**
   * POST /api/agent/task
   * Process a task with AI (optional authentication)
   */
  processTask = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { description, context } = req.body;

    if (!description) {
      throw new ValidationError('Task description is required');
    }

    const result = await aiService.processTask(description, context);

    this.success(res, { result });
  });

  /**
   * POST /api/agent/analyze
   * Analyze text with AI (optional authentication)
   */
  analyzeText = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { text, analysisType } = req.body;

    if (!text || !analysisType) {
      throw new ValidationError('Text and analysis type are required');
    }

    const result = await aiService.analyzeText(text, analysisType);

    this.success(res, { analysis: result });
  });
}

export default new AgentController();
