import { BuildCallback } from "./def";
/** Specifies utitilies to clean a project. */
export declare class Clean {
    private paths;
    private vscSettings;
    /** Initializes a new instance. */
    constructor();
    /** Deletes the specified paths. */
    del(...paths: string[]): Clean;
    /** Deletes all files excluded from vs code but leaves the specified paths. */
    delVSCodeExcludes(...leave: string[]): Clean;
    /** Deletes all specified paths. */
    run(cb: BuildCallback): any;
}
