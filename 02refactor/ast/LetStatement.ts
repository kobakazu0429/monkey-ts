import { type Token } from "../token/token.js";
import { type Identifier } from "./Identifier.js";
import { type Statement, type TExpression, nodeMemberAssert } from "./ast.js";

export class LetStatement implements Statement {
  constructor(
    public token: Token,
    private _name?: Identifier,
    private _value?: TExpression
  ) {}

  get name(): Identifier {
    nodeMemberAssert(!!this._name, "name");
    return this._name!;
  }

  set name(name: Identifier) {
    this._name = name;
  }

  get value(): TExpression {
    nodeMemberAssert(!!this._value, "value");
    return this._value!;
  }

  set value(value: TExpression) {
    this._value = value;
  }

  statementNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.tokenLiteral()} ${this.name} = ${this.value};`;
  }
}
