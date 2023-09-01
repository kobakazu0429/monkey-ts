import { BlockStatement } from "../ast/BlockStatement.js";
import { Identifier } from "../ast/Identifier.js";
import { Environment } from "./environment.js";

export const objectType = {
  NULL_OBJ: "NULL",
  ERROR_OBJ: "ERROR",
  INTEGER_OBJ: "INTEGER",
  STRING_OBJ: "STRING",
  BOOLEAN_OBJ: "BOOLEAN",
  RETURN_VALUE_OBJ: "RETURN_VALUE",
  FUNCTION_OBJ: "FUNCTION",
};

type ObjectType = string;

export interface Obj {
  type: () => ObjectType;
  inspect: () => string;
}

export type Objs =
  | Integer
  | StringO
  | BooleanO
  | Null
  | ReturnValue
  | ErrorO
  | FunctionO;

export class Integer implements Obj {
  constructor(public value: number) {}

  type(): ObjectType {
    return objectType.INTEGER_OBJ;
  }

  inspect(): string {
    return this.value.toString();
  }
}

export class StringO implements Obj {
  constructor(public value: string) {}

  type(): ObjectType {
    return objectType.STRING_OBJ;
  }

  inspect(): string {
    return this.value.toString();
  }
}

export class BooleanO implements Obj {
  constructor(public value: boolean) {}

  type(): ObjectType {
    return objectType.BOOLEAN_OBJ;
  }

  inspect(): string {
    return String(this.value);
  }
}

export class Null implements Obj {
  type(): ObjectType {
    return objectType.NULL_OBJ;
  }

  inspect(): string {
    return "null";
  }
}

export class ReturnValue implements Obj {
  constructor(public value: Obj) {}

  type(): ObjectType {
    return objectType.RETURN_VALUE_OBJ;
  }

  inspect(): string {
    return this.value.inspect();
  }
}

export class ErrorO implements Obj {
  constructor(public message: string) {}

  type(): ObjectType {
    return objectType.ERROR_OBJ;
  }

  inspect(): string {
    return `ERROR: ${this.message}`;
  }
}

export class FunctionO implements Obj {
  constructor(
    public parameters: Identifier[],
    public body: BlockStatement,
    public env: Environment
  ) {}

  type(): ObjectType {
    return objectType.FUNCTION_OBJ;
  }

  inspect(): string {
    return `fn(${this.parameters.join(", ")}) {
  ${this.body.toString()}
}`.trim();
  }
}
