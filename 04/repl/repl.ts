import readline from "node:readline";
import { Lexer } from "../lexer/lexer.js";
import { type Token, token } from "../token/token.js";

const PROMPT = ">> ";

export const start = (): void => {
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  const lines: string[] = [];
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  reader.on("line", (line) => {
    lines.push(line);
  });
  reader.on("close", () => {
    if (lines.length === 0 || lines.every((v) => v === "")) return;
    const lexer = new Lexer(lines.join("\n"));

    let t: Token;
    while ((t = lexer.nextToken()) && t.type !== token.EOF) {
      console.log(t);
    }
  });

  console.log(PROMPT);
};

if (new URL(import.meta.url).pathname === process.argv[1]) {
  start();
}
