var TAB_WIDTH = 4;

function Lexer() {
    this.tokens = [];
    this.filter = {};
    this.queue = [];
    this.setSource("");
    this.currentIndent = "";
    this.indentText = "\t";
}

Lexer.prototype.setSource = function(source) {
    this.source = source;
    this.length = source.length;
    this.offset = 0;
    this.column = 1;
    this.line = 1;
};

Lexer.prototype.nextLexeme = function() {
    var match = null;

    if (this.offset < this.length) {
        for (var i = 0; i < this.tokens.length; i++) {
            var token = this.tokens[i];
            var regex = token.regex;

            regex.lastIndex = 0;

            var matches = regex.exec(this.source);

            if (matches) {
                match = this.createLexeme(matches[0], token.type);
                break;
            }
        }

        // if we matched nothing, then match the current character as an error token
        if (match == null) {
            match = this.createLexeme(this.source.substr(0, 1), "ERROR");
        }

        // adjust current offset
        this.offset += match.text.length;

        // adjust column
        // NOTE: TAB and NEWLINE shoudln't be here. Consider adding a method to the tokens
        if (match.type === "TAB") {
            // determine how far we are into the first tab
            var adjust = ((this.column - 1) % TAB_WIDTH);

            // add tabs to column, removing any characters that are part of the first tab
            this.column += (TAB_WIDTH * match.text.length - adjust);
        }
        else if (match.type === "NEWLINE") {
            this.line++;
            this.column = 1;
        }
        else {
            this.column += match.text.length;
        }

        // trim match off front of string
        this.source = this.source.substr(match.text.length);
    }
    else {
        match = this.createLexeme(null, "EOF");
    }

    return match;
};

Lexer.prototype.advance = function() {
    var result;

    do {
        if (this.queue.length > 0) {
            result = this.queue.shift();
        }
        else {
            //result = this.nextLexeme();
            result = this.advanceWithIndents();
        }
    } while (result.type != "EOF" && filter.hasOwnProperty(result.type))

    return result;
};

Lexer.prototype.advanceWithIndents = function() {
    var candidate = this.nextLexeme();

    if (candidate.type === "NEWLINE" || candidate.type === "EOF") {
        while (candidate.type === "NEWLINE") {
            candidate = this.nextLexeme();
        }

        // TODO: handle mix of tabs and whitespace?
        var text = (candidate.type === "TAB") ? candidate.text : "";
        var count = (text.length - this.currentIndent.length) / this.indentText.length;

        if (count != 0) {
            var start = candidate.offset;
            var type;

            // determine virtual token type
            if (count < 0) {
                count = -count;
                type = "DEDENT";
            }
            else {
                type = "INDENT";
            }

            // enqueue virtual tokens
            for (var i = 0; i < count; i++) {
                this.queue.push(this.createLexeme("", type));
            }

            // save reference to current indent
            this.currentIndent = text;

            // dequeue first virtual token and use as our result
            this.queue.push(candidate);
            candidate = this.queue.shift();
        }
    }

    return candidate;
};

Lexer.prototype.createLexeme = function(text, type) {
    return {
        text: text,
        type: type,
        line: this.line,
        column: this.column,
        offset: this.offset
    };
}

Lexer.prototype.getLexemes = function() {
    var lexemes = [];

    do {
        var lexeme = this.advance();

        if (lexeme !== null) {
            lexemes.push(lexeme);
        }
    } while (lexeme && lexeme.type !== "EOF");

    return lexemes;
}

exports.Lexer = Lexer;
