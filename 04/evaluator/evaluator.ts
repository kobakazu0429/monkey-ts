import { match } from "ts-pattern";
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
import { Environment } from "../object/environment.js";
import {
  BooleanO,
  ErrorO,
  FunctionO,
  Integer,
  Null,
  Obj,
  ReturnValue,
  StringO,
  objectType,
} from "../object/object.js";
import { type TExpression, type TNode } from "./../ast/ast.js";
import { Parser } from "./../parser/parser.js";
import { StringLiteral } from "../ast/StringLiteral.js";

const NULL = new Null();
const TRUE = new BooleanO(true);
const FALSE = new BooleanO(false);

const nativeBoolToBooleanObject = (input: boolean): BooleanO => {
  if (input) {
    return TRUE;
  }
  return FALSE;
};

export const evaluate = (node: TNode, env: Environment): Obj => {
  if (node instanceof Program) {
    return evalProgram(node, env);
  } else if (node instanceof BlockStatement) {
    return evalBlockStatement(node, env);
  } else if (node instanceof ExpressionStatement) {
    return evaluate(node.expression, env);
  } else if (node instanceof ReturnStatement) {
    const value = evaluate(node.returnValue, env);
    if (isError(value)) {
      return value;
    }
    return new ReturnValue(value);
  } else if (node instanceof LetStatement) {
    const value = evaluate(node.value, env);

    if (isError(value)) {
      return value;
    }
    env.set(node.name.value, value);

    return value;
  } else if (node instanceof IntegerLiteral) {
    return new Integer(node.value);
  } else if (node instanceof Boolean2) {
    return nativeBoolToBooleanObject(node.value);
  } else if (node instanceof PrefixExpression) {
    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }

    return evalPrefixExpression(node.operator, right);
  } else if (node instanceof InfixExpression) {
    const left = evaluate(node.left, env);
    if (isError(left)) {
      return left;
    }

    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }

    return evalInfixExpression(node.operator, left, right);
  } else if (node instanceof IfExpression) {
    return evalIfExpression(node, env);
  } else if (node instanceof Identifier) {
    return evalIdentifier(node, env);
  } else if (node instanceof FunctionLiteral) {
    const params = node.parameters;
    const body = node.body;
    return new FunctionO(params, body, env);
  } else if (node instanceof CallExpression) {
    const fn = evaluate(node.function, env);
    if (isError(fn)) {
      return fn;
    }

    const args = evalExpressions(node.arguments, env);
    if (args.length == 1 && isError(args[0])) {
      return args[0];
    }

    return applyFunction(fn, args);
  } else if (node instanceof StringLiteral) {
    return new StringO(node.value);
  }

  throw new Error("not impl");
};

const evalProgram = (program: Program, env: Environment): Obj => {
  let result;

  for (const statement of program.statements) {
    result = evaluate(statement, env);
    if (result instanceof ReturnValue) {
      return result.value;
    } else if (result instanceof ErrorO) {
      return result;
    }
  }

  if (!result) {
    throw new Error("no program");
  }

  return result;
};

const evalBlockStatement = (block: BlockStatement, env: Environment): Obj => {
  let result: Obj | null;

  for (const statement of block.statements) {
    result = evaluate(statement, env);

    if (
      (result && result.type() == objectType.RETURN_VALUE_OBJ) ||
      result.type() == objectType.ERROR_OBJ
    ) {
      return result;
    }
  }

  if (!result!) {
    throw new Error("no program");
  }

  return result;
};

const evalPrefixExpression = (operator: string, right: Obj): Obj => {
  return match(operator)
    .with("!", () => evalBangOperatorExpression(right))
    .with("-", () => evalMinusPrefixOperatorExpression(right))
    .otherwise(
      () => new ErrorO(`unknown operator: ${operator}${right.type()}`)
    );
};

const evalBangOperatorExpression = (right: Obj): Obj => {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
};

const isInteger = (node: Obj): node is Integer => {
  return node.type() == objectType.INTEGER_OBJ;
};

