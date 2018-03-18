/** Specifies a vs code debugger. */
export interface VSCodeDebugger
{
  /** the type of debugger to use for this launch configuration. Every installed debug extension introduces a type, for example, node for the built-in node debugger, or php and go for the PHP and Go extensions. */
  type?: string;
  /** the request type of this launch configuration. Currently supported are launch and attach. */
  request?: string;
  /** friendly name which appears in the Debug launch configuration dropdown. */
  name?: string;
  /** to launch a task before the start of a debug session, set this attribute to the name of a task specified in tasks.json (located under the workspace's .vscode folder). */
  preLaunchTask?: string;
  /** control visibility of the Debug Console panel during a debugging session. */
  internalConsoleOptions?: any;
  /** for debug extension authors only: connect to the specified port instead of launching the debug adapter */
  debugServer?: any;
  /** executable or file to run when launching the debugger */
  program?: string;
  /** arguments passed to the program to debug */
  args?: string[];
  /** environment variables */
  env?: { [key: string]: string };
  /** current working directory for finding dependencies and other files */
  cwd?: string;
  /** debug protocol to use. */
  protocol?: string;
  /** TCP/IP address of the debug port */
  address?: string;
  /** port when attaching to a running process, default is 5858 */
  port?: number;
  /** restart session on termination. */
  restart?: boolean;
  /** break immediately when the program launches */
  stopOnEntry?: boolean;
  /** what kind of console to use, for example, internalConsole, integratedTerminal, externalTerminal. */
  console?: string;
  /** use javascript sourcemaps if they exist */
  sourceMaps?: boolean;
  /** when restarting a session, give up after this number of milliseconds. */
  timeout?: number;
  /** VS Code's root directory */
  localRoot?: string;
  /** Node's root directory. */
  remoteRoot?: string;
  /** array of glob patterns to look for in JavaScript files. */
  outFiles?: string[];
  /** try to automatically step over code that doesn't map to source files. */
  smartSteps?: any;
  /** automatically skip files covered by these glob patterns. */
  skipFiles?: string[];
  /** enable diagnostic output. */
  trace?: boolean;
  /** absolute path to the runtime executable to be used. Default is node */
  runtimeExecutable?: string;
  /** optional arguments passed to the runtime executable. */
  runtimeArgs?: string[];
  /** optional path to a file containing environment variable definitions. */
  envFile?: string;
  /** the debugger tries to attach to this process after having sent a USR1 signal.  */
  processId?: number;
  /** others keys may not be specified */
  [other: string]: any;
}

/**
 * The description of a task.
 */
export interface VSCodeTask 
{  
  /** The task's name*/
  label: string;
  /** The type of a custom task. Tasks of type "shell" are executed inside a shell (e.g. bash, cmd, powershell, ...)*/
  type: "shell" | "process";
  /** The command to execute. If the type is "shell" it should be the full command line including any additional arguments passed to the command.*/
  command: string;
  /** Whether the executed command is kept alive and runs in the background. */
  isBackground?: boolean;
  /** Additional arguments passed to the command. Should be used if type is "process". */
  args?: string[];
  /** Defines the group to which this tasks belongs */
  group?: "build" | "test" | "none";
  /** The presentation options. */
  presentation?: VSCodeTaskPresentation;
  /** The problem matcher(s) to use to capture problems in the tasks output. */
  problemMatcher?: string | any;
}

/** Specifies the presentation of a vs code task. */
export interface VSCodeTaskPresentation 
{
  /** Controls whether the task output is reveal in the user interface. Defaults to `always`. */
  reveal?: "never" | "silent" | "always";
  /** Controls whether the command associated with the task is echoed in the user interface. */
  echo?: boolean;
  /** Controls whether the panel showing the task output is taking focus. */
  focus?: boolean;
  /** Controls if the task panel is used for this task only (dedicated), shared between tasks (shared) or if a new panel is created on every task execution (new). Defaults to `shared` */
  panel?: "shared" | "dedicated" | "new";
}