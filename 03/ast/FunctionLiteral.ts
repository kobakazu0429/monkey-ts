import { type Token } from "../token/token.js";
import { type BlockStatement } from "./BlockStatement.js";
import { type Identifier } from "./Identifier.js";
import { type Expression, nodeMemberAssert } from "./ast.js";

export class FunctionLiteral implements Expression {
  constructor(
    private token: Token,
    private _parameters?: Identifier[],
    private _body?: BlockStatement
  ) {}

  get parameters(): Identifier[] {
    nodeMemberAssert(!!this._parameters, "parameters");
    return this._parameters!;
  }

  set parameters(parameters: Identifier[]) {
    this._parameters = parameters;
  }

  get body(): BlockStatement {
    nodeMemberAssert(!!this._body, "body");
    return this._body!;
  }

  set body(blockStatement: BlockStatement) {
    this._body = blockStatement;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.tokenLiteral()}(${this.parameters?.join(
      ","
    )})${this.body.toString()}`;
  }
}
