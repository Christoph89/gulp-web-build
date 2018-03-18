/// <reference types="node" />
/// <reference types="vinyl-fs" />
import { BuildConfig } from "./def";
/** Extended gulp stream. */
export declare class GulpStream {
    cfg: BuildConfig;
    stream: NodeJS.ReadWriteStream;
    constructor(cfg: BuildConfig, stream: NodeJS.ReadWriteStream);
    /** Return the source stream for the specified path. */
    static src(cfg: BuildConfig, path: string | string[]): GulpStream;
    /** Return the source stream for the specified content. */
    static contentSrc(cfg: BuildConfig, content: any): GulpStream;
    /** Pipes the current stream to the specified desination stream. */
    pipe<T extends NodeJS.WritableStream>(desination: T): GulpStream;
    /** Sets the destination for the current stream. */
    dest(path: string | string[]): NodeJS.ReadWriteStream;
}
