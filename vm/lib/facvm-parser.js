var Lexer = require("./facvm-lexer.js").Lexer,
    util = require("util"),
    fs = require("fs");

var lexer = new Lexer();
lexer.tokens = [
    // whitespace and comments
    { regex: /^ +/,                         type: "WHITESPACE" },
    { regex: /^\t+/,                        type: "TAB" },
    { regex: /^\n|\r\n?/,                   type: "NEWLINE" },
    { regex: /^\/\/[^\r\n]*/,               type: "COMMENT" },

    // operators
    { regex: /^</,                          type: "LT" },
    { regex: /^>/,                          type: "GT" },
    { regex: /^\(/,                         type: "LPAREN" },
    { regex: /^\)/,                         type: "RPAREN" },
    { regex: /^:=/,                         type: "ASSIGN" },
    { regex: /^:/,                          type: "COLON" },
    { regex: /^,/,                          type: "COMMA" },
    { regex: /^=/,                          type: "EQUAL" },
    { regex: /^\./,                         type: "DOT" },
    { regex: /^->/,                         type: "ARROW" },
    { regex: /^-/,                          type: "MINUS" },
    { regex: /^\+/,                         type: "PLUS" },
    { regex: /^\*/,                         type: "TIMES" },
    { regex: /^\//,                         type: "DIVIDE" },

    // numbers
    { regex: /^[0-9]+/,                     type: "NUMBER" },

    // strings
    { regex: /^"[^"\r\n]*"/,                type: "STRING" },

    // keywords
    { regex: /^if\b/,                       type: "IF" },
    { regex: /^goto\b/,                     type: "GOTO" },
    { regex: /^new\b/,                      type: "NEW" },
    { regex: /^return\b/,                   type: "RETURN" },
    { regex: /^type\b/,                     type: "TYPE" },
    { regex: /^def\b/,                      type: "DEF" },

    // identifiers
    { regex: /^[$a-zA-Z][$a-zA-Z0-9_]*/,    type: "IDENTIFIER" },
];
lexer.filter = filter = {
    WHITESPACE: true,
    TAB: true,
    NEWLINE: true,
    COMMENT: true,
};

function Parser() {

}

Parser.prototype.parseFile = function(filename) {
    var source = fs.readFileSync(filename, 'utf8');

    this.parseSource(source);
};

Parser.prototype.parseSource = function(source) {
    lexer.setSource(source);
    this.lexemes = lexer.getLexemes();

    if (false) {
        this.lexemes.forEach(function(lexeme) {
            console.log(util.inspect(lexeme));
        });
    }
    else {
        this.currentIndex = -1;
        this.advance();
        this.parseProgram();
    }
};

/*
 *  program
 *      statements
 *
 *  statements
 *      statements statement
 *      statement
 *
 *  statement
 *      type_def
 *      func_def
 */
Parser.prototype.parseProgram = function() {
    while (this.currentLexeme && this.currentLexeme.type !== "EOF") {
        switch (this.currentLexeme.type) {
            case "TYPE":
                this.parseTypeDef();
                break;

            case "DEF":
                this.parseFunctionDef();
                break;

            default:
                this.error("Unrecognized top-level token for statement:\n" + util.inspect(this.currentLexeme));
        }
    }
};

/*
 *  type_def
 *      TYPE IDENTIFIER INDENT type_statements DEDENT
 *      TYPE IDENTIFIER LT identifiers GT INDENT type_statements DEDENT
 */
Parser.prototype.parseTypeDef = function() {
    this.assertTypeAndAdvance("TYPE");

    this.parseTypeRef();
    this.assertTypeAndAdvance("INDENT");
    this.parseTypeStatements();
    this.assertTypeAndAdvance("DEDENT");
};

/*
 *  func_def
 *      func_header INDENT body_statements DEDENT
 */
Parser.prototype.parseFunctionDef = function() {
    this.assertTypeAndAdvance("DEF");

    this.assertType("IDENTIFIER");
    this.advance();

    if (this.isType("LPAREN")) {
        this.advance();

        if (this.isType("IDENTIFIER")) {
            this.parseParameters();
        }

        this.assertTypeAndAdvance("RPAREN");
    }

    if (this.isType("ARROW")) {
        this.advance();
        this.parseTypeRef();
    }

    this.assertTypeAndAdvance("INDENT");
    this.parseBodyStatements();
    this.assertTypeAndAdvance("DEDENT");
};

Parser.prototype.parseTypeStatements = function() {
    while (this.isType("IDENTIFIER")) {
        this.assertType("IDENTIFIER");
        this.advance();

        this.assertTypeAndAdvance("COLON");

        if (this.isType("DEF")) {
            this.parseDefType();
        }
        else {
            this.parseTypeRef();
        }
    }
};

Parser.prototype.parseBodyStatements = function() {
    while (!this.isType("DEDENT") && !this.isType("EOF")) {
        this.advance();
    }
};

Parser.prototype.parseParameters = function() {
    this.parseParameter();

    while (this.isType("COMMA")) {
        // advance over ','
        this.advance();

        this.parseParameter();
    }
};

Parser.prototype.parseParameter = function() {
    this.assertType("IDENTIFIER");
    this.advance();

    this.assertTypeAndAdvance("COLON");

    this.parseTypeRef();
};

Parser.prototype.parseIdentifiers = function() {
    var identifiers = []

    if (this.isType("IDENTIFIER")) {
        identifiers.push(this.currentLexeme.text);

        // advance over identifier
        this.advance();

        while (this.isType("COMMA")) {
            // advance over ','
            this.advance();

            this.assertType("IDENTIFIER");
            identifiers.push(this.currentLexeme.text);

            // advance over identifier
            this.advance();
        }
    }

    return identifiers;
};

Parser.prototype.parseDefType = function() {
    this.assertTypeAndAdvance("DEF");

    if (this.isType("LPAREN")) {
        this.advance();
        if (this.isType("IDENTIFIER")) {
            this.parseTypeRefs();
        }
        this.assertTypeAndAdvance("RPAREN");
    }
    if (this.isType("ARROW")) {
        this.advance();
        this.parseTypeRef();
    }
};

Parser.prototype.parseTypeRefs = function() {
    this.parseTypeRef();

    while (this.isType("COMMA")) {
        // advance over ','
        this.advance();
        this.parseTypeRef();
    }
};

Parser.prototype.parseTypeRef = function() {
    this.assertType("IDENTIFIER");
    this.advance();

    if (this.isType("LT")) {
        // advance over '<'
        this.advance();

        this.parseIdentifiers();

        this.assertTypeAndAdvance("GT");
    }
};

// helper methods

Parser.prototype.assertType = function(type) {
    if (!this.isType(type)) {
        this.error("Expected " + type + " but found " + util.inspect(this.currentLexeme));
    }
}

Parser.prototype.advance = function() {
    if (this.currentIndex < this.lexemes.length - 1) {
        this.currentIndex++;
        return this.currentLexeme = this.lexemes[this.currentIndex];
    }
    else {
        return {
            text: "<EOF>",
            type: "EOF",
            offset: -1
        }
    }
};

Parser.prototype.assertTypeAndAdvance = function(type) {
    this.assertType(type);
    this.advance();
}

Parser.prototype.isType = function(type) {
    return (this.currentLexeme && this.currentLexeme.type === type);
};

Parser.prototype.error = function(message) {
    throw new Error(message);
};

exports.Parser = Parser;
