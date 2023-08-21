import { type Token } from "../token/token.js";
import { type Expression, type TExpression, nodeMemberAssert } from "./ast.js";

export class CallExpression implements Expression {
  constructor(
    private token: Token,
    private _function: TExpression,
    private _arguments: TExpression[]
  ) {}

  get function(): TExpression {
    nodeMemberAssert(!!this._function, "fn");
    return this._function!;
  }

  get arguments(): TExpression[] {
    return this._arguments;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.function.toString()}(${this.arguments.join(", ")})`;
  }
}