const isString = (node: Obj): node is StringO => {
  return node.type() == objectType.STRING_OBJ;
};

const evalMinusPrefixOperatorExpression = (right: Obj): Obj => {
  if (isInteger(right)) {
    return new Integer(-1 * right.value);
  }

  return new ErrorO(`unknown operator: -${right.type()}`);
};

const evalInfixExpression = (operator: string, left: Obj, right: Obj): Obj => {
  if (isInteger(left) && isInteger(right)) {
    return evalIntegerInfixExpression(operator, left, right);
  } else if (isString(left) && isString(right)) {
    return evalStringInfixExpression(operator, left, right);
  } else if (operator == "==") {
    return nativeBoolToBooleanObject(left == right);
  } else if (operator == "!=") {
    return nativeBoolToBooleanObject(left != right);
  } else if (left.type() !== right.type()) {
    return new ErrorO(
      `type mismatch: ${left.type()} ${operator} ${right.type()}`
    );
  }

  return new ErrorO(
    `unknown operator: ${left.type()} ${operator} ${right.type()}`
  );
};

const evalStringInfixExpression = (
  operator: string,
  left: StringO,
  right: StringO
): Obj => {
  const leftVal = left.value;
  const rightVal = right.value;

  if (operator !== "+") {
    return new ErrorO(
      `unknown operator: ${left.type()} ${operator} ${right.type()}`
    );
  }

  return new StringO(leftVal + rightVal);
};

const evalIntegerInfixExpression = (
  operator: string,
  left: Integer,
  right: Integer
): Obj => {
  const leftVal = left.value;
  const rightVal = right.value;

  switch (operator) {
    case "+":
      return new Integer(leftVal + rightVal);
    case "-":
      return new Integer(leftVal - rightVal);
    case "*":
      return new Integer(leftVal * rightVal);
    case "/":
      return new Integer(leftVal / rightVal);
    case "<":
      return nativeBoolToBooleanObject(leftVal < rightVal);
    case ">":
      return nativeBoolToBooleanObject(leftVal > rightVal);
    case "==":
      return nativeBoolToBooleanObject(leftVal == rightVal);
    case "!=":
      return nativeBoolToBooleanObject(leftVal != rightVal);
    default:
      return new ErrorO(
        `unknown operator: ${left.type()} ${operator} ${right.type()}`
      );
  }
};

const evalIfExpression = (ie: IfExpression, env: Environment): Obj => {
  const condition = evaluate(ie.condition, env);
  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return evaluate(ie.consequence, env);
  } else if (ie.alternative != undefined) {
    return evaluate(ie.alternative, env);
  } else {
    return NULL;
  }
};

const evalIdentifier = (node: Identifier, env: Environment): Obj => {
  const value = env.get(node.value);
  if (!value.ok) {
    return new ErrorO(`identifier not found: ${node.value}`);
  }
  return value.obj;
};

const evalExpressions = (exps: TExpression[], env: Environment): Obj[] => {
  const result: Obj[] = [];

  for (const exp of exps) {
    const evaluated = evaluate(exp, env);
    if (isError(evaluated)) {
      return [evaluated];
    }
    result.push(evaluated);
  }
  return result;
};

const applyFunction = (fn: Obj, args: Obj[]): Obj => {
  if (!(fn instanceof FunctionO)) {
    return new ErrorO(`not a function: ${fn.type()}`);
  }

  const extendedEnv = extendFunctionEnv(fn, args);
  const evaluated = evaluate(fn.body, extendedEnv);
  return unwrapReturnValue(evaluated);
};

const extendFunctionEnv = (fn: FunctionO, args: Obj[]): Environment => {
  const env = Environment.newEnclosedEnvironment(fn.env);

  for (let paramIdx = 0; paramIdx < fn.parameters.length; paramIdx++) {
    const param = fn.parameters[paramIdx];
    env.set(param.value, args[paramIdx]);
  }

  return env;
};

