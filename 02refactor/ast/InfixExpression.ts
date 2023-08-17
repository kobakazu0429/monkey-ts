import { type Token } from "../token/token.js";
import { type TExpression, type Expression, nodeMemberAssert } from "./ast.js";

export class InfixExpression<
  E1 extends TExpression = TExpression,
  E2 extends TExpression = TExpression
> implements Expression
{
  constructor(
    private token: Token,
    private _left?: E1,
    private _operator?: string,
    private _right?: E2
  ) {}

  get left(): E1 {
    nodeMemberAssert(!!this._left, "left");
    return this._left!;
  }

  set left(left: E1) {
    this._left = left;
  }

  get right(): E2 {
    nodeMemberAssert(!!this._right, "right");
    return this._right!;
  }

  set right(right: E2) {
    this._right = right;
  }

  get operator(): string {
    nodeMemberAssert(!!this._operator, "operator");
    return this._operator!;
  }

  set operator(operator: string) {
    this._operator = operator;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `(${this.left.toString()} ${
      this.operator
    } ${this.right.toString()})`;
  }
}
