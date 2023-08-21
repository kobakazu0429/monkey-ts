import { match, P } from "ts-pattern";
import { type TExpression, type TStatement } from "../ast/ast.js";
import { BlockStatement } from "../ast/BlockStatement.js";
import { Boolean2 } from "../ast/Boolean2.js";
import { CallExpression } from "../ast/CallExpression.js";
import { ExpressionStatement } from "../ast/ExpressionStatement.js";
import { FunctionLiteral } from "../ast/FunctionLiteral.js";
import { Identifier } from "../ast/Identifier.js";
import { IfExpression } from "../ast/IfExpression.js";
import { InfixExpression } from "../ast/InfixExpression.js";
import { IntegerLiteral } from "../ast/IntegerLiteral.js";
import { LetStatement } from "../ast/LetStatement.js";
import { PrefixExpression } from "../ast/PrefixExpression.js";
import { Program } from "../ast/Program.js";
import { ReturnStatement } from "../ast/ReturnStatement.js";
import { Lexer } from "../lexer/lexer.js";
import { token, type Token, type TokenType } from "../token/token.js";
import {
  precedences,
  precedenceTable,
  PrecedenceTableKeyType,
} from "./precedences.js";

type PrefixParseFn = () => TExpression | undefined;
type PrefixParseFns = {
  [key in TokenType]: PrefixParseFn;
};

type InfixParseFn = (expression: TExpression) => TExpression | undefined;
type InfixParseFns = {
  [key in TokenType]: InfixParseFn;
};

// from: https://zenn.dev/okunokentaro/articles/01gmpkp9gzehseeafrhs6qn788#assertexists()
export function exists<T>(v: T | null | undefined): v is NonNullable<T> {
  return typeof v !== "undefined" && v !== null;
}

export function assertExists<T>(
  v: T | null | undefined,
  target = ""
): asserts v is NonNullable<T> {
  if (!exists(v)) {
    throw new Error(`${target} should be specified`.trim());
  }
}

type Class<T = unknown> = { new (...args: any[]): T };
export function assertInstanceof<T extends Class>(
  v: unknown,
  instance: T,
  target = ""
): asserts v is InstanceType<T> {
  if (!(v instanceof instance)) {
    throw new Error(`${target} should be instanceof ${instance.name}`.trim());
  }
}

export class Parser {
  private curToken!: Token;
  private peekToken!: Token;

  private prefixParseFns: PrefixParseFns = {} as PrefixParseFns;
  private infixParseFns: InfixParseFns = {} as InfixParseFns;

  public errors: string[] = [];

  constructor(private lexer: Lexer) {
    this.nextToken();
    this.nextToken();

    this.registerPrefix(token.IDENT, () => this.parseIdentifier());
    this.registerPrefix(token.INT, () => this.parseIntegerLiteral());
    this.registerPrefix(token.BANG, () => this.parsePrefixExpression());
    this.registerPrefix(token.MINUS, () => this.parsePrefixExpression());
    this.registerPrefix(token.TRUE, () => this.parseBoolean());
    this.registerPrefix(token.FALSE, () => this.parseBoolean());
    this.registerPrefix(token.LPAREN, () => this.parseGroupedExpression());
    this.registerPrefix(token.IF, () => this.parseIfExpression());
    this.registerPrefix(token.FUNCTION, () => this.parseFunctionLiteral());

    this.registerInfix(token.PLUS, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.MINUS, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.SLASH, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.ASTERISK, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.EQ, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.NOT_EQ, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.LT, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.GT, (left: TExpression) =>
      this.parseInfixExpression(left)
    );
    this.registerInfix(token.LPAREN, (left: TExpression) =>
      this.parseCallExpression(left)
    );
  }

