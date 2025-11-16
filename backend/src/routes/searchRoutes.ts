import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface SearchResult {
  type: 'task' | 'email' | 'document' | 'scraper';
  id: string;
  title: string;
  description?: string;
  date?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

// POST /api/search - Global search across all resources
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query, types, limit = 20 } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!query || query.trim().length === 0) {
      res.json({ results: [] });
      return;
    }

    const searchQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Determine which types to search (default: all)
    const searchTypes = types || ['task', 'email', 'document', 'scraper'];

    // Search Tasks (cron_jobs)
    if (searchTypes.includes('task')) {
      const { data: tasks } = await supabaseAdmin
        .from('cron_jobs')
        .select('id, name, description, schedule, status, created_at, last_run')
        .eq('user_id', userId)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      if (tasks) {
        tasks.forEach((task) => {
          // Calculate relevance (name match = higher relevance)
          const nameMatch = task.name.toLowerCase().includes(searchQuery);
          const descMatch = task.description?.toLowerCase().includes(searchQuery);
          
          results.push({
            type: 'task',
            id: task.id,
            title: task.name,
            description: task.description || undefined,
            date: task.last_run || task.created_at,
            relevance: nameMatch ? 10 : (descMatch ? 5 : 1),
            metadata: {
              schedule: task.schedule,
              status: task.status,
            },
          });
        });
      }
    }

    // Search Emails
    if (searchTypes.includes('email')) {
      const { data: emails } = await supabaseAdmin
        .from('emails_sent')
        .select('id, recipient, subject, body, status, sent_at, created_at')
        .eq('user_id', userId)
        .or(`recipient.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%`)
        .limit(limit);

      if (emails) {
        emails.forEach((email) => {
          const subjectMatch = email.subject.toLowerCase().includes(searchQuery);
          const recipientMatch = email.recipient.toLowerCase().includes(searchQuery);
          const bodyMatch = email.body?.toLowerCase().includes(searchQuery);

          results.push({
            type: 'email',
            id: email.id,
            title: email.subject,
            description: email.recipient,
            date: email.sent_at || email.created_at,
            relevance: subjectMatch ? 10 : (recipientMatch ? 8 : (bodyMatch ? 3 : 1)),
            metadata: {
              recipient: email.recipient,
              status: email.status,
            },
          });
        });
      }
    }

    // Search Documents (PDFs)
    if (searchTypes.includes('document')) {
      const { data: documents } = await supabaseAdmin
        .from('pdf_files')
        .select('id, title, filename, file_path, file_size, created_at')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchQuery}%,filename.ilike.%${searchQuery}%`)
        .limit(limit);

      if (documents) {
        documents.forEach((doc) => {
          const titleMatch = doc.title?.toLowerCase().includes(searchQuery);
          const filenameMatch = doc.filename.toLowerCase().includes(searchQuery);

          results.push({
            type: 'document',
            id: doc.id,
            title: doc.title || doc.filename,
            description: doc.filename,
            date: doc.created_at,
            relevance: titleMatch ? 10 : (filenameMatch ? 8 : 1),
            metadata: {
              filename: doc.filename,
              filePath: doc.file_path,
              fileSize: doc.file_size,
            },
          });
        });
      }
    }

    // Search Scrapers
    if (searchTypes.includes('scraper')) {
      const { data: scrapers } = await supabaseAdmin
        .from('scrape_jobs')
        .select('id, name, url, description, status, extraction_type, created_at, last_run')
        .eq('user_id', userId)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
        .limit(limit);

      if (scrapers) {
        scrapers.forEach((scraper) => {
          const nameMatch = scraper.name.toLowerCase().includes(searchQuery);
          const urlMatch = scraper.url.toLowerCase().includes(searchQuery);
          const descMatch = scraper.description?.toLowerCase().includes(searchQuery);

          results.push({
            type: 'scraper',
            id: scraper.id,
            title: scraper.name,
            description: scraper.url,
            date: scraper.last_run || scraper.created_at,
            relevance: nameMatch ? 10 : (urlMatch ? 7 : (descMatch ? 5 : 1)),
            metadata: {
              url: scraper.url,
              extraction_type: scraper.extraction_type,
              status: scraper.status,
            },
          });
        });
      }
    }

    // Sort by relevance (highest first), then by date (newest first)
    results.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    res.json({
      query: searchQuery,
      total: limitedResults.length,
      results: limitedResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
