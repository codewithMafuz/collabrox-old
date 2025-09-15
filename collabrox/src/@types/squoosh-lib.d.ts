declare module '@squoosh/lib' {
    export class ImagePool {
        constructor(concurrency?: number);
        ingestImage(buffer: ArrayBuffer): Promise<Image>;
        close(): Promise<void>;
    }

    export interface Image {
        decode(): Promise<void>;
        encode(options: Record<string, any>): Promise<void>;
        close(): void;
        encodedWith: Record<string, { binary: Uint8Array; size: number }>;
    }
}