  nextToken(): void {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram(): Program {
    const program = new Program([]);

    while (this.curToken.type !== token.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }

    return program;
  }

  parseStatement(): TStatement | undefined {
    return match(this.curToken.type)
      .with(token.LET, () => this.parseLetStatement())
      .with(token.RETURN, () => this.parseReturnStatement())
      .otherwise(() => this.parseExpressionStatement());
  }

  parseIdentifier(): TExpression {
    return new Identifier(this.curToken, this.curToken.literal);
  }

  parseLetStatement(): LetStatement | undefined {
    const stmt = new LetStatement(this.curToken);

    if (!this.expectPeek(token.IDENT)) {
      return undefined;
    }

    stmt.name = new Identifier(this.curToken, this.curToken.literal);

    if (!this.expectPeek(token.ASSIGN)) {
      return undefined;
    }

    this.nextToken();

    const parsedExpression = this.parseExpression(precedences.LOWEST);
    assertExists(parsedExpression, "parsedExpression");
    stmt.value = parsedExpression;

    while (!this.curTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseReturnStatement(): ReturnStatement {
    const stmt = new ReturnStatement(this.curToken);

    this.nextToken();

    const parsed = this.parseExpression(precedences.LOWEST);
    assertExists(parsed, "parsed");
    stmt.returnValue = parsed;

    while (!this.curTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseExpressionStatement(): ExpressionStatement {
    const stmt = new ExpressionStatement(
      this.curToken,
      this.parseExpression(precedences.LOWEST)
    );

    if (this.peekTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseExpression(precedence: number): TExpression | undefined {
    const prefix = this.prefixParseFns[this.curToken.type];
    if (prefix == undefined) {
      this.noPrefixParseFnError(this.curToken.type);
      return undefined;
    }

    let leftExp = prefix();
    while (
      !this.peekTokenIs(token.SEMICOLON) &&
      precedence < this.peekPrecedence()
    ) {
      const infix = this.infixParseFns[this.peekToken.type];
      if (infix == undefined) {
        return leftExp;
      }

      this.nextToken();
      assertExists(leftExp, "leftExp");
      leftExp = infix(leftExp);
    }

    return leftExp;
  }

  parseIntegerLiteral(): TExpression {
    const lit = new IntegerLiteral(this.curToken);
    try {
      const num = parseInt(this.curToken.literal, 10);
      lit.value = num;
    } catch (e) {
      const msg = `could not parse ${this.curToken.literal} as integer`;
      this.errors.push(msg);
    }
    return lit;
  }

  parseBoolean(): TExpression {
    return new Boolean2(this.curToken, this.curTokenIs(token.TRUE));
  }

  parseGroupedExpression(): TExpression | undefined {
    this.nextToken();

    const exp = this.parseExpression(precedences.LOWEST);
    if (!this.expectPeek(token.RPAREN)) {
      return undefined;
    }
    return exp;
  }

  parseIfExpression(): TExpression | undefined {
    const expression = new IfExpression(this.curToken);

    if (!this.expectPeek(token.LPAREN)) {
      return undefined;
    }

    this.nextToken();

    const parsedConditionExpression = this.parseExpression(precedences.LOWEST)!;
    assertExists(parsedConditionExpression, "parsedConditionExpression");
    assertInstanceof(
      parsedConditionExpression,
      InfixExpression,
      "parsedConditionExpression"
    );
    expression.condition = parsedConditionExpression;

    if (!this.expectPeek(token.RPAREN)) {
      return undefined;
    }

    if (!this.expectPeek(token.LBRACE)) {
      return undefined;
    }

    expression.consequence = this.parseBlockStatement();

    if (this.peekTokenIs(token.ELSE)) {
      this.nextToken();

      if (!this.expectPeek(token.LBRACE)) {
        return undefined;
      }

      expression.alternative = this.parseBlockStatement();
    }

    return expression;
  }

  parseFunctionLiteral(): TExpression | undefined {
    const lit = new FunctionLiteral(this.curToken);

    if (!this.expectPeek(token.LPAREN)) {
      return undefined;
    }

    lit.parameters = this.parseFunctionParameters();

    if (!this.expectPeek(token.LBRACE)) {
      return undefined;
    }

    lit.body = this.parseBlockStatement();

    return lit;
  }

  parseFunctionParameters(): Identifier[] {
    const identifiers: Identifier[] = [];

    if (this.peekTokenIs(token.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();

    const ident = new Identifier(this.curToken, this.curToken.literal);
    identifiers.push(ident);

    while (this.peekTokenIs(token.COMMA)) {
      this.nextToken(); // skip ob `,`
      this.nextToken();
      const ident = new Identifier(this.curToken, this.curToken.literal);
      identifiers.push(ident);
    }

    if (!this.expectPeek(token.RPAREN)) {
      // ,にぶつからないところまで読んだのに)で終わっていないので構文エラー
      throw new Error("not ended with )");
    }

    return identifiers;
  }

  parseBlockStatement() {
    const block = new BlockStatement(this.curToken);

    this.nextToken();

    while (!this.curTokenIs(token.RBRACE) && !this.curTokenIs(token.EOF)) {
      const stmt = this.parseStatement();
      if (stmt) block.statements.push(stmt);
      this.nextToken();
    }

    return block;
  }

  parseCallExpression(fn: TExpression): TExpression {
    const args = this.parseCallArguments();
    const exp = new CallExpression(this.curToken, fn, args);
    return exp;
  }

  parseCallArguments(): TExpression[] {
    const args = [] as TExpression[];

    if (this.peekTokenIs(token.RPAREN)) {
      this.nextToken();
      return args;
    }

    this.nextToken();
    const arg = this.parseExpression(precedences.LOWEST);
    assertExists(arg);
    args.push(arg);

    while (this.peekTokenIs(token.COMMA)) {
      this.nextToken();
      this.nextToken();

      const arg = this.parseExpression(precedences.LOWEST);
      assertExists(arg);
      args.push(arg);
    }

    if (!this.expectPeek(token.RPAREN)) {
      throw new Error("un ended with }");
    }

    return args;
  }

  parsePrefixExpression(): TExpression {
    const expression = new PrefixExpression(
      this.curToken,
      this.curToken.literal
    );

    this.nextToken();

    const parsed = this.parseExpression(precedences.PREFIX);
    assertExists(parsed, "parsed");
    expression.right = parsed;

    return expression;
  }

  parseInfixExpression(left: TExpression): TExpression {
    const expression = new InfixExpression(
      this.curToken,
      left,
      this.curToken.literal
    );

    const precedence = this.curPrecedence();
    this.nextToken();

    const parsedExpression = this.parseExpression(precedence);
    assertExists(parsedExpression, "parsedExpression");
    expression.right = parsedExpression;

    return expression;
  }

  curTokenIs(t: TokenType): boolean {
    return this.curToken.type === t;
  }

  peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type === t;
  }

  expectPeek(t: TokenType): boolean {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(t);
      return false;
    }
  }

  peekPrecedence(): number {
    return (
      precedenceTable[this.peekToken.type as PrecedenceTableKeyType] ??
      precedences.LOWEST
    );
  }

  curPrecedence(): number {
    return (
      precedenceTable[this.curToken?.type as PrecedenceTableKeyType] ??
      precedences.LOWEST
    );
  }

  peekError(t: TokenType): void {
    const msg = `expected next token to be ${t}, got ${this.peekToken?.type} instead`;
    this.errors.push(msg);
  }

  noPrefixParseFnError(t: TokenType): void {
    const msg = `no prefix parse function for ${t} found`;
    this.errors.push(msg);
  }

  registerPrefix(tokenType: TokenType, fn: PrefixParseFn): void {
    this.prefixParseFns[tokenType] = fn;
  }

  registerInfix(tokenType: TokenType, fn: InfixParseFn): void {
    this.infixParseFns[tokenType] = fn;
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  const testParserErrors = (parser: Parser) => {
    if (parser.errors.length > 0) {
      console.log(JSON.stringify(parser.errors, null, 2));
    }
    expect(parser.errors.length).toBe(0);
  };

  const testLetStatement = (stmt: TStatement, name: string) => {
    const isLetStatement = (stmt: TStatement): stmt is LetStatement => {
      return stmt instanceof LetStatement;
    };
    expect(stmt).toBeInstanceOf(LetStatement);
    if (isLetStatement(stmt)) {
      expect(stmt.tokenLiteral()).toBe("let");
      expect(stmt.name.value).toBe(name);
      expect(stmt.name.tokenLiteral()).toBe(name);
    }
  };

  const testLiteralExpression = (
    exp: TExpression,
    expected: number | string | boolean
  ) => {
    return match(expected)
      .with(P.string, (v) => {
        return testIdentifier(exp as Identifier, v);
      })
      .with(P.number, (v) => {
        return testIntegerLiteral(exp as IntegerLiteral, v);
      })
      .with(P.boolean, (v) => {
        testBooleanLiteral(exp as Boolean2, v);
      })
      .exhaustive();
  };

  const testIntegerLiteral = (
    integerLiteral: IntegerLiteral,
    value: number
  ) => {
    expect(integerLiteral).toBeInstanceOf(IntegerLiteral);
    expect(integerLiteral.value).toBe(value);
    expect(integerLiteral.tokenLiteral()).toBe(String(value));
  };

  const testIdentifier = (exp: TExpression, value: string) => {
    const isIdentifier = (exp: TExpression): exp is Identifier => {
      return exp instanceof Identifier;
    };
    expect(exp).toBeInstanceOf(Identifier);
    if (isIdentifier(exp)) {
      expect(exp.value).toBe(value);
      expect(exp.tokenLiteral()).toBe(value);
    }
  };

  const testBooleanLiteral = (booleanLiteral: Boolean2, value: boolean) => {
    expect(booleanLiteral).toBeInstanceOf(Boolean2);
    expect(booleanLiteral.value).toBe(value);
    expect(booleanLiteral.tokenLiteral()).toBe(String(value));
  };

  const testInfixExpression = (
    exp: TExpression,
    left: any,
    operator: string,
    right: any
  ) => {
    const isInfixExpression = (exp: TExpression): exp is InfixExpression => {
      return exp instanceof InfixExpression;
    };
    expect(exp).toBeInstanceOf(InfixExpression);
    if (isInfixExpression(exp)) {
      testLiteralExpression(exp.left, left);
      expect(exp.operator).toBe(operator);
      testLiteralExpression(exp.right, right);
    }
  };

  describe("parser", () => {
    describe("LetStatements", () => {
      test.each([
        ["let x = 5;", "x", 5],
        ["let y = true;", "y", true],
        ["let foobar = y;", "foobar", "y"],
      ])("%s", (input, expectedIdentifier, expectedValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as LetStatement;
        testLetStatement(stmt, expectedIdentifier);
        testLiteralExpression(stmt.value, expectedValue);
      });
    });

    describe("ReturnStatements", () => {
      test.each([["return 10;", 10]])("%s", (input, expectedReturnValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ReturnStatement;
        expect(stmt).toBeInstanceOf(ReturnStatement);
        expect(stmt.tokenLiteral()).toBe("return");
        testLiteralExpression(stmt.returnValue, expectedReturnValue);
      });
    });

    describe("IdentifierExpression", () => {
      test.each([["foobar;", "foobar"]])("%s", (input, expectedValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement<Identifier>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);
        expect(stmt.tokenLiteral()).toBe(expectedValue);
        expect(stmt.expression.value).toBe(expectedValue);
        expect(stmt.expression.tokenLiteral()).toBe(expectedValue);
      });
    });

    describe("IntegerLiteralExpression", () => {
      test.each([["5;", 5]])("%s", (input, expectedValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<IntegerLiteral>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);
        testIntegerLiteral(stmt.expression, expectedValue);
      });
    });

    describe("BooleanExpression", () => {
      test.each([
        ["true;", true],
        ["false;", false],
      ])("%s", (input, expectedValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement<Boolean2>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);
        const exp = stmt.expression;
        expect(exp.value).toBe(expectedValue);
      });
    });

    describe("ParsingPrefixExpressions", () => {
      test.each([
        ["!5;", "!", 5],
        ["-15;", "-", 15],
        ["!foobar;", "!", "foobar"],
        ["-foobar;", "-", "foobar"],
        ["!true;", "!", true],
        ["!false;", "!", false],
      ])("%s", (input, operator, value) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<PrefixExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        expect(exp.operator).toBe(operator);

        testLiteralExpression(exp.right, value);
      });
    });

    describe("ParsingInfixExpressions", () => {
      test.each([
        ["5 + 5;", 5, "+", 5],
        ["5 - 5;", 5, "-", 5],
        ["5 * 5;", 5, "*", 5],
        ["5 / 5;", 5, "/", 5],
        ["5 > 5;", 5, ">", 5],
        ["5 < 5;", 5, "<", 5],
        ["5 == 5;", 5, "==", 5],
        ["5 != 5;", 5, "!=", 5],
        ["foobar + barfoo;", "foobar", "+", "barfoo"],
        ["foobar - barfoo;", "foobar", "-", "barfoo"],
        ["foobar * barfoo;", "foobar", "*", "barfoo"],
        ["foobar / barfoo;", "foobar", "/", "barfoo"],
        ["foobar > barfoo;", "foobar", ">", "barfoo"],
        ["foobar < barfoo;", "foobar", "<", "barfoo"],
        ["foobar == barfoo;", "foobar", "==", "barfoo"],
        ["foobar != barfoo;", "foobar", "!=", "barfoo"],
        ["true == true", true, "==", true],
        ["true != false", true, "!=", false],
        ["false == false", false, "==", false],
      ])("%s", (input, leftValue, operator, rightValue) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<InfixExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        testInfixExpression(exp, leftValue, operator, rightValue);
      });
    });

    describe("OperatorPrecedenceParsing", () => {
      test.each([
        ["-a * b", "((-a) * b)"],
        ["!-a", "(!(-a))"],
        ["a + b + c", "((a + b) + c)"],
        ["a + b - c", "((a + b) - c)"],
        ["a * b * c", "((a * b) * c)"],
        ["a * b / c", "((a * b) / c)"],
        ["a + b / c", "(a + (b / c))"],
        ["a + b * c + d / e - f", "(((a + (b * c)) + (d / e)) - f)"],
        ["3 + 4; -5 * 5", "(3 + 4)((-5) * 5)"],
        ["5 > 4 == 3 < 4", "((5 > 4) == (3 < 4))"],
        ["5 < 4 != 3 > 4", "((5 < 4) != (3 > 4))"],
        [
          "3 + 4 * 5 == 3 * 1 + 4 * 5",
          "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        ],
        ["true", "true"],
        ["false", "false"],
        ["3 > 5 == false", "((3 > 5) == false)"],
        ["3 < 5 == true", "((3 < 5) == true)"],
        ["1 + (2 + 3) + 4", "((1 + (2 + 3)) + 4)"],
        ["(5 + 5) * 2", "((5 + 5) * 2)"],
        ["2 / (5 + 5)", "(2 / (5 + 5))"],
        ["(5 + 5) * 2 * (5 + 5)", "(((5 + 5) * 2) * (5 + 5))"],
        ["-(5 + 5)", "(-(5 + 5))"],
        ["!(true == true)", "(!(true == true))"],
        ["a + add(b * c) + d", "((a + add((b * c))) + d)"],
        [
          "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
          "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
        ],
        ["add(a + b + c * d / f + g)", "add((((a + b) + ((c * d) / f)) + g))"],
      ])("%s", (input, expected) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);
        expect(program.toString()).toBe(expected);
      });
    });

    describe("IfExpression", () => {
      const input = `if (x < y) { x }`;
      test(input, () => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);

        const stmt = program.statements[0] as ExpressionStatement<IfExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        testInfixExpression(exp.condition, "x", "<", "y");
        expect(exp.consequence.statements.length).toBe(1);
        const consequence = exp.consequence
          .statements[0] as ExpressionStatement<Identifier>;
        testIdentifier(consequence.expression, "x");
        expect(exp.alternative).toBeUndefined();
      });
    });

    describe("IfElseExpression", () => {
      const input = `if (x < y) { x } else { y }`;
      test(input, () => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement<IfExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        testInfixExpression(exp.condition, "x", "<", "y");
        expect(exp.consequence.statements.length).toBe(1);

        const consequence = exp.consequence
          .statements[0] as ExpressionStatement<Identifier>;
        testIdentifier(consequence.expression, "x");
        expect(exp.alternative?.statements.length).toBe(1);

        const alternative = exp.alternative
          ?.statements[0] as ExpressionStatement<Identifier>;
        testIdentifier(alternative.expression, "y");
      });
    });

    describe("FunctionLiteralParsing", () => {
      const input = `fn(x, y) { x + y; }`;
      test(input, () => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<FunctionLiteral>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const fn = stmt.expression;
        expect(fn.parameters.length).toBe(2);
        testLiteralExpression(fn.parameters[0], "x");
        testLiteralExpression(fn.parameters[1], "y");
        expect(fn.body.statements.length).toBe(1);

        const bodyStmt = fn.body
          .statements[0] as ExpressionStatement<InfixExpression>;
        testInfixExpression(bodyStmt.expression, "x", "+", "y");
      });
    });

