export const token = {
  ILLEGAL: "ILLEGAL",
  EOF: "EOF",

  // Identifiers + literals
  IDENT: "IDENT", // add, foobar, x, y, ...
  INT: "INT", // 1343456

  // Operators
  ASSIGN: "=",
  PLUS: "+",
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",

  LT: "<",
  GT: ">",

  EQ: "==",
  NOT_EQ: "!=",

  // Delimiters,
  COMMA: ",",
  SEMICOLON: ";",

  LPAREN: "(",
  RPAREN: ")",
  LBRACE: "{",
  RBRACE: "}",

  // Keywords,
  FUNCTION: "FUNCTION",
  LET: "LET",
  TRUE: "TRUE",
  FALSE: "FALSE",
  IF: "IF",
  ELSE: "ELSE",
  RETURN: "RETURN",
} as const;

export const keywords = {
  fn: token.FUNCTION,
  let: token.LET,
  true: token.TRUE,
  false: token.FALSE,
  if: token.IF,
  else: token.ELSE,
  return: token.RETURN,
};

type ValuesOf<T extends Record<string, string>> = T[keyof T];
export type TokenKey = keyof Token;
export type TokenType = ValuesOf<typeof token>;
type KeyWordsKeyType = keyof typeof keywords;

export class Token {
  constructor(public type: TokenType, public literal: string) {}
}

export const lookupIdent = (ident: string): TokenType => {
  return keywords[ident as KeyWordsKeyType] || token.IDENT;
};
