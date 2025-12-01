import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import agentController from '../controllers/AgentController';

const router = Router();

/**
 * POST /api/agent/chat
 * Chat with AI agent (with tool execution capabilities)
 */
router.post('/chat', optionalAuth, agentController.chat);

/**
 * POST /api/agent/task
 * Process a task with AI (optional authentication)
 */
router.post('/task', optionalAuth, agentController.processTask);

/**
 * POST /api/agent/analyze
 * Analyze text with AI (optional authentication)
 */
router.post('/analyze', optionalAuth, agentController.analyzeText);

export default router;
