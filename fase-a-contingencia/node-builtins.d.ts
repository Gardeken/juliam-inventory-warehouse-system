declare module 'node:fs' {
  export function readFileSync(path: string, encoding: BufferEncoding): string;
  export function writeFileSync(path: string, data: string, encoding?: BufferEncoding): void;
  export function mkdirSync(
    path: string,
    options?: { recursive?: boolean },
  ): string | undefined;
}

declare module 'node:path' {
  export function basename(path: string, suffix?: string): string;
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

type BufferEncoding = 'utf-8' | 'utf8' | 'ascii' | 'base64' | 'hex';

