import { type Token } from "../token/token.js";
import { type TExpression, type Statement, nodeMemberAssert } from "./ast.js";

export class ReturnStatement<E extends TExpression = TExpression>
  implements Statement
{
  constructor(public token: Token, private _returnValue?: E) {}

  get returnValue(): E {
    nodeMemberAssert(!!this._returnValue, "returnValue");
    return this._returnValue!;
  }

  set returnValue(returnValue: E) {
    this._returnValue = returnValue;
  }

  statementNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.tokenLiteral()} ${this.returnValue.toString()};`;
  }
}
