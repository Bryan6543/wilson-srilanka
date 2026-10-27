export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportConfiguration } = await import("./lib/server/env");
    reportConfiguration();
  }
}
