import { type Token } from "../token/token.js";
import { type TExpression, type Statement, nodeMemberAssert } from "./ast.js";

export class ExpressionStatement<E extends TExpression = TExpression>
  implements Statement
{
  constructor(public token: Token, private _expression?: E) {}

  get expression(): E {
    nodeMemberAssert(!!this._expression, "expression");
    return this._expression!;
  }

  set expression(expression: E) {
    this._expression = expression;
  }

  statementNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.expression.toString();
  }
}
