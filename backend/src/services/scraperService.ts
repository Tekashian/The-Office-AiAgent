import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapingConfig } from '../types';
import aiService from './aiService';

export class ScraperService {

  /**
   * Scrape a web page with manual selectors
   */
  async scrapeWebPage(config: ScrapingConfig): Promise<any> {
    try {
      const response = await axios.get(config.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const result: Record<string, any> = {};

      if (config.selectors) {
        // Extract data based on provided selectors
        Object.entries(config.selectors).forEach(([key, selector]) => {
          const elements = $(selector);
          if (elements.length === 1) {
            result[key] = elements.text().trim();
          } else {
            result[key] = elements
              .map((_, el) => $(el).text().trim())
              .get();
          }
        });
      } else {
        // Return full HTML if no selectors provided
        result.html = $.html();
        result.text = $('body').text().trim();
      }

      return result;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  /**
   * Scrape with AI - natural language extraction
   */
  async scrapeWithAI(config: { url: string; prompt: string; selectors?: any }): Promise<any> {
    try {
      // First, get the HTML
      const response = await axios.get(config.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Extract text content (remove scripts, styles)
      $('script, style, noscript').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Limit content size for AI (first 8000 chars)
      const limitedContent = textContent.substring(0, 8000);

      // Use AI to extract data based on prompt
      const aiResponse = await aiService.sendRequest({
        prompt: `You are a web scraping assistant. Extract the following information from this webpage content:

USER REQUEST: ${config.prompt}

WEBPAGE CONTENT:
${limitedContent}

Return the extracted data as a JSON object. Be precise and extract only the requested information.`,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      // Try to parse AI response as JSON
      try {
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        // If parsing fails, return as text
        return { extracted_text: aiResponse.content };
      }

      return { extracted_text: aiResponse.content };

    } catch (error) {
      console.error('AI scraping error:', error);
      throw error;
    }
  }

  /**
   * Analyze page structure with AI to suggest selectors
   */
  async analyzePageStructure(url: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles
      $('script, style, noscript').remove();

      // Analyze page structure
      const analysis: any = {
        title: $('title').text().trim(),
        headings: {
          h1: $('h1').map((_, el) => $(el).text().trim()).get().slice(0, 5),
          h2: $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 5),
        },
        links: $('a[href]').length,
        images: $('img[src]').length,
        forms: $('form').length,
        tables: $('table').length,
      };

      // Find potential data containers
      const dataContainers = [
        { selector: '.product', count: $('.product').length, type: 'product' },
        { selector: '.item', count: $('.item').length, type: 'item' },
        { selector: '.card', count: $('.card').length, type: 'card' },
        { selector: '.post', count: $('.post').length, type: 'post' },
        { selector: 'article', count: $('article').length, type: 'article' },
        { selector: '.price', count: $('.price').length, type: 'price' },
        { selector: '[class*="price"]', count: $('[class*="price"]').length, type: 'price (partial)' },
      ].filter(container => container.count > 0);

      analysis.suggestedContainers = dataContainers;

      // Extract sample content
      if (dataContainers.length > 0 && dataContainers[0].count > 0) {
        const topContainer = dataContainers[0];
        const sampleElements = $(topContainer.selector).slice(0, 3);
        analysis.sampleContent = sampleElements.map((_, el) => {
          return {
            text: $(el).text().trim().substring(0, 200),
            html: $(el).html()?.substring(0, 300)
          };
        }).get();
      }

      // Use AI to suggest extraction strategy
      try {
        const aiSuggestions = await aiService.sendRequest({
          prompt: `Analyze this webpage structure and suggest the best way to extract data:

Page Title: ${analysis.title}
URL: ${url}
Headings: ${JSON.stringify(analysis.headings)}
Found ${analysis.suggestedContainers.length} potential data containers: ${analysis.suggestedContainers.map((c: any) => `${c.type} (${c.count})`).join(', ')}

Based on this structure, suggest:
1. What type of data this page contains (e.g., product listings, news articles, job postings)
2. Recommended CSS selectors for key data fields
3. Best extraction strategy (manual selectors vs AI)

Respond in JSON format.`,
          temperature: 0.3,
          maxTokens: 1500
        });

        const jsonMatch = aiSuggestions.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis.aiSuggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        analysis.aiSuggestions = null;
      }

      return analysis;

    } catch (error) {
      console.error('Page analysis error:', error);
      throw error;
    }
  }

  /**
   * Scrape multiple pages
   */
  async scrapeMultiplePages(configs: ScrapingConfig[]): Promise<any[]> {
    const results = await Promise.all(
      configs.map((config) => this.scrapeWebPage(config))
    );
    return results;
  }

  /**
   * Extract specific data from HTML
   */
  extractData(html: string, selector: string): string[] {
    const $ = cheerio.load(html);
    return $(selector)
      .map((_, el) => $(el).text().trim())
      .get();
  }
}

export default new ScraperService();
