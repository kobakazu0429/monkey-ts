import { token } from "../token/token.js";

export const enum precedences {
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // > or <
  SUM, // +
  PRODUCT, // *
  PREFIX, // -X or !X
  CALL, // myFunction(X),
}

export type PrecedencesKeyType = keyof typeof precedences;

export const precedenceTable = {
  [token.EQ]: precedences.EQUALS,
  [token.NOT_EQ]: precedences.EQUALS,
  [token.LT]: precedences.LESSGREATER,
  [token.GT]: precedences.LESSGREATER,
  [token.PLUS]: precedences.SUM,
  [token.MINUS]: precedences.SUM,
  [token.SLASH]: precedences.PRODUCT,
  [token.ASTERISK]: precedences.PRODUCT,
  [token.LPAREN]: precedences.CALL,
};

export type PrecedenceTableKeyType = keyof typeof precedenceTable;
