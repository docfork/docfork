import { track } from "./transport.js";

export interface InstallProps {
  os: string;
  arch: string;
  node_version: string;
  dgrep_version: string;
  install_id: string;
  ci: boolean;
}

export interface CommandExecutedProps {
  command: string;
  success: boolean;
  exit_code: number;
  latency_ms: number;
  flag_count: number;
  json_mode: boolean;
  authenticated: boolean;
  dgrep_version: string;
  node_version: string;
  os: string;
}

export interface ErrorProps {
  command: string;
  error_class: string;
  exit_code: number;
  dgrep_version: string;
  node_version: string;
  os: string;
}

export function captureInstall(distinctId: string, props: InstallProps): Promise<void> {
  return track("dgrep_install", distinctId, props as unknown as Record<string, unknown>);
}

export function captureCommandExecuted(
  distinctId: string,
  props: CommandExecutedProps
): Promise<void> {
  return track("dgrep_command_executed", distinctId, props as unknown as Record<string, unknown>);
}

export function captureError(distinctId: string, props: ErrorProps): Promise<void> {
  return track("dgrep_error", distinctId, props as unknown as Record<string, unknown>);
}
