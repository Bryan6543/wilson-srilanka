// Generates ADMIN_PASSWORD_HASH (and a random ADMIN_SESSION_SECRET) for your .env file.
//   npm run hash-password -- "your strong password"
// or run without an argument to be prompted (input is not echoed).
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/server/password.ts";

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void };
  const write = out._writeToOutput.bind(rl);
  out._writeToOutput = (s: string) => write(s.includes(question) ? s : "*");
  const answer = await new Promise<string>((resolve) => rl.question(question, resolve));
  rl.close();
  process.stdout.write("\n");
  return answer;
}

const password = process.argv[2] ?? (await prompt("Admin password: "));
if (password.length < 12) {
  console.error("Use at least 12 characters for the admin password.");
  process.exit(1);
}
console.log("\nAdd these lines to your environment (.env.local or hosting dashboard):\n");
console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
