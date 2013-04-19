var tokens = [
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

var filter = {
    WHITESPACE: true,
    TAB: true,
    NEWLINE: true,
    COMMENT: true,
};

var TAB_WIDTH = 4;

exports.getLexemes = function(source) {
    var lexemes = [];
    var offset = 0,
        column = 1,
        line = 1,
        length = source.length;

    while (offset < length) {
        var match = null;

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var regex = token.regex;

            regex.lastIndex = 0;

            var matches = regex.exec(source);

            if (matches) {
                match = {
                    text: matches[0],
                    type: token.type,
                    line: line,
                    column: column,
                    offset: offset
                };

                // adjust current offset
                offset += match.text.length;

                // adjust column - this should take spaces into account
                column += (match.type === "TAB") ? TAB_WIDTH * match.text.length : match.text.length;

                // trim match off front of string
                source = source.substr(match.text.length);

                // we're done
                break;
            }
        }

        if (match) {
            if (!filter.hasOwnProperty(match.type)) {
                lexemes.push(match);
            }
            else if (match.type === "NEWLINE") {
                line++;
                column = 1;
            }
        }
        else {
            lexemes.push({
                text: source.substr(0, 1),
                token: { type: "ERROR" },
                line: line,
                column: column,
                offset: offset
            });
            break;
        }
    }

    return lexemes;
}
