import { type BlockStatement } from "./BlockStatement.js";
import { type Boolean2 } from "./Boolean2.js";
import { type CallExpression } from "./CallExpression.js";
import { type ExpressionStatement } from "./ExpressionStatement.js";
import { type FunctionLiteral } from "./FunctionLiteral.js";
import { type Identifier } from "./Identifier.js";
import { type IfExpression } from "./IfExpression.js";
import { type InfixExpression } from "./InfixExpression.js";
import { type IntegerLiteral } from "./IntegerLiteral.js";
import { type LetStatement } from "./LetStatement.js";
import { type PrefixExpression } from "./PrefixExpression.js";
import { type Program } from "./Program.js";
import { type ReturnStatement } from "./ReturnStatement.js";

const assert = (expression: boolean, message?: string): never | void => {
  if (!expression) {
    throw new Error(message ?? "assertion error");
  }
};

export const nodeMemberAssert = (
  value: boolean,
  name: string
): never | void => {
  assert(value, `${name} is undefined.`);
};

export interface Node {
  tokenLiteral: () => string;
  toString: () => string;
}

export interface Statement extends Node {
  statementNode: () => void;
}

export interface Expression extends Node {
  expressionNode: () => void;
}

export type TExpression =
  | Identifier
  | IntegerLiteral
  | FunctionLiteral
  | Boolean2
  | CallExpression
  | IfExpression
  | PrefixExpression
  | InfixExpression;

export type TStatement =
  | Program
  | LetStatement
  | ReturnStatement
  | BlockStatement
  | ExpressionStatement;

export type TNode = TStatement | TExpression;

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe("ast", () => {
    describe("Program", () => {
      test("toString", async () => {
        const { Token, token } = await import("../token/token.js");
        const { Program } = await import("./Program.js");
        const { LetStatement } = await import("./LetStatement.js");
        const { Identifier } = await import("./Identifier.js");

        const program = new Program([
          new LetStatement(
            new Token(token.LET, "let"),
            new Identifier(new Token(token.IDENT, "myVar"), "myVar"),
            new Identifier(new Token(token.IDENT, "anotherVar"), "anotherVar")
          ),
        ]);
        expect(program.toString()).toBe("let myVar = anotherVar;");
      });
    });
  });
}
