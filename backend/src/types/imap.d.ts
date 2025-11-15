declare module 'imap' {
  interface ImapConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    tlsOptions?: {
      rejectUnauthorized: boolean;
    };
  }

  interface Box {
    name: string;
    readOnly: boolean;
    uidvalidity: number;
    uidnext: number;
    permFlags: string[];
    messages: {
      total: number;
      new: number;
      unseen: number;
    };
  }

  interface ImapMessage {
    on(event: 'body', handler: (stream: NodeJS.ReadableStream, info: any) => void): void;
    on(event: 'attributes', handler: (attrs: any) => void): void;
    once(event: string, handler: (info: any) => void): void;
  }

  interface ImapFetch {
    on(event: 'message', handler: (msg: ImapMessage, seqno: number) => void): void;
    once(event: 'error', handler: (err: Error) => void): void;
    once(event: 'end', handler: () => void): void;
  }

  class Connection {
    constructor(config: ImapConfig);
    connect(): void;
    end(): void;
    openBox(mailboxName: string, readOnly: boolean, callback: (err: Error | null, box?: Box) => void): void;
    search(criteria: any[], callback: (err: Error | null, results: number[]) => void): void;
    fetch(source: any, options: any): ImapFetch;
    once(event: 'ready', handler: () => void): void;
    once(event: 'error', handler: (err: Error) => void): void;
    once(event: 'end', handler: () => void): void;
  }

  export default Connection;
}