    describe("FunctionParameterParsing", () => {
      test.each([
        ["fn() {};", []],
        ["fn(x) {};", ["x"]],
        ["fn(x, y, z) {};", ["x", "y", "z"]],
      ])("%s", (input, expectedParams) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<FunctionLiteral>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const fn = stmt.expression;
        expect(fn.parameters.length).toBe(expectedParams.length);
        fn.parameters.forEach((ident, i) => {
          testLiteralExpression(ident, expectedParams[i]);
        });
      });
    });

    describe("CallExpressionParsing", () => {
      const input = `add(1, 2 * 3, 4 + 5);`;
      test(input, () => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<CallExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        testIdentifier(exp.function, "add");
        expect(exp.arguments.length).toBe(3);

        testLiteralExpression(exp.arguments[0], 1);
        testInfixExpression(exp.arguments[1], 2, "*", 3);
        testInfixExpression(exp.arguments[2], 4, "+", 5);
      });
    });

    describe("CallExpressionParameterParsing", () => {
      test.each([
        ["add();", "add", []],
        ["add(1);", "add", ["1"]],
        ["add(1, 2 * 3, 4 + 5);", "add", ["1", "(2 * 3)", "(4 + 5)"]],
      ])("%s", (input, expectedIdent, expectedArgs) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        testParserErrors(parser);

        expect(program.statements.length).toBe(1);
        const stmt = program
          .statements[0] as ExpressionStatement<CallExpression>;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression;
        testIdentifier(exp.function, expectedIdent);
        expect(exp.arguments.length).toBe(expectedArgs.length);
        exp.arguments.forEach((arg, i) => {
          expect(arg.toString()).toEqual(expectedArgs[i]);
        });
      });
    });

    describe("parse error", () => {
      test("let x  5;", () => {
        const lexer = new Lexer("let x  5;");
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        expect(parser.errors.length).toBe(1);
        expect(parser.errors).toMatchInlineSnapshot(`
          [
            "expected next token to be =, got INT instead",
          ]
        `);
      });
    });
  });
}
