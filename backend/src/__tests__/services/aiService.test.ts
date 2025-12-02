import axios from 'axios';
import aiService from '../../services/aiService';
import { ExternalServiceError, ValidationError } from '../../utils/errors';
import userContextService from '../../services/userContextService';

// Mock dependencies
jest.mock('axios');
jest.mock('../../services/userContextService');
jest.mock('../../utils/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('should successfully send request and return parsed response', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'AI generated response' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await aiService.sendRequest({
        prompt: 'Test prompt',
        includeContext: false,
      });

      expect(result).toEqual({
        content: 'AI generated response',
        finishReason: 'STOP',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [{ text: 'Test prompt' }],
            },
          ],
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': expect.any(String),
          },
          timeout: 30000,
        })
      );
    });

    it('should include user context when userId is provided', async () => {
      const mockContext = 'User context information\n\n';
      (userContextService.getUserContext as jest.Mock).mockResolvedValue(mockContext);

      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Response with context' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await aiService.sendRequest({
        prompt: 'Test prompt',
        userId: 'user-123',
        includeContext: true,
      });

      expect(userContextService.getUserContext).toHaveBeenCalledWith('user-123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [{ text: mockContext + 'Test prompt' }],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    it('should handle safety filter blocking', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: '' }],
              },
              finishReason: 'SAFETY',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(
        aiService.sendRequest({
          prompt: 'Blocked prompt',
          includeContext: false,
        })
      ).rejects.toThrow(ExternalServiceError);
      await expect(
        aiService.sendRequest({
          prompt: 'Blocked prompt',
          includeContext: false,
        })
      ).rejects.toThrow('Content blocked by safety filters');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: '' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(
        aiService.sendRequest({
          prompt: 'Test prompt',
          includeContext: false,
        })
      ).rejects.toThrow(ExternalServiceError);
      await expect(
        aiService.sendRequest({
          prompt: 'Test prompt',
          includeContext: false,
        })
      ).rejects.toThrow('Empty response from AI service');
    });

    it('should handle 400 validation error', async () => {
      const error: Record<string, unknown> = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid request format',
            },
          },
        },
        isAxiosError: true,
      };

      mockedAxios.post.mockRejectedValue(error);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockImplementation((err: Record<string, unknown>) => err.isAxiosError === true);

      await expect(
        aiService.sendRequest({
          prompt: 'Test',
          includeContext: false,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle 401 authentication error', async () => {
      const error: Record<string, unknown> = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid API key',
            },
          },
        },
        isAxiosError: true,
      };

      mockedAxios.post.mockRejectedValue(error);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockImplementation((err: Record<string, unknown>) => err.isAxiosError === true);

      await expect(
        aiService.sendRequest({
          prompt: 'Test',
          includeContext: false,
        })
      ).rejects.toThrow(ExternalServiceError);
      await expect(
        aiService.sendRequest({
          prompt: 'Test',
          includeContext: false,
        })
      ).rejects.toThrow('Authentication failed');
    });
    it('should handle 429 rate limit error', async () => {
      const error: Record<string, unknown> = {
        response: {
          status: 429,
          data: {
            error: {
              message: 'Rate limit exceeded',
            },
          },
        },
        isAxiosError: true,
      };

      mockedAxios.post.mockRejectedValue(error);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockImplementation((err: Record<string, unknown>) => err.isAxiosError === true);

      await expect(
        aiService.sendRequest({
          prompt: 'Test',
          includeContext: false,
        })
      ).rejects.toThrow(ExternalServiceError);
      await expect(
        aiService.sendRequest({
          prompt: 'Test',
          includeContext: false,
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should use custom temperature and maxTokens', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Response' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await aiService.sendRequest({
        prompt: 'Test',
        temperature: 0.9,
        maxTokens: 4000,
        includeContext: false,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.9,
            maxOutputTokens: 4000,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('generateText', () => {
    it('should generate text from prompt', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Generated text' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await aiService.generateText('Test prompt', 'user-123');

      expect(result).toBe('Generated text');
      expect(userContextService.getUserContext).toHaveBeenCalledWith('user-123');
    });
  });

  describe('processTask', () => {
    it('should process task with context', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Task processed' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await aiService.processTask('Do task', 'Task context');

      expect(result).toBe('Task processed');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [{ text: 'Task: Do task\nContext: Task context' }],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    it('should process task without context', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Task processed' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await aiService.processTask('Do task');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [{ text: 'Task: Do task' }],
            },
          ],
        }),
        expect.any(Object)
      );
    });
  });

  describe('analyzeText', () => {
    it('should analyze text with specified type', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Analysis result' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeText('Text to analyze', 'sentiment');

      expect(result).toBe('Analysis result');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [{ text: 'Analyze the following text for sentiment:\n\nText to analyze' }],
            },
          ],
        }),
        expect.any(Object)
      );
    });
  });
});
