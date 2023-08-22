import { type Token } from "../token/token.js";
import { type BlockStatement } from "./BlockStatement.js";
import { type Expression, type TExpression, nodeMemberAssert } from "./ast.js";

export class IfExpression<E extends TExpression = TExpression>
  implements Expression
{
  constructor(
    private token: Token,
    private _condition?: E,
    private _consequence?: BlockStatement,
    private _alternative?: BlockStatement
  ) {}

  get alternative(): BlockStatement | undefined {
    return this._alternative;
  }

  set alternative(alternative: BlockStatement | undefined) {
    this._alternative = alternative;
  }

  get condition(): E {
    nodeMemberAssert(!!this._condition, "condition");
    return this._condition!;
  }

  set condition(condition: E) {
    this._condition = condition;
  }

  get consequence(): BlockStatement {
    nodeMemberAssert(!!this._consequence, "consequence");
    return this._consequence!;
  }

  set consequence(consequence: BlockStatement) {
    this._consequence = consequence;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    if (this.alternative === undefined) {
      return `if${this.condition.toString()} ${this.consequence.toString()}`;
    } else {
      return `if${this.condition.toString()} ${this.consequence.toString()} else ${this.alternative.toString()}`;
    }
  }
}
