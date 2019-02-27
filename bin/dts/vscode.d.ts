import { VSCodeTask, VSCodeDebugger } from "./vscode-schemas";
import { GulpTask, BuildCallback } from "./def";
/** Specifies the config for vs code. */
export interface VSCodeConfig {
    /** Specifies the project directory. */
    prj?: string;
}
/** Initializer for vs code projects. */
export declare class VSCode {
    private cfg;
    private build;
    private debuggers;
    private tasks;
    private settings;
    static launchJsonVersion: string;
    static tasksJsonVersion: string;
    /** Initializes a new instance. */
    constructor(cfg?: VSCodeConfig);
    /** Adds a debugger. */
    addDebugger(...dbg: (VSCodeDebugger | VSCodeDebugger[])[]): VSCode;
    /** Add a task. */
    addTask(...task: VSCodeTask[]): VSCode;
    /** Adds all gulp tasks. */
    addGulpTasks(...tasks: (string | GulpTask)[]): VSCode;
    /** Adds the specified java dependencies to settings.json. */
    addJavaClasspath(...dependencies: string[]): VSCode;
    /** Adds all java dependencies specified at the javaDependencies property in package.json  */
    addNpmJavaDepdencies(): VSCode;
    /** Resolves the specified java dependency. */
    resolveNpmJavaDependency(dependency: string): string[];
    /** Excludes the specified paths from vs code. */
    exclude(...paths: (string | string[])[]): VSCode;
    /** Excludes all paths from .gitignore from vs code.*/
    excludeGitIgnores(...except: string[]): VSCode;
    run(cb: BuildCallback): void;
}
/** Contains debuggers. */
export declare module VSCodeDebuggers {
    /** Gulp build debugger.
     * @param buildTask Specifies the build task. default=build
     */
    function Gulp(...tasks: string[]): VSCodeDebugger[];
    /** Node debugger.
     * @param name Name of the debugger
     * @param js Path to your node js file relative to your workspace root.
     * @param env Environment variables.
     * @param args Command line args.
     */
    function Node(name: string, js: string, args?: string[], env?: any): VSCodeDebugger;
    /** Node web application debugger.
     * @param bin Specifies the bin folder. default=${workspaceRoot}/bin
     * @param start Specifies the start js file relative to bin. default=www.js
     */
    function NodeWebApplication(bin?: string, start?: string): VSCodeDebugger;
}
