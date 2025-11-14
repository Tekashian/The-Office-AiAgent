import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapingConfig } from '../types';

export class ScraperService {
  /**
   * Scrape a web page
   */
  async scrapeWebPage(config: ScrapingConfig): Promise<any> {
    try {
      const response = await axios.get(config.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const result: Record<string, any> = {};

      if (config.selectors) {
        // Extract data based on provided selectors
        Object.entries(config.selectors).forEach(([key, selector]) => {
          const elements = $(selector);
          result[key] = elements
            .map((_, el) => $(el).text().trim())
            .get();
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
