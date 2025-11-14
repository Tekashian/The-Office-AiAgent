import PDFDocument from 'pdfkit';
import fs from 'fs';
import { PDFGenerationOptions } from '../types';

export class PDFService {
  /**
   * Generate a PDF document
   */
  async generatePDF(
    content: string,
    outputPath: string,
    options?: PDFGenerationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          info: {
            Title: options?.title || 'Generated Document',
            Author: options?.author || 'Office Agent',
            Subject: options?.subject || '',
          },
        });

        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Add content
        doc
          .fontSize(12)
          .text(content, {
            align: 'left',
          });

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF from structured data
   */
  async generateStructuredPDF(
    data: any,
    outputPath: string,
    _template?: string
  ): Promise<string> {
    // Implementation for structured PDF generation
    // This can be extended based on specific needs
    return this.generatePDF(JSON.stringify(data, null, 2), outputPath);
  }
}

export default new PDFService();
