// func TestNextToken(t *testing.T) {
// 	input := `let five = 5;
// let ten = 10;

// let add = fn(x, y) {
//   x + y;
// };

// let result = add(five, ten);
// !-/*5;
// 5 < 10 > 5;

// if (5 < 10) {
// 	return true;
// } else {
// 	return false;
// }

// 10 == 10;
// 10 != 9;
// `

// 	tests := []struct {
// 		expectedType    token.TokenType
// 		expectedLiteral string
// 	}{
// 		{token.LET, "let"},
// 		{token.IDENT, "five"},
// 		{token.ASSIGN, "="},
// 		{token.INT, "5"},
// 		{token.SEMICOLON, ";"},
// 		{token.LET, "let"},
// 		{token.IDENT, "ten"},
// 		{token.ASSIGN, "="},
// 		{token.INT, "10"},
// 		{token.SEMICOLON, ";"},
// 		{token.LET, "let"},
// 		{token.IDENT, "add"},
// 		{token.ASSIGN, "="},
// 		{token.FUNCTION, "fn"},
// 		{token.LPAREN, "("},
// 		{token.IDENT, "x"},
// 		{token.COMMA, ","},
// 		{token.IDENT, "y"},
// 		{token.RPAREN, ")"},
// 		{token.LBRACE, "{"},
// 		{token.IDENT, "x"},
// 		{token.PLUS, "+"},
// 		{token.IDENT, "y"},
// 		{token.SEMICOLON, ";"},
// 		{token.RBRACE, "}"},
// 		{token.SEMICOLON, ";"},
// 		{token.LET, "let"},
// 		{token.IDENT, "result"},
// 		{token.ASSIGN, "="},
// 		{token.IDENT, "add"},
// 		{token.LPAREN, "("},
// 		{token.IDENT, "five"},
// 		{token.COMMA, ","},
// 		{token.IDENT, "ten"},
// 		{token.RPAREN, ")"},
// 		{token.SEMICOLON, ";"},
// 		{token.BANG, "!"},
// 		{token.MINUS, "-"},
// 		{token.SLASH, "/"},
// 		{token.ASTERISK, "*"},
// 		{token.INT, "5"},
// 		{token.SEMICOLON, ";"},
// 		{token.INT, "5"},
// 		{token.LT, "<"},
// 		{token.INT, "10"},
// 		{token.GT, ">"},
// 		{token.INT, "5"},
// 		{token.SEMICOLON, ";"},
// 		{token.IF, "if"},
// 		{token.LPAREN, "("},
// 		{token.INT, "5"},
// 		{token.LT, "<"},
// 		{token.INT, "10"},
// 		{token.RPAREN, ")"},
// 		{token.LBRACE, "{"},
// 		{token.RETURN, "return"},
// 		{token.TRUE, "true"},
// 		{token.SEMICOLON, ";"},
// 		{token.RBRACE, "}"},
// 		{token.ELSE, "else"},
// 		{token.LBRACE, "{"},
// 		{token.RETURN, "return"},
// 		{token.FALSE, "false"},
// 		{token.SEMICOLON, ";"},
// 		{token.RBRACE, "}"},
// 		{token.INT, "10"},
// 		{token.EQ, "=="},
// 		{token.INT, "10"},
// 		{token.SEMICOLON, ";"},
// 		{token.INT, "10"},
// 		{token.NOT_EQ, "!="},
// 		{token.INT, "9"},
// 		{token.SEMICOLON, ";"},
// 		{token.EOF, ""},
// 	}

// 	l := New(input)

// 	for i, tt := range tests {
// 		tok := l.NextToken()

// 		if tok.Type != tt.expectedType {
// 			t.Fatalf("tests[%d] - tokentype wrong. expected=%q, got=%q",
// 				i, tt.expectedType, tok.Type)
// 		}

// 		if tok.Literal != tt.expectedLiteral {
// 			t.Fatalf("tests[%d] - literal wrong. expected=%q, got=%q",
// 				i, tt.expectedLiteral, tok.Literal)
// 		}
// 	}
// }

import { match } from "ts-pattern";
import { Token, lookupIdent, token, keywords } from "../token/token.js";

export class Lexer {
  constructor(
    private input: string,
    private position: number = 0,
    private readPosition: number = 0,
    private ch: string = ""
  ) {
    this.readChar();
  }

  readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = "";
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return token.EOF; // zero value of string
    } else {
      return this.input[this.readPosition];
    }
  }

  public nextToken(): Token {
    let skipReadChar = false;
    this.skipWhitespace();

    const tok: Token = match(this.ch as Token["type"] | "")
      .with("=", () => {
        if (this.peekChar() === "=") {
          this.readChar();
          return new Token(token.EQ, "==");
        } else {
          return new Token(token.ASSIGN, this.ch);
        }
      })
      .with("+", () => new Token(token.PLUS, this.ch))
      .with("-", () => new Token(token.MINUS, this.ch))
      .with("!", () => {
        if (this.peekChar() === "=") {
          this.readChar();
          return new Token(token.NOT_EQ, "!=");
        } else {
          return new Token(token.BANG, this.ch);
        }
      })
      .with("*", () => new Token(token.ASTERISK, this.ch))
      .with("/", () => new Token(token.SLASH, this.ch))
      .with("<", () => new Token(token.LT, this.ch))
      .with(">", () => new Token(token.GT, this.ch))
      .with(",", () => new Token(token.COMMA, this.ch))
      .with(";", () => new Token(token.SEMICOLON, this.ch))
      .with("(", () => new Token(token.LPAREN, this.ch))
      .with(")", () => new Token(token.RPAREN, this.ch))
      .with("{", () => new Token(token.LBRACE, this.ch))
      .with("}", () => new Token(token.RBRACE, this.ch))
      .with("", () => new Token(token.EOF, this.ch))
      .otherwise(() => {
        if (this.isLetter(this.ch)) {
          const identifier = this.readIdentifier();
          const type = lookupIdent(identifier);
          skipReadChar = true;
          return new Token(type, identifier);
        } else if (this.isDigit(this.ch)) {
          const literal = this.readNumber();
          skipReadChar = true;
          return new Token(token.INT, literal);
        } else {
          return new Token(token.ILLEGAL, this.ch);
        }
      });

    if (!skipReadChar) {
      this.readChar();
    }

    return tok;
  }

  private readIdentifier(): string {
    return this.read(this.isLetter);
  }

  private readNumber(): string {
    return this.read(this.isDigit);
  }

  private read(comparator: (ch: string) => boolean): string {
    const position = this.position;
    while (comparator(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private isLetter(ch: string): boolean {
    return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch == "_";
  }

  private isDigit(ch: string): boolean {
    return "0" <= ch && ch <= "9";
  }

  private skipWhitespace(): void {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }
}

// in-source test suites
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe("lexer", () => {
    const code = `
      let five = 5;
      let ten = 10;

      let add = fn(x, y) {
        x + y;
      };

      let result = add(five, ten);

      !-/*5;
      5 < 10 > 5;

      if (5 < 10) {
        return true;
      } else {
        return false;
      }

      10 == 10;
      10 != 9;
    `;

    const lexer = new Lexer(code);
    test.each([
      [{ type: "LET", literal: "let" }],
      [{ type: "IDENT", literal: "five" }],
      [{ type: "=", literal: "=" }],
      [{ type: "INT", literal: "5" }],
      [{ type: ";", literal: ";" }],
      [{ type: "LET", literal: "let" }],
      [{ type: "IDENT", literal: "ten" }],
      [{ type: "=", literal: "=" }],
      [{ type: "INT", literal: "10" }],
      [{ type: ";", literal: ";" }],
      [{ type: "LET", literal: "let" }],
      [{ type: "IDENT", literal: "add" }],
      [{ type: "=", literal: "=" }],
      [{ type: "FUNCTION", literal: "fn" }],
      [{ type: "(", literal: "(" }],
      [{ type: "IDENT", literal: "x" }],
      [{ type: ",", literal: "," }],
      [{ type: "IDENT", literal: "y" }],
      [{ type: ")", literal: ")" }],
      [{ type: "{", literal: "{" }],
      [{ type: "IDENT", literal: "x" }],
      [{ type: "+", literal: "+" }],
      [{ type: "IDENT", literal: "y" }],
      [{ type: ";", literal: ";" }],
      [{ type: "}", literal: "}" }],
      [{ type: ";", literal: ";" }],
      [{ type: "LET", literal: "let" }],
      [{ type: "IDENT", literal: "result" }],
      [{ type: "=", literal: "=" }],
      [{ type: "IDENT", literal: "add" }],
      [{ type: "(", literal: "(" }],
      [{ type: "IDENT", literal: "five" }],
      [{ type: ",", literal: "," }],
      [{ type: "IDENT", literal: "ten" }],
      [{ type: ")", literal: ")" }],
      [{ type: ";", literal: ";" }],
      [{ type: "!", literal: "!" }],
      [{ type: "-", literal: "-" }],
      [{ type: "/", literal: "/" }],
      [{ type: "*", literal: "*" }],
      [{ type: "INT", literal: "5" }],
      [{ type: ";", literal: ";" }],
      [{ type: "INT", literal: "5" }],
      [{ type: "<", literal: "<" }],
      [{ type: "INT", literal: "10" }],
      [{ type: ">", literal: ">" }],
      [{ type: "INT", literal: "5" }],
      [{ type: ";", literal: ";" }],
      [{ type: "IF", literal: "if" }],
      [{ type: "(", literal: "(" }],
      [{ type: "INT", literal: "5" }],
      [{ type: "<", literal: "<" }],
      [{ type: "INT", literal: "10" }],
      [{ type: ")", literal: ")" }],
      [{ type: "{", literal: "{" }],
      [{ type: "RETURN", literal: "return" }],
      [{ type: "TRUE", literal: "true" }],
      [{ type: ";", literal: ";" }],
      [{ type: "}", literal: "}" }],
      [{ type: "ELSE", literal: "else" }],
      [{ type: "{", literal: "{" }],
      [{ type: "RETURN", literal: "return" }],
      [{ type: "FALSE", literal: "false" }],
      [{ type: ";", literal: ";" }],
      [{ type: "}", literal: "}" }],
      [{ type: "INT", literal: "10" }],
      [{ type: "==", literal: "==" }],
      [{ type: "INT", literal: "10" }],
      [{ type: ";", literal: ";" }],
      [{ type: "INT", literal: "10" }],
      [{ type: "!=", literal: "!=" }],
      [{ type: "INT", literal: "9" }],
      [{ type: ";", literal: ";" }],
      [{ type: "EOF", literal: "" }],
    ])("nextToken", (expected) => {
      expect(lexer.nextToken()).toEqual(expected);
    });
  });
}
