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
        console.log('📄 Creating PDF document...');
        console.log('📝 Content length:', content.length);
        console.log('📁 Output path:', outputPath);

        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          },
          info: {
            Title: options?.title || 'Generated Document',
            Author: options?.author || 'Office Agent',
            Subject: options?.subject || '',
          },
        });

        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Add title if provided
        if (options?.title) {
          doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(options.title, {
              align: 'center',
            })
            .moveDown(2);
        }

        // Add content with proper formatting
        const lines = content.split('\n');
        doc.fontSize(12).font('Helvetica');

        for (const line of lines) {
          if (line.trim()) {
            doc.text(line, {
              align: 'left',
              width: 495, // A4 width minus margins
            });
          } else {
            doc.moveDown(0.5);
          }
        }

        doc.end();

        stream.on('finish', () => {
          console.log('✅ PDF stream finished');
          resolve(outputPath);
        });

        stream.on('error', (err) => {
          console.error('❌ PDF stream error:', err);
          reject(err);
        });
      } catch (error) {
        console.error('❌ PDF generation error:', error);
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
