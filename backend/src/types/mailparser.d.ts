declare module 'mailparser' {
  interface ParsedMail {
    subject?: string;
    from?: {
      value: Array<{
        address?: string;
        name?: string;
      }>;
      text?: string;
    };
    to?: {
      value: Array<{
        address?: string;
        name?: string;
      }>;
      text?: string;
    };
    text?: string;
    html?: string | false;
    date?: Date;
    messageId?: string;
    headers?: Map<string, any>;
    attachments?: any[];
  }

  export function simpleParser(
    source: NodeJS.ReadableStream | Buffer | string,
    callback: (err: Error | null, parsed: ParsedMail) => void
  ): void;

  export function simpleParser(
    source: NodeJS.ReadableStream | Buffer | string,
    options?: any,
    callback?: (err: Error | null, parsed: ParsedMail) => void
  ): Promise<ParsedMail>;
}
