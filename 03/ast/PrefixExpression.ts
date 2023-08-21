import { type Token } from "../token/token.js";
import { type TExpression, type Expression, nodeMemberAssert } from "./ast.js";

export class PrefixExpression<E extends TExpression = TExpression>
  implements Expression
{
  constructor(
    private token: Token,
    private _operator: string,
    private _right?: E
  ) {}

  get right(): E {
    nodeMemberAssert(!!this._right, "right");
    return this._right!;
  }

  set right(right: E) {
    this._right = right;
  }

  get operator(): string {
    return this._operator;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `(${this.operator}${this.right.toString()})`;
  }
}
