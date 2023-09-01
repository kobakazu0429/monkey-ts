import { type Token } from "../token/token.js";
import { type Expression } from "./ast.js";

export class Identifier implements Expression {
  constructor(public token: Token, public value: string) {}

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.value;
  }
}
