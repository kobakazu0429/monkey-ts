import { type Token } from "../token/token.js";
import { type Expression, nodeMemberAssert } from "./ast.js";

export class StringLiteral implements Expression {
  constructor(private token: Token, private _value?: string) {}

  get value(): string {
    nodeMemberAssert(!!this._value, "value");
    return this._value!;
  }

  set value(value: string) {
    this._value = value;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.token.literal;
  }
}
