import { Token, token } from "../token/token.js";

const assert = (expression: boolean, message?: string): never | void => {
  if (!expression) {
    throw new Error(message ?? "assertion error");
  }
};

const nodeMemberAssert = (expression: boolean, name: string): never | void => {
  assert(expression, `${name} is undefined.`);
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
  | LetStatement
  | ReturnStatement
  | BlockStatement
  | ExpressionStatement;
export type TNode = TStatement | TExpression;

export class Identifier implements Expression {
  constructor(public token: Token, public value: string) {}

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.value;
  }
}

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

export class IntegerLiteral implements Expression {
  constructor(private token: Token, private _value?: number) {}

  get value(): number {
    nodeMemberAssert(!!this._value, "value");
    return this._value!;
  }

  set value(value: number) {
    this._value = value;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.token.literal;
  }
}

export class Boolean2 implements Expression {
  constructor(private token: Token, private _value?: boolean) {}

  get value(): boolean {
    nodeMemberAssert(typeof this._value === "boolean", "value");
    return this._value!;
  }

  set value(value: boolean) {
    this._value = value;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.token.literal;
  }
}

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

export class IfExpression implements Expression {
  constructor(
    private token: Token,
    private _condition?: InfixExpression,
    private _consequence?: BlockStatement,
    private _alternative?: BlockStatement
  ) {}

  get alternative(): BlockStatement | undefined {
    return this._alternative;
  }

  set alternative(alternative: BlockStatement | undefined) {
    this._alternative = alternative;
  }

  get condition(): InfixExpression {
    nodeMemberAssert(!!this._condition, "condition");
    return this._condition!;
  }

  set condition(condition: InfixExpression) {
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
    return `if${this.condition.toString()}" "${this.consequence.toString()}" "${
      this.alternative != null ? `else ${this.alternative.toString()}` : ""
    }`;
  }
}

export class CallExpression implements Expression {
  constructor(
    private token: Token,
    private _function: TExpression,
    private _arguments: TExpression[]
  ) {}

  get function(): TExpression {
    nodeMemberAssert(!!this._function, "fn");
    return this._function!;
  }

  get arguments(): TExpression[] {
    return this._arguments;
  }

  expressionNode(): void {
    return;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.function.toString()}(${this.arguments.join(", ")})`;
  }
}

export class Program {
  constructor(public statements: TStatement[]) {}

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return "";
    }
  }

  toString(): string {
    return this.statements.map((s) => s.toString()).join("");
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe("ast", () => {
    describe("Program", () => {
      test("toString", () => {
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
