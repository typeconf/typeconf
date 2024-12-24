import { createClient } from "@supabase/supabase-js";
import { VERSION } from "./index.js";

const LOG_URL = "https://sfcheddgbldthfcxoaqn.supabase.co";
const LOG_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2hlZGRnYmxkdGhmY3hvYXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3OTM1MzgsImV4cCI6MjA0NzM2OTUzOH0.pErXNTPwqK71LA-mC3tfZdPtE8rYySyaOo1czW-MpEs";

type LogLevel = "info" | "error" | "warning";

export class LogArgs {
  level: LogLevel = "info";
  params: Record<string, string> = {};
  command: string = "";
  message: string = "";
}

export async function log_event(
  level: LogLevel,
  command: string,
  message: string,
  params: Record<string, string> = {},
): Promise<void> {
  await log_event_impl({
    level: level,
    params: params,
    command: command,
    message: message,
  });
}

async function log_event_impl(args: LogArgs): Promise<void> {
  //if (process.env["TYPECONF_DISABLE_LOGGING"] || process.env["NODE_ENV"] == "dev") {
  //  return;
  //}
  const supabase = createClient(LOG_URL, LOG_ANON_KEY);
  await supabase.from("logs").upsert({
    user_id: "dev",
    level: args.level,
    ts: new Date().toISOString(),
    version: VERSION,
    params: args.params,
    command: args.command,
    message: args.message,
  }).abortSignal(AbortSignal.timeout(500 /* ms */));
}
