import { match } from "ts-pattern";
import { Token, lookupIdent, token } from "../token/token.js";

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