const unwrapReturnValue = (obj: Obj): Obj => {
  if (obj instanceof ReturnValue) {
    return obj.value;
  }

  return obj;
};

const isTruthy = (obj: Obj): boolean => {
  switch (obj) {
    case NULL:
      return false;
    case TRUE:
      return true;
    case FALSE:
      return false;
    default:
      return true;
  }
};

const isError = (obj: Obj): boolean => {
  return obj.type() === objectType.ERROR_OBJ;
};

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  const testEval = (input: string): Obj | null => {
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    const env = new Environment();

    return evaluate(program, env);
  };

  const testIntegerObject = (obj: Obj, expected: number) => {
    const isInteger = (obj: Obj): obj is Integer => {
      return obj instanceof Integer;
    };
    expect(obj).toBeInstanceOf(Integer);
    if (isInteger(obj)) {
      expect(obj.value).toBe(expected);
    }
  };

  const testStringObject = (obj: Obj, expected: string) => {
    const isStringO = (obj: Obj): obj is StringO => {
      return obj instanceof StringO;
    };
    expect(obj).toBeInstanceOf(StringO);
    if (isStringO(obj)) {
      expect(obj.value).toBe(expected);
    }
  };

  const testBooleanObject = (obj: Obj, expected: boolean) => {
    const isBooleanO = (obj: Obj): obj is BooleanO => {
      return obj instanceof BooleanO;
    };
    expect(obj).toBeInstanceOf(BooleanO);
    if (isBooleanO(obj)) {
      expect(obj.value).toBe(expected);
    }
  };

  const testNullObject = (obj: Obj) => {
    expect(obj.type()).toBe(objectType.NULL_OBJ);
  };

  describe("evaluator", () => {
    describe("EvalIntegerExpression", () => {
      test.each([
        ["5", 5],
        ["10", 10],
        ["-5", -5],
        ["-10", -10],
        ["5 + 5 + 5 + 5 - 10", 10],
        ["2 * 2 * 2 * 2 * 2", 32],
        ["-50 + 100 + -50", 0],
        ["5 * 2 + 10", 20],
        ["5 + 2 * 10", 25],
        ["20 + 2 * -10", 0],
        ["50 / 2 * 2 + 10", 60],
        ["2 * (5 + 10)", 30],
        ["3 * 3 * 3 + 10", 37],
        ["3 * (3 * 3) + 10", 37],
        ["(5 + 10 * 2 + 15 / 3) * 2 + -10", 50],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
      });
    });

    describe("EvalBooleanExpression", () => {
      test.each([
        ["true", true],
        ["false", false],
        ["1 < 2", true],
        ["1 > 2", false],
        ["1 < 1", false],
        ["1 > 1", false],
        ["1 == 1", true],
        ["1 != 1", false],
        ["1 == 2", false],
        ["1 != 2", true],
        ["true == true", true],
        ["false == false", true],
        ["true == false", false],
        ["true != false", true],
        ["false != true", true],
        ["(1 < 2) == true", true],
        ["(1 < 2) == false", false],
        ["(1 > 2) == true", false],
        ["(1 > 2) == false", true],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testBooleanObject(evaluated!, expected);
      });
    });

    describe("BangOperator", () => {
      test.each([
        ["!true", false],
        ["!false", true],
        ["!5", false],
        ["!!true", true],
        ["!!false", false],
        ["!!5", true],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testBooleanObject(evaluated!, expected);
      });
    });

    describe("IfElseExpressions", () => {
      test.each([
        ["if (true) { 10 }", 10],
        ["if (false) { 10 }", null],
        ["if (1) { 10 }", 10],
        ["if (1 < 2) { 10 }", 10],
        ["if (1 > 2) { 10 }", null],
        ["if (1 > 2) { 10 } else { 20 }", 20],
        ["if (1 < 2) { 10 } else { 20 }", 10],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        if (expected === null) {
          testNullObject(evaluated!);
        } else {
          testIntegerObject(evaluated!, expected);
        }
      });
    });

    describe("ReturnStatements", () => {
      test.each([
        ["return 10;", 10],
        ["return 10; 9;", 10],
        ["return 2 * 5; 9;", 10],
        ["9; return 2 * 5; 9;", 10],
        ["if (10 > 1) { return 10; }", 10],
        [
          `if (10 > 1) {
            if (10 > 1) {
              return 10;
            }

            return 1;
          }`,
          10,
        ],
        [
          `let f = fn(x) {
            return x;
            x + 10;
          };
          f(10);`,
          10,
        ],
        [
          `let f = fn(x) {
            let result = x + 10;
            return result;
            return 10;
          };
          f(10);`,
          20,
        ],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
      });
    });

    describe("ErrorHandling", () => {
      test.each([
        ["5 + true;", "type mismatch: INTEGER + BOOLEAN"],
        ["5 + true; 5;", "type mismatch: INTEGER + BOOLEAN"],
        ["-true", "unknown operator: -BOOLEAN"],
        ["true + false;", "unknown operator: BOOLEAN + BOOLEAN"],
        ["true + false + true + false;", "unknown operator: BOOLEAN + BOOLEAN"],
        ["5; true + false; 5", "unknown operator: BOOLEAN + BOOLEAN"],
        [`"Hello" - "World"`, "unknown operator: STRING - STRING"],
        [
          "if (10 > 1) { true + false; }",
          "unknown operator: BOOLEAN + BOOLEAN",
        ],
        [
          `if (10 > 1) {
            if (10 > 1) {
              return true + false;
            }

            return 1;
          }`,
          "unknown operator: BOOLEAN + BOOLEAN",
        ],
        ["foobar", "identifier not found: foobar"],
      ])("%s", (input, expectedMessage) => {
        const evaluated = testEval(input);
        expect(evaluated).toBeInstanceOf(ErrorO);
        expect((evaluated as ErrorO).message).toBe(expectedMessage);
      });
    });

    describe("LetStatements", () => {
      test.each([
        ["let a = 5; a;", 5],
        ["let a = 5 * 5; a;", 25],
        ["let a = 5; let b = a; b;", 5],
        ["let a = 5; let b = a; let c = a + b + 5; c;", 15],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
      });
    });

    describe("FunctionObject", () => {
      const input = `fn(x) { x + 2; };`;
      test(input, () => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();

        const fn = evaluated as FunctionO;
        expect(fn).toBeInstanceOf(FunctionO);
        expect(fn.parameters.length).toBe(1);
        expect(fn.parameters[0].toString()).toBe("x");
        expect(fn.body.toString()).toBe("(x + 2)");
        expect(fn.inspect()).toMatchInlineSnapshot(`
          "fn(x) {
            (x + 2)
          }"
        `);
      });
    });

    describe("FunctionApplication", () => {
      test.each([
        ["let identity = fn(x) { x; }; identity(5);", 5],
        ["let identity = fn(x) { return x; }; identity(5);", 5],
        ["let double = fn(x) { x * 2; }; double(5);", 10],
        ["let add = fn(x, y) { x + y; }; add(5, 5);", 10],
        ["let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));", 20],
        ["fn(x) { x; }(5)", 5],
      ])("%s", (input, expected) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
      });
    });

    describe("EnclosingEnvironments", () => {
      const input = `
        let first = 10;
        let second = 10;
        let third = 10;

        let ourFunction = fn(first) {
          let second = 20;

          first + second + third;
        };

        ourFunction(20) + first + second;`;
      test(input, () => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, 70);
      });
    });

    describe("StringLiteral", () => {
      const input = `"Hello World!"`;
      test(input, () => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testStringObject(evaluated!, "Hello World!");
      });
    });

    describe("StringConcatenation", () => {
      const input = `"Hello" + " " + "World!"`;
      test(input, () => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testStringObject(evaluated!, "Hello World!");
      });
    });
  });
}
