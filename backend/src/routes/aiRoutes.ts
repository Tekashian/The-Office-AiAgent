import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { AIService } from '../services/aiService';

const router = Router();
const aiService = new AIService();

// Generate AI content
router.post('/generate', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('🤖 AI Generate request:', { type, promptLength: prompt.length });

    const response = await aiService.sendRequest({
      prompt,
      temperature: 0.6,
      maxTokens: 1000,
    });

    console.log('✅ AI response generated');

    res.json({
      content: response.content,
      type: type || 'text'
    });
  } catch (error: any) {
    console.error('❌ AI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI content',
      details: error.message 
    });
  }
});

export default router;
