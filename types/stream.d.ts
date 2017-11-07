/// <reference types="node" />
/// <reference types="vinyl-fs" />
import { WebBuildConfig } from "./def";
/** Extended gulp stream. */
export declare class GulpStream {
    cfg: WebBuildConfig;
    stream: NodeJS.ReadWriteStream;
    constructor(cfg: WebBuildConfig, stream: NodeJS.ReadWriteStream);
    /** Return the source stream for the specified path. */
    static src(cfg: WebBuildConfig, path: string | string[]): GulpStream;
    /** Pipes the current stream to the specified desination stream. */
    pipe<T extends NodeJS.WritableStream>(desination: T): GulpStream;
    /** Sets the destination for the current stream. */
    dest(path: string | string[]): NodeJS.ReadWriteStream;
}
