var lexer = require("./facvm-lexer.js"),
    util = require("util"),
    fs = require("fs");

function Parser() {

}

Parser.prototype.parseFile = function(filename) {
    var source = fs.readFileSync(filename, 'utf8');

    this.parseSource(source);
};

Parser.prototype.parseSource = function(source) {
    this.currentIndex = -1;
    this.lexemes = lexer.getLexemes(source);
    this.advance();
    this.parseProgram();
    // this.lexemes.forEach(function(lexeme) {
    //     console.log(util.inspect(lexeme));
    // });
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

    this.assertType("IDENTIFIER");
    this.advance();

};

/*
 *  func_def
 *      func_header INDENT body_statements DEDENT
 */
Parser.prototype.parseFunctionDef = function() {
    this.assertTypeAndAdvance("DEF");
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
