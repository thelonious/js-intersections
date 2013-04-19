#!/usr/bin/env node

var Parser = require("./lib/facvm-parser").Parser;

if (process.argv.length > 2) {
    for (var i = 2; i < process.argv.length; i++) {
        var filename = process.argv[i];
        var parser = new Parser();

        parser.parseFile(filename);
    };
} else {
    console.log("usage: %s <facvm-file>", process.argv[1]);
    process.exit(1);
}
