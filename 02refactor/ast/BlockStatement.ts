import { type Token } from "../token/token.js";
import { type Statement, type TStatement, nodeMemberAssert } from "./ast.js";

export class BlockStatement implements Statement {
  constructor(private token: Token, private _statements: TStatement[] = []) {}

  get statements(): TStatement[] {
    nodeMemberAssert(!!this._statements, "statements");
    return this._statements!;
  }

  set statements(statements: TStatement[]) {
    this._statements = statements;
  }

  statementNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.statements.join(",");
  }
}
