import { type Token } from "../token/token.js";
import { type Expression, nodeMemberAssert } from "./ast.js";

export class Boolean2 implements Expression {
  constructor(private token: Token, private _value?: boolean) {}

  get value(): boolean {
    nodeMemberAssert(typeof this._value === "boolean", "value");
    return this._value!;
  }

  set value(value: boolean) {
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
