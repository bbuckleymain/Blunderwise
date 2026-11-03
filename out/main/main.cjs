"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/chess.js/dist/cjs/chess.js
var require_chess = __commonJS({
  "node_modules/chess.js/dist/cjs/chess.js"(exports2) {
    "use strict";
    function rootNode(comment) {
      return comment !== null ? { comment, variations: [] } : { variations: [] };
    }
    function node(move, suffix, nag, comment, variations) {
      const node2 = { move, variations };
      if (suffix) {
        node2.suffix = suffix;
      }
      if (nag) {
        node2.nag = nag;
      }
      if (comment !== null) {
        node2.comment = comment;
      }
      return node2;
    }
    function lineToTree(...nodes) {
      const [root, ...rest] = nodes;
      let parent = root;
      for (const child of rest) {
        if (child !== null) {
          parent.variations = [child, ...child.variations];
          child.variations = [];
          parent = child;
        }
      }
      return root;
    }
    function pgn(headers, game) {
      if (game.marker && game.marker.comment) {
        let node2 = game.root;
        while (true) {
          const next = node2.variations[0];
          if (!next) {
            node2.comment = game.marker.comment;
            break;
          }
          node2 = next;
        }
      }
      return {
        headers,
        root: game.root,
        result: (game.marker && game.marker.result) ?? void 0
      };
    }
    function peg$subclass(child, parent) {
      function C() {
        this.constructor = child;
      }
      C.prototype = parent.prototype;
      child.prototype = new C();
    }
    function peg$SyntaxError(message, expected, found, location) {
      var self = Error.call(this, message);
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(self, peg$SyntaxError.prototype);
      }
      self.expected = expected;
      self.found = found;
      self.location = location;
      self.name = "SyntaxError";
      return self;
    }
    peg$subclass(peg$SyntaxError, Error);
    function peg$padEnd(str, targetLength, padString) {
      padString = padString || " ";
      if (str.length > targetLength) {
        return str;
      }
      targetLength -= str.length;
      padString += padString.repeat(targetLength);
      return str + padString.slice(0, targetLength);
    }
    peg$SyntaxError.prototype.format = function(sources) {
      var str = "Error: " + this.message;
      if (this.location) {
        var src = null;
        var k;
        for (k = 0; k < sources.length; k++) {
          if (sources[k].source === this.location.source) {
            src = sources[k].text.split(/\r\n|\n|\r/g);
            break;
          }
        }
        var s = this.location.start;
        var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
        if (src) {
          var e = this.location.end;
          var filler = peg$padEnd("", offset_s.line.toString().length, " ");
          var line = src[s.line - 1];
          var last = s.line === e.line ? e.column : line.length + 1;
          var hatLen = last - s.column || 1;
          str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, " ") + peg$padEnd("", hatLen, "^");
        } else {
          str += "\n at " + loc;
        }
      }
      return str;
    };
    peg$SyntaxError.buildMessage = function(expected, found) {
      var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
          var escapedParts = expectation.parts.map(function(part) {
            return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
          });
          return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
        },
        any: function() {
          return "any character";
        },
        end: function() {
          return "end of input";
        },
        other: function(expectation) {
          return expectation.description;
        }
      };
      function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
      }
      function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
      }
      function describeExpected(expected2) {
        var descriptions = expected2.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
          for (i = 1, j = 1; i < descriptions.length; i++) {
            if (descriptions[i - 1] !== descriptions[i]) {
              descriptions[j] = descriptions[i];
              j++;
            }
          }
          descriptions.length = j;
        }
        switch (descriptions.length) {
          case 1:
            return descriptions[0];
          case 2:
            return descriptions[0] + " or " + descriptions[1];
          default:
            return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
      }
      function describeFound(found2) {
        return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
      }
      return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    function peg$parse(input, options) {
      options = options !== void 0 ? options : {};
      var peg$FAILED = {};
      var peg$source = options.grammarSource;
      var peg$startRuleFunctions = { pgn: peg$parsepgn };
      var peg$startRuleFunction = peg$parsepgn;
      var peg$c0 = "[";
      var peg$c1 = '"';
      var peg$c2 = "]";
      var peg$c3 = ".";
      var peg$c4 = "O-O-O";
      var peg$c5 = "O-O";
      var peg$c6 = "0-0-0";
      var peg$c7 = "0-0";
      var peg$c8 = "$";
      var peg$c9 = "{";
      var peg$c10 = "}";
      var peg$c11 = ";";
      var peg$c12 = "(";
      var peg$c13 = ")";
      var peg$c14 = "1-0";
      var peg$c15 = "0-1";
      var peg$c16 = "1/2-1/2";
      var peg$c17 = "*";
      var peg$r0 = /^[a-zA-Z]/;
      var peg$r1 = /^[^"]/;
      var peg$r2 = /^[0-9]/;
      var peg$r3 = /^[.]/;
      var peg$r4 = /^[a-zA-Z1-8\-=]/;
      var peg$r5 = /^[+#]/;
      var peg$r6 = /^[!?]/;
      var peg$r7 = /^[^}]/;
      var peg$r8 = /^[^\r\n]/;
      var peg$r9 = /^[ \t\r\n]/;
      var peg$e0 = peg$otherExpectation("tag pair");
      var peg$e1 = peg$literalExpectation("[", false);
      var peg$e2 = peg$literalExpectation('"', false);
      var peg$e3 = peg$literalExpectation("]", false);
      var peg$e4 = peg$otherExpectation("tag name");
      var peg$e5 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false);
      var peg$e6 = peg$otherExpectation("tag value");
      var peg$e7 = peg$classExpectation(['"'], true, false);
      var peg$e8 = peg$otherExpectation("move number");
      var peg$e9 = peg$classExpectation([["0", "9"]], false, false);
      var peg$e10 = peg$literalExpectation(".", false);
      var peg$e11 = peg$classExpectation(["."], false, false);
      var peg$e12 = peg$otherExpectation("standard algebraic notation");
      var peg$e13 = peg$literalExpectation("O-O-O", false);
      var peg$e14 = peg$literalExpectation("O-O", false);
      var peg$e15 = peg$literalExpectation("0-0-0", false);
      var peg$e16 = peg$literalExpectation("0-0", false);
      var peg$e17 = peg$classExpectation([["a", "z"], ["A", "Z"], ["1", "8"], "-", "="], false, false);
      var peg$e18 = peg$classExpectation(["+", "#"], false, false);
      var peg$e19 = peg$otherExpectation("suffix annotation");
      var peg$e20 = peg$classExpectation(["!", "?"], false, false);
      var peg$e21 = peg$otherExpectation("NAG");
      var peg$e22 = peg$literalExpectation("$", false);
      var peg$e23 = peg$otherExpectation("brace comment");
      var peg$e24 = peg$literalExpectation("{", false);
      var peg$e25 = peg$classExpectation(["}"], true, false);
      var peg$e26 = peg$literalExpectation("}", false);
      var peg$e27 = peg$otherExpectation("rest of line comment");
      var peg$e28 = peg$literalExpectation(";", false);
      var peg$e29 = peg$classExpectation(["\r", "\n"], true, false);
      var peg$e30 = peg$otherExpectation("variation");
      var peg$e31 = peg$literalExpectation("(", false);
      var peg$e32 = peg$literalExpectation(")", false);
      var peg$e33 = peg$otherExpectation("game termination marker");
      var peg$e34 = peg$literalExpectation("1-0", false);
      var peg$e35 = peg$literalExpectation("0-1", false);
      var peg$e36 = peg$literalExpectation("1/2-1/2", false);
      var peg$e37 = peg$literalExpectation("*", false);
      var peg$e38 = peg$otherExpectation("whitespace");
      var peg$e39 = peg$classExpectation([" ", "	", "\r", "\n"], false, false);
      var peg$f0 = function(headers, game) {
        return pgn(headers, game);
      };
      var peg$f1 = function(tagPairs) {
        return Object.fromEntries(tagPairs);
      };
      var peg$f2 = function(tagName, tagValue) {
        return [tagName, tagValue];
      };
      var peg$f3 = function(root, marker) {
        return { root, marker };
      };
      var peg$f4 = function(comment, moves) {
        return lineToTree(rootNode(comment), ...moves.flat());
      };
      var peg$f5 = function(san, suffix, nag, comment, variations) {
        return node(san, suffix, nag, comment, variations);
      };
      var peg$f6 = function(nag) {
        return nag;
      };
      var peg$f7 = function(comment) {
        return comment.replace(/[\r\n]+/g, " ");
      };
      var peg$f8 = function(comment) {
        return comment.trim();
      };
      var peg$f9 = function(line) {
        return line;
      };
      var peg$f10 = function(result, comment) {
        return { result, comment };
      };
      var peg$currPos = options.peg$currPos | 0;
      var peg$posDetailsCache = [{ line: 1, column: 1 }];
      var peg$maxFailPos = peg$currPos;
      var peg$maxFailExpected = options.peg$maxFailExpected || [];
      var peg$silentFails = options.peg$silentFails | 0;
      var peg$result;
      if (options.startRule) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
      function peg$literalExpectation(text, ignoreCase) {
        return { type: "literal", text, ignoreCase };
      }
      function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts, inverted, ignoreCase };
      }
      function peg$endExpectation() {
        return { type: "end" };
      }
      function peg$otherExpectation(description) {
        return { type: "other", description };
      }
      function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
          return details;
        } else {
          if (pos >= peg$posDetailsCache.length) {
            p = peg$posDetailsCache.length - 1;
          } else {
            p = pos;
            while (!peg$posDetailsCache[--p]) {
            }
          }
          details = peg$posDetailsCache[p];
          details = {
            line: details.line,
            column: details.column
          };
          while (p < pos) {
            if (input.charCodeAt(p) === 10) {
              details.line++;
              details.column = 1;
            } else {
              details.column++;
            }
            p++;
          }
          peg$posDetailsCache[pos] = details;
          return details;
        }
      }
      function peg$computeLocation(startPos, endPos, offset) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        var res = {
          source: peg$source,
          start: {
            offset: startPos,
            line: startPosDetails.line,
            column: startPosDetails.column
          },
          end: {
            offset: endPos,
            line: endPosDetails.line,
            column: endPosDetails.column
          }
        };
        return res;
      }
      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
          return;
        }
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
      }
      function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(
          peg$SyntaxError.buildMessage(expected, found),
          expected,
          found,
          location
        );
      }
      function peg$parsepgn() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parsetagPairSection();
        s2 = peg$parsemoveTextSection();
        s0 = peg$f0(s1, s2);
        return s0;
      }
      function peg$parsetagPairSection() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsetagPair();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsetagPair();
        }
        s2 = peg$parse_();
        s0 = peg$f1(s1);
        return s0;
      }
      function peg$parsetagPair() {
        var s0, s2, s4, s6, s7, s8, s10;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c0;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e1);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$parse_();
          s4 = peg$parsetagName();
          if (s4 !== peg$FAILED) {
            peg$parse_();
            if (input.charCodeAt(peg$currPos) === 34) {
              s6 = peg$c1;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e2);
              }
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parsetagValue();
              if (input.charCodeAt(peg$currPos) === 34) {
                s8 = peg$c1;
                peg$currPos++;
              } else {
                s8 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e2);
                }
              }
              if (s8 !== peg$FAILED) {
                peg$parse_();
                if (input.charCodeAt(peg$currPos) === 93) {
                  s10 = peg$c2;
                  peg$currPos++;
                } else {
                  s10 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e3);
                  }
                }
                if (s10 !== peg$FAILED) {
                  s0 = peg$f2(s4, s7);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e0);
          }
        }
        return s0;
      }
      function peg$parsetagName() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r0.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e5);
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = input.charAt(peg$currPos);
            if (peg$r0.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e5);
              }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        return s0;
      }
      function peg$parsetagValue() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r1.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e7);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input.charAt(peg$currPos);
          if (peg$r1.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e7);
            }
          }
        }
        s0 = input.substring(s0, peg$currPos);
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e6);
        }
        return s0;
      }
      function peg$parsemoveTextSection() {
        var s0, s1, s3;
        s0 = peg$currPos;
        s1 = peg$parseline();
        peg$parse_();
        s3 = peg$parsegameTerminationMarker();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$parse_();
        s0 = peg$f3(s1, s3);
        return s0;
      }
      function peg$parseline() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parsecomment();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        s2 = [];
        s3 = peg$parsemove();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsemove();
        }
        s0 = peg$f4(s1, s2);
        return s0;
      }
      function peg$parsemove() {
        var s0, s4, s5, s6, s7, s8, s9, s10;
        s0 = peg$currPos;
        peg$parse_();
        peg$parsemoveNumber();
        peg$parse_();
        s4 = peg$parsesan();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesuffixAnnotation();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          s6 = [];
          s7 = peg$parsenag();
          while (s7 !== peg$FAILED) {
            s6.push(s7);
            s7 = peg$parsenag();
          }
          s7 = peg$parse_();
          s8 = peg$parsecomment();
          if (s8 === peg$FAILED) {
            s8 = null;
          }
          s9 = [];
          s10 = peg$parsevariation();
          while (s10 !== peg$FAILED) {
            s9.push(s10);
            s10 = peg$parsevariation();
          }
          s0 = peg$f5(s4, s5, s6, s8, s9);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parsemoveNumber() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r2.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e9);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input.charAt(peg$currPos);
          if (peg$r2.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
        }
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c3;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e10);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          s4 = [];
          s5 = input.charAt(peg$currPos);
          if (peg$r3.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e11);
            }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = input.charAt(peg$currPos);
            if (peg$r3.test(s5)) {
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e11);
              }
            }
          }
          s1 = [s1, s2, s3, s4];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e8);
          }
        }
        return s0;
      }
      function peg$parsesan() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 5) === peg$c4) {
          s2 = peg$c4;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e13);
          }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c5) {
            s2 = peg$c5;
            peg$currPos += 3;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e14);
            }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c6) {
              s2 = peg$c6;
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e15);
              }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 3) === peg$c7) {
                s2 = peg$c7;
                peg$currPos += 3;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e16);
                }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                s3 = input.charAt(peg$currPos);
                if (peg$r0.test(s3)) {
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e5);
                  }
                }
                if (s3 !== peg$FAILED) {
                  s4 = [];
                  s5 = input.charAt(peg$currPos);
                  if (peg$r4.test(s5)) {
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e17);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    while (s5 !== peg$FAILED) {
                      s4.push(s5);
                      s5 = input.charAt(peg$currPos);
                      if (peg$r4.test(s5)) {
                        peg$currPos++;
                      } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$e17);
                        }
                      }
                    }
                  } else {
                    s4 = peg$FAILED;
                  }
                  if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = input.charAt(peg$currPos);
          if (peg$r5.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e18);
            }
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e12);
          }
        }
        return s0;
      }
      function peg$parsesuffixAnnotation() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r6.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e20);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (s1.length >= 2) {
            s2 = peg$FAILED;
          } else {
            s2 = input.charAt(peg$currPos);
            if (peg$r6.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e20);
              }
            }
          }
        }
        if (s1.length < 1) {
          peg$currPos = s0;
          s0 = peg$FAILED;
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e19);
          }
        }
        return s0;
      }
      function peg$parsenag() {
        var s0, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 36) {
          s2 = peg$c8;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e22);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          s5 = input.charAt(peg$currPos);
          if (peg$r2.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = input.charAt(peg$currPos);
              if (peg$r2.test(s5)) {
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e9);
                }
              }
            }
          } else {
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s3 = input.substring(s3, peg$currPos);
          } else {
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f6(s3);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e21);
          }
        }
        return s0;
      }
      function peg$parsecomment() {
        var s0;
        s0 = peg$parsebraceComment();
        if (s0 === peg$FAILED) {
          s0 = peg$parserestOfLineComment();
        }
        return s0;
      }
      function peg$parsebraceComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e24);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input.charAt(peg$currPos);
          if (peg$r7.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e25);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input.charAt(peg$currPos);
            if (peg$r7.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e25);
              }
            }
          }
          s2 = input.substring(s2, peg$currPos);
          if (input.charCodeAt(peg$currPos) === 125) {
            s3 = peg$c10;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e26);
            }
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f7(s2);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e23);
          }
        }
        return s0;
      }
      function peg$parserestOfLineComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 59) {
          s1 = peg$c11;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e28);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input.charAt(peg$currPos);
          if (peg$r8.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e29);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input.charAt(peg$currPos);
            if (peg$r8.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e29);
              }
            }
          }
          s2 = input.substring(s2, peg$currPos);
          s0 = peg$f8(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e27);
          }
        }
        return s0;
      }
      function peg$parsevariation() {
        var s0, s2, s3, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c12;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e31);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseline();
          if (s3 !== peg$FAILED) {
            peg$parse_();
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c13;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e32);
              }
            }
            if (s5 !== peg$FAILED) {
              s0 = peg$f9(s3);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e30);
          }
        }
        return s0;
      }
      function peg$parsegameTerminationMarker() {
        var s0, s1, s3;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 3) === peg$c14) {
          s1 = peg$c14;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e34);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c15) {
            s1 = peg$c15;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e35);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 7) === peg$c16) {
              s1 = peg$c16;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e36);
              }
            }
            if (s1 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 42) {
                s1 = peg$c17;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e37);
                }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$parse_();
          s3 = peg$parsecomment();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s0 = peg$f10(s1, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e33);
          }
        }
        return s0;
      }
      function peg$parse_() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        s1 = input.charAt(peg$currPos);
        if (peg$r9.test(s1)) {
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e39);
          }
        }
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = input.charAt(peg$currPos);
          if (peg$r9.test(s1)) {
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e39);
            }
          }
        }
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
        return s0;
      }
      peg$result = peg$startRuleFunction();
      if (options.peg$library) {
        return (
          /** @type {any} */
          {
            peg$result,
            peg$currPos,
            peg$FAILED,
            peg$maxFailExpected,
            peg$maxFailPos
          }
        );
      }
      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(
          peg$maxFailExpected,
          peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
          peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
        );
      }
    }
    var MASK64 = 0xffffffffffffffffn;
    function rotl(x, k) {
      return (x << k | x >> 64n - k) & 0xffffffffffffffffn;
    }
    function wrappingMul(x, y) {
      return x * y & MASK64;
    }
    function xoroshiro128(state) {
      return function() {
        let s0 = BigInt(state & MASK64);
        let s1 = BigInt(state >> 64n & MASK64);
        const result = wrappingMul(rotl(wrappingMul(s0, 5n), 7n), 9n);
        s1 ^= s0;
        s0 = (rotl(s0, 24n) ^ s1 ^ s1 << 16n) & MASK64;
        s1 = rotl(s1, 37n);
        state = s1 << 64n | s0;
        return result;
      };
    }
    var rand = xoroshiro128(0xa187eb39cdcaed8f31c4b365b102e01en);
    var PIECE_KEYS = Array.from({ length: 2 }, () => Array.from({ length: 6 }, () => Array.from({ length: 128 }, () => rand())));
    var EP_KEYS = Array.from({ length: 8 }, () => rand());
    var CASTLING_KEYS = Array.from({ length: 16 }, () => rand());
    var SIDE_KEY = rand();
    var WHITE = "w";
    var BLACK = "b";
    var PAWN = "p";
    var KNIGHT = "n";
    var BISHOP = "b";
    var ROOK = "r";
    var QUEEN = "q";
    var KING = "k";
    var DEFAULT_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    var Move = class {
      color;
      from;
      to;
      piece;
      captured;
      promotion;
      /**
       * @deprecated This field is deprecated and will be removed in version 2.0.0.
       * Please use move descriptor functions instead: `isCapture`, `isPromotion`,
       * `isEnPassant`, `isKingsideCastle`, `isQueensideCastle`, `isCastle`, and
       * `isBigPawn`
       */
      flags;
      san;
      lan;
      before;
      after;
      constructor(chess, internal) {
        const { color, piece, from, to, flags, captured, promotion } = internal;
        const fromAlgebraic = algebraic(from);
        const toAlgebraic = algebraic(to);
        this.color = color;
        this.piece = piece;
        this.from = fromAlgebraic;
        this.to = toAlgebraic;
        this.san = chess["_moveToSan"](internal, chess["_moves"]({ legal: true }));
        this.lan = fromAlgebraic + toAlgebraic;
        this.before = chess.fen();
        chess["_makeMove"](internal);
        this.after = chess.fen();
        chess["_undoMove"]();
        this.flags = "";
        for (const flag in BITS) {
          if (BITS[flag] & flags) {
            this.flags += FLAGS[flag];
          }
        }
        if (captured) {
          this.captured = captured;
        }
        if (promotion) {
          this.promotion = promotion;
          this.lan += promotion;
        }
      }
      isCapture() {
        return this.flags.indexOf(FLAGS["CAPTURE"]) > -1;
      }
      isPromotion() {
        return this.flags.indexOf(FLAGS["PROMOTION"]) > -1;
      }
      isEnPassant() {
        return this.flags.indexOf(FLAGS["EP_CAPTURE"]) > -1;
      }
      isKingsideCastle() {
        return this.flags.indexOf(FLAGS["KSIDE_CASTLE"]) > -1;
      }
      isQueensideCastle() {
        return this.flags.indexOf(FLAGS["QSIDE_CASTLE"]) > -1;
      }
      isBigPawn() {
        return this.flags.indexOf(FLAGS["BIG_PAWN"]) > -1;
      }
    };
    var EMPTY = -1;
    var FLAGS = {
      NORMAL: "n",
      CAPTURE: "c",
      BIG_PAWN: "b",
      EP_CAPTURE: "e",
      PROMOTION: "p",
      KSIDE_CASTLE: "k",
      QSIDE_CASTLE: "q",
      NULL_MOVE: "-"
    };
    var SQUARES = [
      "a8",
      "b8",
      "c8",
      "d8",
      "e8",
      "f8",
      "g8",
      "h8",
      "a7",
      "b7",
      "c7",
      "d7",
      "e7",
      "f7",
      "g7",
      "h7",
      "a6",
      "b6",
      "c6",
      "d6",
      "e6",
      "f6",
      "g6",
      "h6",
      "a5",
      "b5",
      "c5",
      "d5",
      "e5",
      "f5",
      "g5",
      "h5",
      "a4",
      "b4",
      "c4",
      "d4",
      "e4",
      "f4",
      "g4",
      "h4",
      "a3",
      "b3",
      "c3",
      "d3",
      "e3",
      "f3",
      "g3",
      "h3",
      "a2",
      "b2",
      "c2",
      "d2",
      "e2",
      "f2",
      "g2",
      "h2",
      "a1",
      "b1",
      "c1",
      "d1",
      "e1",
      "f1",
      "g1",
      "h1"
    ];
    var BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64,
      NULL_MOVE: 128
    };
    var SEVEN_TAG_ROSTER = {
      Event: "?",
      Site: "?",
      Date: "????.??.??",
      Round: "?",
      White: "?",
      Black: "?",
      Result: "*"
    };
    var SUPLEMENTAL_TAGS = {
      WhiteTitle: null,
      BlackTitle: null,
      WhiteElo: null,
      BlackElo: null,
      WhiteUSCF: null,
      BlackUSCF: null,
      WhiteNA: null,
      BlackNA: null,
      WhiteType: null,
      BlackType: null,
      EventDate: null,
      EventSponsor: null,
      Section: null,
      Stage: null,
      Board: null,
      Opening: null,
      Variation: null,
      SubVariation: null,
      ECO: null,
      NIC: null,
      Time: null,
      UTCTime: null,
      UTCDate: null,
      TimeControl: null,
      SetUp: null,
      FEN: null,
      Termination: null,
      Annotator: null,
      Mode: null,
      PlyCount: null
    };
    var HEADER_TEMPLATE = {
      ...SEVEN_TAG_ROSTER,
      ...SUPLEMENTAL_TAGS
    };
    var Ox88 = {
      a8: 0,
      b8: 1,
      c8: 2,
      d8: 3,
      e8: 4,
      f8: 5,
      g8: 6,
      h8: 7,
      a7: 16,
      b7: 17,
      c7: 18,
      d7: 19,
      e7: 20,
      f7: 21,
      g7: 22,
      h7: 23,
      a6: 32,
      b6: 33,
      c6: 34,
      d6: 35,
      e6: 36,
      f6: 37,
      g6: 38,
      h6: 39,
      a5: 48,
      b5: 49,
      c5: 50,
      d5: 51,
      e5: 52,
      f5: 53,
      g5: 54,
      h5: 55,
      a4: 64,
      b4: 65,
      c4: 66,
      d4: 67,
      e4: 68,
      f4: 69,
      g4: 70,
      h4: 71,
      a3: 80,
      b3: 81,
      c3: 82,
      d3: 83,
      e3: 84,
      f3: 85,
      g3: 86,
      h3: 87,
      a2: 96,
      b2: 97,
      c2: 98,
      d2: 99,
      e2: 100,
      f2: 101,
      g2: 102,
      h2: 103,
      a1: 112,
      b1: 113,
      c1: 114,
      d1: 115,
      e1: 116,
      f1: 117,
      g1: 118,
      h1: 119
    };
    var PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15]
    };
    var PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1]
    };
    var ATTACKS = [
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      24,
      24,
      24,
      24,
      24,
      56,
      0,
      56,
      24,
      24,
      24,
      24,
      24,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20
    ];
    var RAYS = [
      17,
      0,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      16,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      16,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      16,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      -16,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      -16,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      -16,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      0,
      -17
    ];
    var PIECE_MASKS = { p: 1, n: 2, b: 4, r: 8, q: 16, k: 32 };
    var SYMBOLS = "pnbrqkPNBRQK";
    var PROMOTIONS = [KNIGHT, BISHOP, ROOK, QUEEN];
    var RANK_1 = 7;
    var RANK_2 = 6;
    var RANK_7 = 1;
    var RANK_8 = 0;
    var SIDES = {
      [KING]: BITS.KSIDE_CASTLE,
      [QUEEN]: BITS.QSIDE_CASTLE
    };
    var ROOKS = {
      w: [
        { square: Ox88.a1, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h1, flag: BITS.KSIDE_CASTLE }
      ],
      b: [
        { square: Ox88.a8, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h8, flag: BITS.KSIDE_CASTLE }
      ]
    };
    var SECOND_RANK = { b: RANK_7, w: RANK_2 };
    var SAN_NULLMOVE = "--";
    function rank(square) {
      return square >> 4;
    }
    function file(square) {
      return square & 15;
    }
    function isDigit(c) {
      return "0123456789".indexOf(c) !== -1;
    }
    function algebraic(square) {
      const f = file(square);
      const r = rank(square);
      return "abcdefgh".substring(f, f + 1) + "87654321".substring(r, r + 1);
    }
    function swapColor(color) {
      return color === WHITE ? BLACK : WHITE;
    }
    function validateFen(fen) {
      const tokens = fen.split(/\s+/);
      if (tokens.length !== 6) {
        return {
          ok: false,
          error: "Invalid FEN: must contain six space-delimited fields"
        };
      }
      const moveNumber = parseInt(tokens[5], 10);
      if (isNaN(moveNumber) || moveNumber <= 0) {
        return {
          ok: false,
          error: "Invalid FEN: move number must be a positive integer"
        };
      }
      const halfMoves = parseInt(tokens[4], 10);
      if (isNaN(halfMoves) || halfMoves < 0) {
        return {
          ok: false,
          error: "Invalid FEN: half move counter number must be a non-negative integer"
        };
      }
      if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
        return { ok: false, error: "Invalid FEN: en-passant square is invalid" };
      }
      if (/[^kKqQ-]/.test(tokens[2])) {
        return { ok: false, error: "Invalid FEN: castling availability is invalid" };
      }
      if (!/^(w|b)$/.test(tokens[1])) {
        return { ok: false, error: "Invalid FEN: side-to-move is invalid" };
      }
      const rows = tokens[0].split("/");
      if (rows.length !== 8) {
        return {
          ok: false,
          error: "Invalid FEN: piece data does not contain 8 '/'-delimited rows"
        };
      }
      for (let i = 0; i < rows.length; i++) {
        let sumFields = 0;
        let previousWasNumber = false;
        for (let k = 0; k < rows[i].length; k++) {
          if (isDigit(rows[i][k])) {
            if (previousWasNumber) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (consecutive number)"
              };
            }
            sumFields += parseInt(rows[i][k], 10);
            previousWasNumber = true;
          } else {
            if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (invalid piece)"
              };
            }
            sumFields += 1;
            previousWasNumber = false;
          }
        }
        if (sumFields !== 8) {
          return {
            ok: false,
            error: "Invalid FEN: piece data is invalid (too many squares in rank)"
          };
        }
      }
      if (tokens[3][1] == "3" && tokens[1] == "w" || tokens[3][1] == "6" && tokens[1] == "b") {
        return { ok: false, error: "Invalid FEN: illegal en-passant square" };
      }
      const kings = [
        { color: "white", regex: /K/g },
        { color: "black", regex: /k/g }
      ];
      for (const { color, regex } of kings) {
        if (!regex.test(tokens[0])) {
          return { ok: false, error: `Invalid FEN: missing ${color} king` };
        }
        if ((tokens[0].match(regex) || []).length > 1) {
          return { ok: false, error: `Invalid FEN: too many ${color} kings` };
        }
      }
      if (Array.from(rows[0] + rows[7]).some((char) => char.toUpperCase() === "P")) {
        return {
          ok: false,
          error: "Invalid FEN: some pawns are on the edge rows"
        };
      }
      return { ok: true };
    }
    function getDisambiguator(move, moves) {
      const from = move.from;
      const to = move.to;
      const piece = move.piece;
      let ambiguities = 0;
      let sameRank = 0;
      let sameFile = 0;
      for (let i = 0, len = moves.length; i < len; i++) {
        const ambigFrom = moves[i].from;
        const ambigTo = moves[i].to;
        const ambigPiece = moves[i].piece;
        if (piece === ambigPiece && from !== ambigFrom && to === ambigTo) {
          ambiguities++;
          if (rank(from) === rank(ambigFrom)) {
            sameRank++;
          }
          if (file(from) === file(ambigFrom)) {
            sameFile++;
          }
        }
      }
      if (ambiguities > 0) {
        if (sameRank > 0 && sameFile > 0) {
          return algebraic(from);
        } else if (sameFile > 0) {
          return algebraic(from).charAt(1);
        } else {
          return algebraic(from).charAt(0);
        }
      }
      return "";
    }
    function addMove(moves, color, from, to, piece, captured = void 0, flags = BITS.NORMAL) {
      const r = rank(to);
      if (piece === PAWN && (r === RANK_1 || r === RANK_8)) {
        for (let i = 0; i < PROMOTIONS.length; i++) {
          const promotion = PROMOTIONS[i];
          moves.push({
            color,
            from,
            to,
            piece,
            captured,
            promotion,
            flags: flags | BITS.PROMOTION
          });
        }
      } else {
        moves.push({
          color,
          from,
          to,
          piece,
          captured,
          flags
        });
      }
    }
    function inferPieceType(san) {
      let pieceType = san.charAt(0);
      if (pieceType >= "a" && pieceType <= "h") {
        const matches = san.match(/[a-h]\d.*[a-h]\d/);
        if (matches) {
          return void 0;
        }
        return PAWN;
      }
      pieceType = pieceType.toLowerCase();
      if (pieceType === "o") {
        return KING;
      }
      return pieceType;
    }
    function strippedSan(move) {
      return move.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
    }
    var Chess6 = class {
      _board = new Array(128);
      _turn = WHITE;
      _header = {};
      _kings = { w: EMPTY, b: EMPTY };
      _epSquare = -1;
      _halfMoves = 0;
      _moveNumber = 0;
      _history = [];
      _comments = {};
      _castling = { w: 0, b: 0 };
      _hash = 0n;
      // tracks number of times a position has been seen for repetition checking
      _positionCount = /* @__PURE__ */ new Map();
      constructor(fen = DEFAULT_POSITION, { skipValidation = false } = {}) {
        this.load(fen, { skipValidation });
      }
      clear({ preserveHeaders = false } = {}) {
        this._board = new Array(128);
        this._kings = { w: EMPTY, b: EMPTY };
        this._turn = WHITE;
        this._castling = { w: 0, b: 0 };
        this._epSquare = EMPTY;
        this._halfMoves = 0;
        this._moveNumber = 1;
        this._history = [];
        this._comments = {};
        this._header = preserveHeaders ? this._header : { ...HEADER_TEMPLATE };
        this._hash = this._computeHash();
        this._positionCount = /* @__PURE__ */ new Map();
        this._header["SetUp"] = null;
        this._header["FEN"] = null;
      }
      load(fen, { skipValidation = false, preserveHeaders = false } = {}) {
        let tokens = fen.split(/\s+/);
        if (tokens.length >= 2 && tokens.length < 6) {
          const adjustments = ["-", "-", "0", "1"];
          fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(" ");
        }
        tokens = fen.split(/\s+/);
        if (!skipValidation) {
          const { ok, error } = validateFen(fen);
          if (!ok) {
            throw new Error(error);
          }
        }
        const position = tokens[0];
        let square = 0;
        this.clear({ preserveHeaders });
        for (let i = 0; i < position.length; i++) {
          const piece = position.charAt(i);
          if (piece === "/") {
            square += 8;
          } else if (isDigit(piece)) {
            square += parseInt(piece, 10);
          } else {
            const color = piece < "a" ? WHITE : BLACK;
            this._put({ type: piece.toLowerCase(), color }, algebraic(square));
            square++;
          }
        }
        this._turn = tokens[1];
        if (tokens[2].indexOf("K") > -1) {
          this._castling.w |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("Q") > -1) {
          this._castling.w |= BITS.QSIDE_CASTLE;
        }
        if (tokens[2].indexOf("k") > -1) {
          this._castling.b |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("q") > -1) {
          this._castling.b |= BITS.QSIDE_CASTLE;
        }
        this._epSquare = tokens[3] === "-" ? EMPTY : Ox88[tokens[3]];
        this._halfMoves = parseInt(tokens[4], 10);
        this._moveNumber = parseInt(tokens[5], 10);
        this._hash = this._computeHash();
        this._updateSetup(fen);
        this._incPositionCount();
      }
      fen({ forceEnpassantSquare = false } = {}) {
        let empty = 0;
        let fen = "";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i]) {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            const { color, type: piece } = this._board[i];
            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
          } else {
            empty++;
          }
          if (i + 1 & 136) {
            if (empty > 0) {
              fen += empty;
            }
            if (i !== Ox88.h1) {
              fen += "/";
            }
            empty = 0;
            i += 8;
          }
        }
        let castling = "";
        if (this._castling[WHITE] & BITS.KSIDE_CASTLE) {
          castling += "K";
        }
        if (this._castling[WHITE] & BITS.QSIDE_CASTLE) {
          castling += "Q";
        }
        if (this._castling[BLACK] & BITS.KSIDE_CASTLE) {
          castling += "k";
        }
        if (this._castling[BLACK] & BITS.QSIDE_CASTLE) {
          castling += "q";
        }
        castling = castling || "-";
        let epSquare = "-";
        if (this._epSquare !== EMPTY) {
          if (forceEnpassantSquare) {
            epSquare = algebraic(this._epSquare);
          } else {
            const bigPawnSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
            const squares = [bigPawnSquare + 1, bigPawnSquare - 1];
            for (const square of squares) {
              if (square & 136) {
                continue;
              }
              const color = this._turn;
              if (this._board[square]?.color === color && this._board[square]?.type === PAWN) {
                this._makeMove({
                  color,
                  from: square,
                  to: this._epSquare,
                  piece: PAWN,
                  captured: PAWN,
                  flags: BITS.EP_CAPTURE
                });
                const isLegal = !this._isKingAttacked(color);
                this._undoMove();
                if (isLegal) {
                  epSquare = algebraic(this._epSquare);
                  break;
                }
              }
            }
          }
        }
        return [
          fen,
          this._turn,
          castling,
          epSquare,
          this._halfMoves,
          this._moveNumber
        ].join(" ");
      }
      _pieceKey(i) {
        if (!this._board[i]) {
          return 0n;
        }
        const { color, type } = this._board[i];
        const colorIndex = {
          w: 0,
          b: 1
        }[color];
        const typeIndex = {
          p: 0,
          n: 1,
          b: 2,
          r: 3,
          q: 4,
          k: 5
        }[type];
        return PIECE_KEYS[colorIndex][typeIndex][i];
      }
      _epKey() {
        return this._epSquare === EMPTY ? 0n : EP_KEYS[this._epSquare & 7];
      }
      _castlingKey() {
        const index = this._castling.w >> 5 | this._castling.b >> 3;
        return CASTLING_KEYS[index];
      }
      _computeHash() {
        let hash = 0n;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i]) {
            hash ^= this._pieceKey(i);
          }
        }
        hash ^= this._epKey();
        hash ^= this._castlingKey();
        if (this._turn === "b") {
          hash ^= SIDE_KEY;
        }
        return hash;
      }
      /*
       * Called when the initial board setup is changed with put() or remove().
       * modifies the SetUp and FEN properties of the header object. If the FEN
       * is equal to the default position, the SetUp and FEN are deleted the setup
       * is only updated if history.length is zero, ie moves haven't been made.
       */
      _updateSetup(fen) {
        if (this._history.length > 0)
          return;
        if (fen !== DEFAULT_POSITION) {
          this._header["SetUp"] = "1";
          this._header["FEN"] = fen;
        } else {
          this._header["SetUp"] = null;
          this._header["FEN"] = null;
        }
      }
      reset() {
        this.load(DEFAULT_POSITION);
      }
      get(square) {
        return this._board[Ox88[square]];
      }
      findPiece(piece) {
        const squares = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (!this._board[i] || this._board[i]?.color !== piece.color) {
            continue;
          }
          if (this._board[i].color === piece.color && this._board[i].type === piece.type) {
            squares.push(algebraic(i));
          }
        }
        return squares;
      }
      put({ type, color }, square) {
        if (this._put({ type, color }, square)) {
          this._updateCastlingRights();
          this._updateEnPassantSquare();
          this._updateSetup(this.fen());
          return true;
        }
        return false;
      }
      _set(sq, piece) {
        this._hash ^= this._pieceKey(sq);
        this._board[sq] = piece;
        this._hash ^= this._pieceKey(sq);
      }
      _put({ type, color }, square) {
        if (SYMBOLS.indexOf(type.toLowerCase()) === -1) {
          return false;
        }
        if (!(square in Ox88)) {
          return false;
        }
        const sq = Ox88[square];
        if (type == KING && !(this._kings[color] == EMPTY || this._kings[color] == sq)) {
          return false;
        }
        const currentPieceOnSquare = this._board[sq];
        if (currentPieceOnSquare && currentPieceOnSquare.type === KING) {
          this._kings[currentPieceOnSquare.color] = EMPTY;
        }
        this._set(sq, { type, color });
        if (type === KING) {
          this._kings[color] = sq;
        }
        return true;
      }
      _clear(sq) {
        this._hash ^= this._pieceKey(sq);
        delete this._board[sq];
      }
      remove(square) {
        const piece = this.get(square);
        this._clear(Ox88[square]);
        if (piece && piece.type === KING) {
          this._kings[piece.color] = EMPTY;
        }
        this._updateCastlingRights();
        this._updateEnPassantSquare();
        this._updateSetup(this.fen());
        return piece;
      }
      _updateCastlingRights() {
        this._hash ^= this._castlingKey();
        const whiteKingInPlace = this._board[Ox88.e1]?.type === KING && this._board[Ox88.e1]?.color === WHITE;
        const blackKingInPlace = this._board[Ox88.e8]?.type === KING && this._board[Ox88.e8]?.color === BLACK;
        if (!whiteKingInPlace || this._board[Ox88.a1]?.type !== ROOK || this._board[Ox88.a1]?.color !== WHITE) {
          this._castling.w &= -65;
        }
        if (!whiteKingInPlace || this._board[Ox88.h1]?.type !== ROOK || this._board[Ox88.h1]?.color !== WHITE) {
          this._castling.w &= -33;
        }
        if (!blackKingInPlace || this._board[Ox88.a8]?.type !== ROOK || this._board[Ox88.a8]?.color !== BLACK) {
          this._castling.b &= -65;
        }
        if (!blackKingInPlace || this._board[Ox88.h8]?.type !== ROOK || this._board[Ox88.h8]?.color !== BLACK) {
          this._castling.b &= -33;
        }
        this._hash ^= this._castlingKey();
      }
      _updateEnPassantSquare() {
        if (this._epSquare === EMPTY) {
          return;
        }
        const startSquare = this._epSquare + (this._turn === WHITE ? -16 : 16);
        const currentSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
        const attackers = [currentSquare + 1, currentSquare - 1];
        if (this._board[startSquare] !== null || this._board[this._epSquare] !== null || this._board[currentSquare]?.color !== swapColor(this._turn) || this._board[currentSquare]?.type !== PAWN) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
          return;
        }
        const canCapture = (square) => !(square & 136) && this._board[square]?.color === this._turn && this._board[square]?.type === PAWN;
        if (!attackers.some(canCapture)) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
        }
      }
      _attacked(color, square, verbose) {
        const attackers = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i] === void 0 || this._board[i].color !== color) {
            continue;
          }
          const piece = this._board[i];
          const difference = i - square;
          if (difference === 0) {
            continue;
          }
          const index = difference + 119;
          if (ATTACKS[index] & PIECE_MASKS[piece.type]) {
            if (piece.type === PAWN) {
              if (difference > 0 && piece.color === WHITE || difference <= 0 && piece.color === BLACK) {
                if (!verbose) {
                  return true;
                } else {
                  attackers.push(algebraic(i));
                }
              }
              continue;
            }
            if (piece.type === "n" || piece.type === "k") {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
            const offset = RAYS[index];
            let j = i + offset;
            let blocked = false;
            while (j !== square) {
              if (this._board[j] != null) {
                blocked = true;
                break;
              }
              j += offset;
            }
            if (!blocked) {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
          }
        }
        if (verbose) {
          return attackers;
        } else {
          return false;
        }
      }
      attackers(square, attackedBy) {
        if (!attackedBy) {
          return this._attacked(this._turn, Ox88[square], true);
        } else {
          return this._attacked(attackedBy, Ox88[square], true);
        }
      }
      _isKingAttacked(color) {
        const square = this._kings[color];
        return square === -1 ? false : this._attacked(swapColor(color), square);
      }
      hash() {
        return this._hash.toString(16);
      }
      isAttacked(square, attackedBy) {
        return this._attacked(attackedBy, Ox88[square]);
      }
      isCheck() {
        return this._isKingAttacked(this._turn);
      }
      inCheck() {
        return this.isCheck();
      }
      isCheckmate() {
        return this.isCheck() && this._moves().length === 0;
      }
      isStalemate() {
        return !this.isCheck() && this._moves().length === 0;
      }
      isInsufficientMaterial() {
        const pieces = {
          b: 0,
          n: 0,
          r: 0,
          q: 0,
          k: 0,
          p: 0
        };
        const bishops = [];
        let numPieces = 0;
        let squareColor = 0;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          squareColor = (squareColor + 1) % 2;
          if (i & 136) {
            i += 7;
            continue;
          }
          const piece = this._board[i];
          if (piece) {
            pieces[piece.type] = piece.type in pieces ? pieces[piece.type] + 1 : 1;
            if (piece.type === BISHOP) {
              bishops.push(squareColor);
            }
            numPieces++;
          }
        }
        if (numPieces === 2) {
          return true;
        } else if (
          // k vs. kn .... or .... k vs. kb
          numPieces === 3 && (pieces[BISHOP] === 1 || pieces[KNIGHT] === 1)
        ) {
          return true;
        } else if (numPieces === pieces[BISHOP] + 2) {
          let sum = 0;
          const len = bishops.length;
          for (let i = 0; i < len; i++) {
            sum += bishops[i];
          }
          if (sum === 0 || sum === len) {
            return true;
          }
        }
        return false;
      }
      isThreefoldRepetition() {
        return this._getPositionCount(this._hash) >= 3;
      }
      isDrawByFiftyMoves() {
        return this._halfMoves >= 100;
      }
      isDraw() {
        return this.isDrawByFiftyMoves() || this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition();
      }
      isGameOver() {
        return this.isCheckmate() || this.isDraw();
      }
      moves({ verbose = false, square = void 0, piece = void 0 } = {}) {
        const moves = this._moves({ square, piece });
        if (verbose) {
          return moves.map((move) => new Move(this, move));
        } else {
          return moves.map((move) => this._moveToSan(move, moves));
        }
      }
      _moves({ legal = true, piece = void 0, square = void 0 } = {}) {
        const forSquare = square ? square.toLowerCase() : void 0;
        const forPiece = piece?.toLowerCase();
        const moves = [];
        const us = this._turn;
        const them = swapColor(us);
        let firstSquare = Ox88.a8;
        let lastSquare = Ox88.h1;
        let singleSquare = false;
        if (forSquare) {
          if (!(forSquare in Ox88)) {
            return [];
          } else {
            firstSquare = lastSquare = Ox88[forSquare];
            singleSquare = true;
          }
        }
        for (let from = firstSquare; from <= lastSquare; from++) {
          if (from & 136) {
            from += 7;
            continue;
          }
          if (!this._board[from] || this._board[from].color === them) {
            continue;
          }
          const { type } = this._board[from];
          let to;
          if (type === PAWN) {
            if (forPiece && forPiece !== type)
              continue;
            to = from + PAWN_OFFSETS[us][0];
            if (!this._board[to]) {
              addMove(moves, us, from, to, PAWN);
              to = from + PAWN_OFFSETS[us][1];
              if (SECOND_RANK[us] === rank(from) && !this._board[to]) {
                addMove(moves, us, from, to, PAWN, void 0, BITS.BIG_PAWN);
              }
            }
            for (let j = 2; j < 4; j++) {
              to = from + PAWN_OFFSETS[us][j];
              if (to & 136)
                continue;
              if (this._board[to]?.color === them) {
                addMove(moves, us, from, to, PAWN, this._board[to].type, BITS.CAPTURE);
              } else if (to === this._epSquare) {
                addMove(moves, us, from, to, PAWN, PAWN, BITS.EP_CAPTURE);
              }
            }
          } else {
            if (forPiece && forPiece !== type)
              continue;
            for (let j = 0, len = PIECE_OFFSETS[type].length; j < len; j++) {
              const offset = PIECE_OFFSETS[type][j];
              to = from;
              while (true) {
                to += offset;
                if (to & 136)
                  break;
                if (!this._board[to]) {
                  addMove(moves, us, from, to, type);
                } else {
                  if (this._board[to].color === us)
                    break;
                  addMove(moves, us, from, to, type, this._board[to].type, BITS.CAPTURE);
                  break;
                }
                if (type === KNIGHT || type === KING)
                  break;
              }
            }
          }
        }
        if (forPiece === void 0 || forPiece === KING) {
          if (!singleSquare || lastSquare === this._kings[us]) {
            if (this._castling[us] & BITS.KSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom + 2;
              if (!this._board[castlingFrom + 1] && !this._board[castlingTo] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom + 1) && !this._attacked(them, castlingTo)) {
                addMove(moves, us, this._kings[us], castlingTo, KING, void 0, BITS.KSIDE_CASTLE);
              }
            }
            if (this._castling[us] & BITS.QSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom - 2;
              if (!this._board[castlingFrom - 1] && !this._board[castlingFrom - 2] && !this._board[castlingFrom - 3] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom - 1) && !this._attacked(them, castlingTo)) {
                addMove(moves, us, this._kings[us], castlingTo, KING, void 0, BITS.QSIDE_CASTLE);
              }
            }
          }
        }
        if (!legal || this._kings[us] === -1) {
          return moves;
        }
        const legalMoves = [];
        for (let i = 0, len = moves.length; i < len; i++) {
          this._makeMove(moves[i]);
          if (!this._isKingAttacked(us)) {
            legalMoves.push(moves[i]);
          }
          this._undoMove();
        }
        return legalMoves;
      }
      move(move, { strict = false } = {}) {
        let moveObj = null;
        if (typeof move === "string") {
          moveObj = this._moveFromSan(move, strict);
        } else if (move === null) {
          moveObj = this._moveFromSan(SAN_NULLMOVE, strict);
        } else if (typeof move === "object") {
          const moves = this._moves();
          for (let i = 0, len = moves.length; i < len; i++) {
            if (move.from === algebraic(moves[i].from) && move.to === algebraic(moves[i].to) && (!("promotion" in moves[i]) || move.promotion === moves[i].promotion)) {
              moveObj = moves[i];
              break;
            }
          }
        }
        if (!moveObj) {
          if (typeof move === "string") {
            throw new Error(`Invalid move: ${move}`);
          } else {
            throw new Error(`Invalid move: ${JSON.stringify(move)}`);
          }
        }
        if (this.isCheck() && moveObj.flags & BITS.NULL_MOVE) {
          throw new Error("Null move not allowed when in check");
        }
        const prettyMove = new Move(this, moveObj);
        this._makeMove(moveObj);
        this._incPositionCount();
        return prettyMove;
      }
      _push(move) {
        this._history.push({
          move,
          kings: { b: this._kings.b, w: this._kings.w },
          turn: this._turn,
          castling: { b: this._castling.b, w: this._castling.w },
          epSquare: this._epSquare,
          halfMoves: this._halfMoves,
          moveNumber: this._moveNumber
        });
      }
      _movePiece(from, to) {
        this._hash ^= this._pieceKey(from);
        this._board[to] = this._board[from];
        delete this._board[from];
        this._hash ^= this._pieceKey(to);
      }
      _makeMove(move) {
        const us = this._turn;
        const them = swapColor(us);
        this._push(move);
        if (move.flags & BITS.NULL_MOVE) {
          if (us === BLACK) {
            this._moveNumber++;
          }
          this._halfMoves++;
          this._turn = them;
          this._epSquare = EMPTY;
          return;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        if (move.captured) {
          this._hash ^= this._pieceKey(move.to);
        }
        this._movePiece(move.from, move.to);
        if (move.flags & BITS.EP_CAPTURE) {
          if (this._turn === BLACK) {
            this._clear(move.to - 16);
          } else {
            this._clear(move.to + 16);
          }
        }
        if (move.promotion) {
          this._clear(move.to);
          this._set(move.to, { type: move.promotion, color: us });
        }
        if (this._board[move.to].type === KING) {
          this._kings[us] = move.to;
          if (move.flags & BITS.KSIDE_CASTLE) {
            const castlingTo = move.to - 1;
            const castlingFrom = move.to + 1;
            this._movePiece(castlingFrom, castlingTo);
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            const castlingTo = move.to + 1;
            const castlingFrom = move.to - 2;
            this._movePiece(castlingFrom, castlingTo);
          }
          this._castling[us] = 0;
        }
        if (this._castling[us]) {
          for (let i = 0, len = ROOKS[us].length; i < len; i++) {
            if (move.from === ROOKS[us][i].square && this._castling[us] & ROOKS[us][i].flag) {
              this._castling[us] ^= ROOKS[us][i].flag;
              break;
            }
          }
        }
        if (this._castling[them]) {
          for (let i = 0, len = ROOKS[them].length; i < len; i++) {
            if (move.to === ROOKS[them][i].square && this._castling[them] & ROOKS[them][i].flag) {
              this._castling[them] ^= ROOKS[them][i].flag;
              break;
            }
          }
        }
        this._hash ^= this._castlingKey();
        if (move.flags & BITS.BIG_PAWN) {
          let epSquare;
          if (us === BLACK) {
            epSquare = move.to - 16;
          } else {
            epSquare = move.to + 16;
          }
          if (!(move.to - 1 & 136) && this._board[move.to - 1]?.type === PAWN && this._board[move.to - 1]?.color === them || !(move.to + 1 & 136) && this._board[move.to + 1]?.type === PAWN && this._board[move.to + 1]?.color === them) {
            this._epSquare = epSquare;
            this._hash ^= this._epKey();
          } else {
            this._epSquare = EMPTY;
          }
        } else {
          this._epSquare = EMPTY;
        }
        if (move.piece === PAWN) {
          this._halfMoves = 0;
        } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          this._halfMoves = 0;
        } else {
          this._halfMoves++;
        }
        if (us === BLACK) {
          this._moveNumber++;
        }
        this._turn = them;
        this._hash ^= SIDE_KEY;
      }
      undo() {
        const hash = this._hash;
        const move = this._undoMove();
        if (move) {
          const prettyMove = new Move(this, move);
          this._decPositionCount(hash);
          return prettyMove;
        }
        return null;
      }
      _undoMove() {
        const old = this._history.pop();
        if (old === void 0) {
          return null;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        const move = old.move;
        this._kings = old.kings;
        this._turn = old.turn;
        this._castling = old.castling;
        this._epSquare = old.epSquare;
        this._halfMoves = old.halfMoves;
        this._moveNumber = old.moveNumber;
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        this._hash ^= SIDE_KEY;
        const us = this._turn;
        const them = swapColor(us);
        if (move.flags & BITS.NULL_MOVE) {
          return move;
        }
        this._movePiece(move.to, move.from);
        if (move.piece) {
          this._clear(move.from);
          this._set(move.from, { type: move.piece, color: us });
        }
        if (move.captured) {
          if (move.flags & BITS.EP_CAPTURE) {
            let index;
            if (us === BLACK) {
              index = move.to - 16;
            } else {
              index = move.to + 16;
            }
            this._set(index, { type: PAWN, color: them });
          } else {
            this._set(move.to, { type: move.captured, color: them });
          }
        }
        if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          let castlingTo, castlingFrom;
          if (move.flags & BITS.KSIDE_CASTLE) {
            castlingTo = move.to + 1;
            castlingFrom = move.to - 1;
          } else {
            castlingTo = move.to - 2;
            castlingFrom = move.to + 1;
          }
          this._movePiece(castlingFrom, castlingTo);
        }
        return move;
      }
      pgn({ newline = "\n", maxWidth = 0 } = {}) {
        const result = [];
        let headerExists = false;
        for (const i in this._header) {
          const headerTag = this._header[i];
          if (headerTag)
            result.push(`[${i} "${this._header[i]}"]` + newline);
          headerExists = true;
        }
        if (headerExists && this._history.length) {
          result.push(newline);
        }
        const appendComment = (moveString2) => {
          const comment = this._comments[this.fen()];
          if (typeof comment !== "undefined") {
            const delimiter = moveString2.length > 0 ? " " : "";
            moveString2 = `${moveString2}${delimiter}{${comment}}`;
          }
          return moveString2;
        };
        const reversedHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        const moves = [];
        let moveString = "";
        if (reversedHistory.length === 0) {
          moves.push(appendComment(""));
        }
        while (reversedHistory.length > 0) {
          moveString = appendComment(moveString);
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (!this._history.length && move.color === "b") {
            const prefix = `${this._moveNumber}. ...`;
            moveString = moveString ? `${moveString} ${prefix}` : prefix;
          } else if (move.color === "w") {
            if (moveString.length) {
              moves.push(moveString);
            }
            moveString = this._moveNumber + ".";
          }
          moveString = moveString + " " + this._moveToSan(move, this._moves({ legal: true }));
          this._makeMove(move);
        }
        if (moveString.length) {
          moves.push(appendComment(moveString));
        }
        moves.push(this._header.Result || "*");
        if (maxWidth === 0) {
          return result.join("") + moves.join(" ");
        }
        const strip = function() {
          if (result.length > 0 && result[result.length - 1] === " ") {
            result.pop();
            return true;
          }
          return false;
        };
        const wrapComment = function(width, move) {
          for (const token of move.split(" ")) {
            if (!token) {
              continue;
            }
            if (width + token.length > maxWidth) {
              while (strip()) {
                width--;
              }
              result.push(newline);
              width = 0;
            }
            result.push(token);
            width += token.length;
            result.push(" ");
            width++;
          }
          if (strip()) {
            width--;
          }
          return width;
        };
        let currentWidth = 0;
        for (let i = 0; i < moves.length; i++) {
          if (currentWidth + moves[i].length > maxWidth) {
            if (moves[i].includes("{")) {
              currentWidth = wrapComment(currentWidth, moves[i]);
              continue;
            }
          }
          if (currentWidth + moves[i].length > maxWidth && i !== 0) {
            if (result[result.length - 1] === " ") {
              result.pop();
            }
            result.push(newline);
            currentWidth = 0;
          } else if (i !== 0) {
            result.push(" ");
            currentWidth++;
          }
          result.push(moves[i]);
          currentWidth += moves[i].length;
        }
        return result.join("");
      }
      /**
       * @deprecated Use `setHeader` and `getHeaders` instead. This method will return null header tags (which is not what you want)
       */
      header(...args) {
        for (let i = 0; i < args.length; i += 2) {
          if (typeof args[i] === "string" && typeof args[i + 1] === "string") {
            this._header[args[i]] = args[i + 1];
          }
        }
        return this._header;
      }
      // TODO: value validation per spec
      setHeader(key, value2) {
        this._header[key] = value2 ?? SEVEN_TAG_ROSTER[key] ?? null;
        return this.getHeaders();
      }
      removeHeader(key) {
        if (key in this._header) {
          this._header[key] = SEVEN_TAG_ROSTER[key] || null;
          return true;
        }
        return false;
      }
      // return only non-null headers (omit placemarker nulls)
      getHeaders() {
        const nonNullHeaders = {};
        for (const [key, value2] of Object.entries(this._header)) {
          if (value2 !== null) {
            nonNullHeaders[key] = value2;
          }
        }
        return nonNullHeaders;
      }
      loadPgn(pgn2, { strict = false, newlineChar = "\r?\n" } = {}) {
        if (newlineChar !== "\r?\n") {
          pgn2 = pgn2.replace(new RegExp(newlineChar, "g"), "\n");
        }
        const parsedPgn = peg$parse(pgn2);
        this.reset();
        const headers = parsedPgn.headers;
        let fen = "";
        for (const key in headers) {
          if (key.toLowerCase() === "fen") {
            fen = headers[key];
          }
          this.header(key, headers[key]);
        }
        if (!strict) {
          if (fen) {
            this.load(fen, { preserveHeaders: true });
          }
        } else {
          if (headers["SetUp"] === "1") {
            if (!("FEN" in headers)) {
              throw new Error("Invalid PGN: FEN tag must be supplied with SetUp tag");
            }
            this.load(headers["FEN"], { preserveHeaders: true });
          }
        }
        let node2 = parsedPgn.root;
        while (node2) {
          if (node2.move) {
            const move = this._moveFromSan(node2.move, strict);
            if (move == null) {
              throw new Error(`Invalid move in PGN: ${node2.move}`);
            } else {
              this._makeMove(move);
              this._incPositionCount();
            }
          }
          if (node2.comment !== void 0) {
            this._comments[this.fen()] = node2.comment;
          }
          node2 = node2.variations[0];
        }
        const result = parsedPgn.result;
        if (result && Object.keys(this._header).length && this._header["Result"] !== result) {
          this.setHeader("Result", result);
        }
      }
      /*
       * Convert a move from 0x88 coordinates to Standard Algebraic Notation
       * (SAN)
       *
       * @param {boolean} strict Use the strict SAN parser. It will throw errors
       * on overly disambiguated moves (see below):
       *
       * r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
       * 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
       * 4. ... Ne7 is technically the valid SAN
       */
      _moveToSan(move, moves) {
        let output = "";
        if (move.flags & BITS.KSIDE_CASTLE) {
          output = "O-O";
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = "O-O-O";
        } else if (move.flags & BITS.NULL_MOVE) {
          return SAN_NULLMOVE;
        } else {
          if (move.piece !== PAWN) {
            const disambiguator = getDisambiguator(move, moves);
            output += move.piece.toUpperCase() + disambiguator;
          }
          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
            if (move.piece === PAWN) {
              output += algebraic(move.from)[0];
            }
            output += "x";
          }
          output += algebraic(move.to);
          if (move.promotion) {
            output += "=" + move.promotion.toUpperCase();
          }
        }
        this._makeMove(move);
        if (this.isCheck()) {
          if (this.isCheckmate()) {
            output += "#";
          } else {
            output += "+";
          }
        }
        this._undoMove();
        return output;
      }
      // convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
      _moveFromSan(move, strict = false) {
        let cleanMove = strippedSan(move);
        if (!strict) {
          if (cleanMove === "0-0") {
            cleanMove = "O-O";
          } else if (cleanMove === "0-0-0") {
            cleanMove = "O-O-O";
          }
        }
        if (cleanMove == SAN_NULLMOVE) {
          const res = {
            color: this._turn,
            from: 0,
            to: 0,
            piece: "k",
            flags: BITS.NULL_MOVE
          };
          return res;
        }
        let pieceType = inferPieceType(cleanMove);
        let moves = this._moves({ legal: true, piece: pieceType });
        for (let i = 0, len = moves.length; i < len; i++) {
          if (cleanMove === strippedSan(this._moveToSan(moves[i], moves))) {
            return moves[i];
          }
        }
        if (strict) {
          return null;
        }
        let piece = void 0;
        let matches = void 0;
        let from = void 0;
        let to = void 0;
        let promotion = void 0;
        let overlyDisambiguated = false;
        matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);
        if (matches) {
          piece = matches[1];
          from = matches[2];
          to = matches[3];
          promotion = matches[4];
          if (from.length == 1) {
            overlyDisambiguated = true;
          }
        } else {
          matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/);
          if (matches) {
            piece = matches[1];
            from = matches[2];
            to = matches[3];
            promotion = matches[4];
            if (from.length == 1) {
              overlyDisambiguated = true;
            }
          }
        }
        pieceType = inferPieceType(cleanMove);
        moves = this._moves({
          legal: true,
          piece: piece ? piece : pieceType
        });
        if (!to) {
          return null;
        }
        for (let i = 0, len = moves.length; i < len; i++) {
          if (!from) {
            if (cleanMove === strippedSan(this._moveToSan(moves[i], moves)).replace("x", "")) {
              return moves[i];
            }
          } else if ((!piece || piece.toLowerCase() == moves[i].piece) && Ox88[from] == moves[i].from && Ox88[to] == moves[i].to && (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
            return moves[i];
          } else if (overlyDisambiguated) {
            const square = algebraic(moves[i].from);
            if ((!piece || piece.toLowerCase() == moves[i].piece) && Ox88[to] == moves[i].to && (from == square[0] || from == square[1]) && (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
              return moves[i];
            }
          }
        }
        return null;
      }
      ascii() {
        let s = "   +------------------------+\n";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (file(i) === 0) {
            s += " " + "87654321"[rank(i)] + " |";
          }
          if (this._board[i]) {
            const piece = this._board[i].type;
            const color = this._board[i].color;
            const symbol = color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
            s += " " + symbol + " ";
          } else {
            s += " . ";
          }
          if (i + 1 & 136) {
            s += "|\n";
            i += 8;
          }
        }
        s += "   +------------------------+\n";
        s += "     a  b  c  d  e  f  g  h";
        return s;
      }
      perft(depth) {
        const moves = this._moves({ legal: false });
        let nodes = 0;
        const color = this._turn;
        for (let i = 0, len = moves.length; i < len; i++) {
          this._makeMove(moves[i]);
          if (!this._isKingAttacked(color)) {
            if (depth - 1 > 0) {
              nodes += this.perft(depth - 1);
            } else {
              nodes++;
            }
          }
          this._undoMove();
        }
        return nodes;
      }
      setTurn(color) {
        if (this._turn == color) {
          return false;
        }
        this.move("--");
        return true;
      }
      turn() {
        return this._turn;
      }
      board() {
        const output = [];
        let row = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i] == null) {
            row.push(null);
          } else {
            row.push({
              square: algebraic(i),
              type: this._board[i].type,
              color: this._board[i].color
            });
          }
          if (i + 1 & 136) {
            output.push(row);
            row = [];
            i += 8;
          }
        }
        return output;
      }
      squareColor(square) {
        if (square in Ox88) {
          const sq = Ox88[square];
          return (rank(sq) + file(sq)) % 2 === 0 ? "light" : "dark";
        }
        return null;
      }
      history({ verbose = false } = {}) {
        const reversedHistory = [];
        const moveHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (verbose) {
            moveHistory.push(new Move(this, move));
          } else {
            moveHistory.push(this._moveToSan(move, this._moves()));
          }
          this._makeMove(move);
        }
        return moveHistory;
      }
      /*
       * Keeps track of position occurrence counts for the purpose of repetition
       * checking. Old positions are removed from the map if their counts are reduced to 0.
       */
      _getPositionCount(hash) {
        return this._positionCount.get(hash) ?? 0;
      }
      _incPositionCount() {
        this._positionCount.set(this._hash, (this._positionCount.get(this._hash) ?? 0) + 1);
      }
      _decPositionCount(hash) {
        const currentCount = this._positionCount.get(hash) ?? 0;
        if (currentCount === 1) {
          this._positionCount.delete(hash);
        } else {
          this._positionCount.set(hash, currentCount - 1);
        }
      }
      _pruneComments() {
        const reversedHistory = [];
        const currentComments = {};
        const copyComment = (fen) => {
          if (fen in this._comments) {
            currentComments[fen] = this._comments[fen];
          }
        };
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        copyComment(this.fen());
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          this._makeMove(move);
          copyComment(this.fen());
        }
        this._comments = currentComments;
      }
      getComment() {
        return this._comments[this.fen()];
      }
      setComment(comment) {
        this._comments[this.fen()] = comment.replace("{", "[").replace("}", "]");
      }
      /**
       * @deprecated Renamed to `removeComment` for consistency
       */
      deleteComment() {
        return this.removeComment();
      }
      removeComment() {
        const comment = this._comments[this.fen()];
        delete this._comments[this.fen()];
        return comment;
      }
      getComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          return { fen, comment: this._comments[fen] };
        });
      }
      /**
       * @deprecated Renamed to `removeComments` for consistency
       */
      deleteComments() {
        return this.removeComments();
      }
      removeComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          const comment = this._comments[fen];
          delete this._comments[fen];
          return { fen, comment };
        });
      }
      setCastlingRights(color, rights) {
        for (const side of [KING, QUEEN]) {
          if (rights[side] !== void 0) {
            if (rights[side]) {
              this._castling[color] |= SIDES[side];
            } else {
              this._castling[color] &= ~SIDES[side];
            }
          }
        }
        this._updateCastlingRights();
        const result = this.getCastlingRights(color);
        return (rights[KING] === void 0 || rights[KING] === result[KING]) && (rights[QUEEN] === void 0 || rights[QUEEN] === result[QUEEN]);
      }
      getCastlingRights(color) {
        return {
          [KING]: (this._castling[color] & SIDES[KING]) !== 0,
          [QUEEN]: (this._castling[color] & SIDES[QUEEN]) !== 0
        };
      }
      moveNumber() {
        return this._moveNumber;
      }
    };
    exports2.BISHOP = BISHOP;
    exports2.BLACK = BLACK;
    exports2.Chess = Chess6;
    exports2.DEFAULT_POSITION = DEFAULT_POSITION;
    exports2.KING = KING;
    exports2.KNIGHT = KNIGHT;
    exports2.Move = Move;
    exports2.PAWN = PAWN;
    exports2.QUEEN = QUEEN;
    exports2.ROOK = ROOK;
    exports2.SEVEN_TAG_ROSTER = SEVEN_TAG_ROSTER;
    exports2.SQUARES = SQUARES;
    exports2.WHITE = WHITE;
    exports2.validateFen = validateFen;
    exports2.xoroshiro128 = xoroshiro128;
  }
});

// main/main.ts
var import_electron2 = require("electron");
var import_node_path2 = __toESM(require("node:path"), 1);

// shared/api.ts
var IPC = {
  engineStatus: "engine:status",
  engineRestart: "engine:restart",
  botMove: "engine:botMove",
  prefetch: "coach:prefetch",
  checkMove: "coach:checkMove",
  narrate: "coach:narrate",
  hint: "coach:hint",
  gamesSave: "games:save",
  gamesList: "games:list",
  gamesGet: "games:get",
  reviewAnalyze: "review:analyze",
  reviewProgress: "review:progress",
  settingsGet: "settings:get",
  settingsSet: "settings:set",
  keyStatus: "settings:keyStatus",
  setApiKey: "settings:setApiKey",
  testApiKey: "settings:testApiKey",
  importLichess: "library:importLichess",
  importChessCom: "library:importChessCom",
  analyzeAll: "library:analyzeAll",
  analyzeGame: "library:analyzeGame",
  libraryProgress: "library:progress",
  report: "library:report",
  drillsDue: "drills:due",
  drillsCounts: "drills:counts",
  drillsAnswer: "drills:answer"
};

// analysis/gamePhase.ts
var VALUES = { n: 3, b: 3, r: 5, q: 9 };
function gamePhase(fen, moveNumber) {
  const placement = fen.split(" ")[0] ?? "";
  let nonPawn = 0;
  let queens = 0;
  for (const ch of placement) {
    const v = VALUES[ch.toLowerCase()];
    if (v !== void 0) nonPawn += v;
    if (ch === "q" || ch === "Q") queens += 1;
  }
  if (nonPawn <= 26 || queens === 0 && nonPawn <= 32) return "endgame";
  if (moveNumber <= 12 && nonPawn >= 52) return "opening";
  return "middlegame";
}

// analysis/spacedRepetition.ts
var DAY_MS = 864e5;
var RETRY_MS = 10 * 6e4;
function newCard(now) {
  return { reps: 0, lapses: 0, intervalDays: 0, ease: 2.5, dueAt: now };
}
function schedule(card, correct, now) {
  if (!correct) {
    return { reps: 0, lapses: card.lapses + 1, intervalDays: 0, ease: Math.max(1.3, card.ease - 0.2), dueAt: now + RETRY_MS };
  }
  const reps = card.reps + 1;
  const intervalDays = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(card.intervalDays * card.ease * 10) / 10;
  return { reps, lapses: card.lapses, intervalDays, ease: Math.min(3, card.ease + 0.1), dueAt: now + intervalDays * DAY_MS };
}

// main/importers.ts
var UA = "Blunderwise/0.1 (personal desktop chess coach)";
function pgnHeaders(pgn) {
  const out = /* @__PURE__ */ new Map();
  for (const m of pgn.matchAll(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm)) {
    if (m[1] && m[2] !== void 0) out.set(m[1], m[2]);
  }
  return out;
}
function splitPgn(text) {
  return text.replace(/\r\n/g, "\n").split(/\n\n(?=\[Event )/).map((g) => g.trim()).filter((g) => g.startsWith("["));
}
function sideOf(h, username) {
  const u = username.toLowerCase();
  if ((h.get("White") ?? "").toLowerCase() === u) return "w";
  if ((h.get("Black") ?? "").toLowerCase() === u) return "b";
  return null;
}
function describeOpponent(h, me) {
  const side = me === "w" ? "Black" : "White";
  const name = h.get(side) ?? "?";
  const elo = h.get(`${side}Elo`);
  return elo && elo !== "?" ? `${name} (${elo})` : name;
}
function isStandard(h) {
  return (h.get("Variant") ?? "Standard").toLowerCase() === "standard" && !h.has("SetUp");
}
function parseLichessExport(text, username) {
  const out = [];
  for (const pgn of splitPgn(text)) {
    const h = pgnHeaders(pgn);
    const me = sideOf(h, username);
    if (!me || !isStandard(h)) continue;
    const site = h.get("Site") ?? "";
    const id = site.split("/").pop() ?? "";
    if (!id) continue;
    out.push({
      source: "lichess",
      externalId: `lichess:${id}`,
      myColor: me,
      opponent: describeOpponent(h, me),
      result: h.get("Result") ?? "*",
      pgn,
      playedAt: `${(h.get("UTCDate") ?? h.get("Date") ?? "").replace(/\./g, "-")}T${h.get("UTCTime") ?? "00:00:00"}Z`
    });
  }
  return out;
}
function parseChessComArchive(json, username) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  const games = data.games;
  if (!Array.isArray(games)) return [];
  const out = [];
  for (const g of games) {
    if (g.rules !== "chess" || typeof g.pgn !== "string") continue;
    const h = pgnHeaders(g.pgn);
    const me = sideOf(h, username);
    if (!me || h.has("SetUp")) continue;
    const id = typeof g.uuid === "string" ? g.uuid : typeof g.url === "string" ? g.url : null;
    if (!id) continue;
    out.push({
      source: "chesscom",
      externalId: `chesscom:${id}`,
      myColor: me,
      opponent: describeOpponent(h, me),
      result: h.get("Result") ?? "*",
      pgn: g.pgn,
      playedAt: typeof g.end_time === "number" ? new Date(g.end_time * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return out;
}
var defaultGet = (url, headers) => fetch(url, { headers });
async function getText(get, url, accept) {
  let res;
  try {
    res = await get(url, { Accept: accept, "User-Agent": UA });
  } catch {
    throw new Error(`Could not reach ${new URL(url).host}. Check your internet connection.`);
  }
  if (res.status === 404) throw new Error("User not found");
  if (res.status === 429) throw new Error("Rate limited by the server; try again in a minute");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
async function fetchLichessGames(username, max, get = defaultGet) {
  const u = encodeURIComponent(username.trim());
  const url = `https://lichess.org/api/games/user/${u}?max=${max}&moves=true&tags=true&clocks=false&evals=false&opening=true`;
  return parseLichessExport(await getText(get, url, "application/x-chess-pgn"), username.trim());
}
async function fetchChessComGames(username, max, get = defaultGet) {
  const u = encodeURIComponent(username.trim().toLowerCase());
  const archives = JSON.parse(await getText(get, `https://api.chess.com/pub/player/${u}/games/archives`, "application/json"));
  const months = Array.isArray(archives.archives) ? archives.archives.filter((x) => typeof x === "string") : [];
  const out = [];
  for (const month of [...months].reverse()) {
    const games = parseChessComArchive(await getText(get, month, "application/json"), username.trim());
    out.push(...games.reverse());
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

// main/library.ts
var Library = class {
  constructor(db2, coach, http) {
    this.db = db2;
    this.coach = coach;
    this.http = http;
  }
  db;
  coach;
  http;
  running = Promise.resolve();
  async importLichess(username, max) {
    const games = await fetchLichessGames(username, max, this.http);
    return { fetched: games.length, added: this.db.importGames(games) };
  }
  async importChessCom(username, max) {
    const games = await fetchChessComGames(username, max, this.http);
    return { fetched: games.length, added: this.db.importGames(games) };
  }
  /** Analyse one game on the background engine, store its mistakes and add drills for mistakes and blunders. */
  async analyzeGame(id, onMove) {
    const g = this.db.getGame(id);
    if (!g) return;
    const moves = await this.coach.reviewGame(g.pgn, g.myColor, (p) => onMove?.(p.done, p.total), "bulk");
    const rows = [];
    let myMoves = 0;
    for (const m of moves) {
      if (!m.mine) continue;
      myMoves += 1;
      const c = m.check;
      if (!c?.ctx || !c.bestMoveUci || !c.bestMoveSan || c.classification === "good") continue;
      const tags = c.instant?.tags ?? [];
      rows.push({
        ply: m.ply,
        fen: m.fenBefore,
        playedUci: m.uci,
        playedSan: m.san,
        bestUci: c.bestMoveUci,
        bestSan: c.bestMoveSan,
        classification: c.classification,
        phase: c.instant?.facts.phase ?? gamePhase(m.fenBefore, c.ctx.moveNumber),
        tags: tags.map((t) => t.tag),
        sides: tags.map((t) => t.side),
        winBefore: c.winProbBefore,
        winAfter: c.winProbAfter
      });
      if (c.classification === "mistake" || c.classification === "blunder") {
        this.db.addDrill(
          {
            fen: m.fenBefore,
            myColor: g.myColor,
            playedUci: m.uci,
            playedSan: m.san,
            bestUci: c.bestMoveUci,
            bestSan: c.bestMoveSan,
            classification: c.classification,
            tags: tags.map((t) => t.tag),
            gameId: id
          },
          newCard(Date.now())
        );
      }
    }
    this.db.storeAnalysis(id, myMoves, rows);
  }
  /** Analyse every game not analysed yet, one at a time (calls are queued, never run twice at once). */
  analyzeAll(onProgress) {
    const job = this.running.then(async () => {
      const ids = this.db.unanalyzedGameIds();
      for (const [i, id] of ids.entries()) {
        onProgress({ game: i, games: ids.length, move: 0, moves: 0 });
        await this.analyzeGame(id, (move, moves) => onProgress({ game: i, games: ids.length, move, moves }));
      }
      onProgress({ game: ids.length, games: ids.length, move: 0, moves: 0 });
      return ids.length;
    });
    this.running = job.catch(() => void 0);
    return job;
  }
  /** Queue a single game (used right after a game against the bot is saved). */
  analyzeInBackground(id) {
    this.running = this.running.then(() => this.analyzeGame(id)).catch((e) => console.error("auto-analysis failed", e));
  }
  async answerDrill(id, moveUci) {
    const d = this.db.getDrill(id);
    if (!d) throw new Error(`No drill ${id}`);
    const check = await this.coach.checkMove({ fenBefore: d.fen, moveUci, myColor: d.myColor });
    const correct = moveUci === d.bestUci || check.classification === "good";
    const card = schedule(d, correct, Date.now());
    this.db.updateDrill(id, card);
    return { correct, check, nextDueAt: card.dueAt };
  }
};

// main/coach.ts
var import_chess5 = __toESM(require_chess(), 1);

// analysis/classify.ts
function classifyMove(winProbBefore, winProbAfter) {
  const drop = winProbBefore - winProbAfter;
  if (drop < 2) return "good";
  if (drop < 5) return "inaccuracy";
  if (drop < 10) return "mistake";
  return "blunder";
}
function isDecidedEitherWay(winProbBefore, winProbAfter) {
  const won = winProbBefore > 95 && winProbAfter > 95;
  const lost = winProbBefore < 5 && winProbAfter < 5;
  return won || lost;
}

// analysis/score.ts
function negateScore(s) {
  return { cp: s.cp === null ? null : -s.cp, mate: s.mate === null ? null : -s.mate };
}

// analysis/winProbability.ts
var K = 368208e-8;
function winProbabilityFromCp(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-K * cp)) - 1);
}
function winProbability(score2) {
  if (score2.mate !== null) {
    return score2.mate > 0 ? 100 : 0;
  }
  if (score2.cp === null) {
    throw new Error("Score has neither cp nor mate");
  }
  return winProbabilityFromCp(score2.cp);
}

// explain/cache.ts
function hashString(input) {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
function cacheKey(fen, moveUci, promptVersion) {
  return `explain:${hashString(`${fen}|${moveUci}|${promptVersion}`)}`;
}
var ExplanationCache = class {
  constructor(store) {
    this.store = store;
  }
  store;
  async get(key) {
    const raw = await this.store.get(key);
    if (raw === null) return null;
    try {
      const v = JSON.parse(raw);
      return typeof v.headline === "string" ? v : null;
    } catch {
      return null;
    }
  }
  set(key, value2) {
    return this.store.set(key, JSON.stringify(value2));
  }
};

// explain/facts.ts
var import_chess3 = __toESM(require_chess(), 1);

// explain/board.ts
var import_chess = __toESM(require_chess(), 1);
var PIECE_VALUE = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100
};
var PIECE_NAME = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king"
};
var other = (c) => c === "w" ? "b" : "w";
var FILES = "abcdefgh";
var fileOf = (sq) => FILES.indexOf(sq.charAt(0));
var rankOf = (sq) => Number(sq.charAt(1)) - 1;
function toSquare(file, rank) {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES.charAt(file)}${rank + 1}`;
}
function isSquare(s) {
  return /^[a-h][1-8]$/.test(s);
}
var ROOK_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];
var BISHOP_DIRS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];
var KING_DIRS = [...ROOK_DIRS, ...BISHOP_DIRS];
var KNIGHT_JUMPS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
];
function slidingDirs(type) {
  if (type === "r") return ROOK_DIRS;
  if (type === "b") return BISHOP_DIRS;
  if (type === "q") return KING_DIRS;
  return [];
}
var Board = class _Board {
  cells;
  constructor(cells) {
    this.cells = cells;
  }
  static fromFen(fen) {
    const chess = new import_chess.Chess(fen);
    const cells = /* @__PURE__ */ new Map();
    for (const row of chess.board()) {
      for (const p of row) {
        if (p) cells.set(p.square, { square: p.square, type: p.type, color: p.color });
      }
    }
    return new _Board(cells);
  }
  get(sq) {
    return this.cells.get(sq);
  }
  pieces(color) {
    const out = [];
    for (const p of this.cells.values()) if (color === void 0 || p.color === color) out.push(p);
    return out;
  }
  kingSquare(color) {
    for (const p of this.cells.values()) if (p.type === "k" && p.color === color) return p.square;
    return null;
  }
  /** Remove the piece on `sq` (no-op if empty). */
  without(sq) {
    const next = new Map(this.cells);
    next.delete(sq);
    return new _Board(next);
  }
  /** Move whatever is on `from` to `to`, replacing anything there. Pseudo move for simulations. */
  shift(from, to) {
    const p = this.cells.get(from);
    if (!p) return this;
    const next = new Map(this.cells);
    next.delete(from);
    next.set(to, { square: to, type: p.type, color: p.color });
    return new _Board(next);
  }
  /** Squares the piece on `sq` attacks (including squares occupied by either colour). */
  attacksFrom(sq) {
    const p = this.cells.get(sq);
    if (!p) return [];
    const f = fileOf(sq);
    const r = rankOf(sq);
    const out = [];
    const push = (df, dr) => {
      const t = toSquare(f + df, r + dr);
      if (t) out.push(t);
    };
    switch (p.type) {
      case "p": {
        const dr = p.color === "w" ? 1 : -1;
        push(-1, dr);
        push(1, dr);
        break;
      }
      case "n":
        for (const [df, dr] of KNIGHT_JUMPS) push(df, dr);
        break;
      case "k":
        for (const [df, dr] of KING_DIRS) push(df, dr);
        break;
      default:
        for (const dir of slidingDirs(p.type)) out.push(...this.ray(sq, dir).visited);
    }
    return out;
  }
  /** Walk from `sq` in `dir`; returns visited squares up to and including the first occupied one. */
  ray(sq, dir) {
    const visited = [];
    let f = fileOf(sq) + dir[0];
    let r = rankOf(sq) + dir[1];
    for (; ; ) {
      const t = toSquare(f, r);
      if (!t) return { visited, blocker: null };
      visited.push(t);
      const occ = this.cells.get(t);
      if (occ) return { visited, blocker: occ };
      f += dir[0];
      r += dir[1];
    }
  }
  /** The first two pieces met along a ray (for pins / skewers / x-rays). */
  firstTwoOnRay(sq, dir) {
    const first = this.ray(sq, dir).blocker;
    if (!first) return [null, null];
    const second = this.ray(first.square, dir).blocker;
    return [first, second];
  }
  /** The king's square plus its neighbours. */
  attacksFromKingZone(king) {
    const out = [king];
    for (const [df, dr] of KING_DIRS) {
      const t = toSquare(fileOf(king) + df, rankOf(king) + dr);
      if (t) out.push(t);
    }
    return out;
  }
  attacks(from, target) {
    return this.attacksFrom(from).includes(target);
  }
  /** Pieces of `color` that attack `sq`. */
  attackers(sq, color) {
    return this.pieces(color).filter((p) => this.attacks(p.square, sq));
  }
};
function see(board, sq, side) {
  const target = board.get(sq);
  if (!target || target.color === side) return 0;
  const attackers = board.attackers(sq, side);
  if (attackers.length === 0) return 0;
  attackers.sort((a, b) => PIECE_VALUE[a.type] - PIECE_VALUE[b.type]);
  const lva = attackers[0];
  if (!lva) return 0;
  const next = board.shift(lva.square, sq);
  return Math.max(0, PIECE_VALUE[target.type] - see(next, sq, other(side)));
}
function seeCapture(board, from, to) {
  const mover = board.get(from);
  const target = board.get(to);
  if (!mover) return 0;
  const gained = target ? PIECE_VALUE[target.type] : 0;
  const next = board.shift(from, to);
  return gained - see(next, to, other(mover.color));
}
function materialBalance(board, color) {
  let sum = 0;
  for (const p of board.pieces()) {
    if (p.type === "k") continue;
    sum += p.color === color ? PIECE_VALUE[p.type] : -PIECE_VALUE[p.type];
  }
  return sum;
}
function toRef(p) {
  return { piece: PIECE_NAME[p.type], square: p.square, color: p.color };
}
function parseUci(uci) {
  const m = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci);
  if (!m || !m[1] || !m[2]) throw new Error(`Bad UCI move: ${uci}`);
  const promo = m[3];
  return {
    from: m[1],
    to: m[2],
    promotion: promo === "q" || promo === "r" || promo === "b" || promo === "n" ? promo : void 0
  };
}
function settledMaterial(fen, pov, maxDepth = 6) {
  const chess = new import_chess.Chess(fen);
  const stm = chess.turn();
  const v = quiesce(chess, maxDepth, -Infinity, Infinity);
  return stm === pov ? v : -v;
}
function quiesce(chess, depth, alpha, beta) {
  const stm = chess.turn();
  const standPat = materialBalance(Board.fromFen(chess.fen()), stm);
  if (depth === 0) return standPat;
  let a = alpha;
  if (standPat >= beta) return standPat;
  if (standPat > a) a = standPat;
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured !== void 0 || m.promotion !== void 0).sort((x, y) => PIECE_VALUE[y.captured ?? "p"] - PIECE_VALUE[x.captured ?? "p"]);
  for (const m of captures) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score2 = -quiesce(chess, depth - 1, -beta, -a);
    chess.undo();
    if (score2 >= beta) return score2;
    if (score2 > a) a = score2;
  }
  return a;
}

// explain/line.ts
var import_chess2 = __toESM(require_chess(), 1);
function playLine(fen, uciMoves, maxPlies = Infinity) {
  const chess = new import_chess2.Chess(fen);
  const steps = [];
  let boardBefore = Board.fromFen(fen);
  for (const [i, uci] of uciMoves.entries()) {
    if (i >= maxPlies) break;
    const { from, to, promotion } = parseUci(uci);
    const fenBefore = chess.fen();
    let move;
    try {
      move = chess.move({ from, to, promotion });
    } catch {
      throw new Error(`Illegal move ${uci} at ply ${i} from ${fenBefore}`);
    }
    const fenAfter = chess.fen();
    const boardAfter = Board.fromFen(fenAfter);
    steps.push({
      ply: i,
      uci,
      san: move.san,
      mover: move.color,
      piece: move.piece,
      from: move.from,
      to: move.to,
      captured: move.captured ?? null,
      promotion: move.promotion ?? null,
      isCheck: chess.isCheck(),
      isMate: chess.isCheckmate(),
      fenBefore,
      fenAfter,
      boardBefore,
      boardAfter
    });
    boardBefore = boardAfter;
  }
  return steps;
}
function movesBy(steps, color, n) {
  return steps.filter((s) => s.mover === color).slice(0, n);
}
function isCapturedLater(steps, startSquare, victimColor, fromPly) {
  let sq = startSquare;
  for (const s of steps) {
    if (s.ply <= fromPly) continue;
    if (s.mover === victimColor && s.from === sq) {
      sq = s.to;
      continue;
    }
    if (s.mover !== victimColor && s.to === sq && s.captured !== null) return s;
  }
  return null;
}

// explain/facts.ts
var LINE_PLIES = 8;
function moveFact(step) {
  return {
    uci: step.uci,
    san: step.san,
    piece: PIECE_NAME[step.piece],
    from: step.from,
    to: step.to,
    captured: step.captured ? PIECE_NAME[step.captured] : null,
    promotion: step.promotion ? PIECE_NAME[step.promotion] : null,
    isCheck: step.isCheck
  };
}
function split(board, targets, mover) {
  const attacked = [];
  const defended = [];
  for (const sq of targets) {
    const p = board.get(sq);
    if (!p) continue;
    (p.color === mover ? defended : attacked).push(toRef(p));
  }
  return { attacked, defended };
}
function severityOf(drop) {
  if (drop >= 30) return "game-changing blunder";
  if (drop >= 10) return "serious mistake";
  if (drop >= 5) return "mistake";
  return "slip";
}
function settledAtEnd(startFen, steps, me) {
  const last = steps[steps.length - 1];
  if (!last) return settledMaterial(startFen, me);
  if (last.isMate) return materialBalance(last.boardAfter, me);
  return settledMaterial(last.fenAfter, me);
}
function analyze(ctx) {
  const me = ctx.myColor;
  const opp = other(me);
  const turn = new import_chess3.Chess(ctx.fen).turn();
  if (turn !== me) throw new Error(`FEN side to move (${turn}) is not myColor (${me})`);
  const played = playLine(ctx.fen, [ctx.movePlayedUci]);
  const playedStep = played[0];
  if (!playedStep) throw new Error("Played move missing");
  const fenAfter = playedStep.fenAfter;
  const bestUci = ctx.bestLine[0] === ctx.bestMoveUci ? ctx.bestLine : [ctx.bestMoveUci, ...ctx.bestLine];
  const best = playLine(ctx.fen, bestUci, LINE_PLIES);
  const refutation = playLine(fenAfter, ctx.refutationLine, LINE_PLIES);
  const bestStep = best[0];
  if (!bestStep) throw new Error("Best move missing");
  const before = playedStep.boardBefore;
  const after = playedStep.boardAfter;
  const { from, to } = parseUci(ctx.movePlayedUci);
  const b = split(before, before.attacksFrom(from), me);
  const a = split(after, after.attacksFrom(to), me);
  const leftHanging = [];
  for (const p of after.pieces(me)) {
    if (p.type === "k") continue;
    const loss = see(after, p.square, opp);
    if (loss >= 1) leftHanging.push({ piece: toRef(p), loss });
  }
  leftHanging.sort((x, y) => y.loss - x.loss);
  const drop = ctx.winProbBefore - ctx.winProbAfter;
  const facts = {
    myColor: me,
    moveNumber: ctx.moveNumber,
    phase: gamePhase(ctx.fen, ctx.moveNumber),
    played: moveFact(playedStep),
    best: moveFact(bestStep),
    bestLineSan: best.map((s) => s.san),
    refutationLineSan: refutation.map((s) => s.san),
    materialBefore: materialBalance(before, me),
    materialAfterBestLine: settledAtEnd(ctx.fen, best, me),
    materialAfterRefutation: settledAtEnd(fenAfter, refutation, me),
    movedPiece: {
      attackedBefore: b.attacked,
      defendedBefore: b.defended,
      attackedAfter: a.attacked,
      defendedAfter: a.defended
    },
    leftHanging,
    mate: {
      iHadMateIn: ctx.evalBefore.mate !== null && ctx.evalBefore.mate > 0 ? ctx.evalBefore.mate : null,
      theyHaveMateIn: ctx.evalAfter.mate !== null && ctx.evalAfter.mate < 0 ? -ctx.evalAfter.mate : null
    },
    winProbBefore: ctx.winProbBefore,
    winProbAfter: ctx.winProbAfter,
    severity: severityOf(drop)
  };
  return { ctx, facts, me, opp, before, after, fenAfter, refutation, best, playedStep };
}

// explain/motifs/common.ts
function lineFor(a, side) {
  return side === "opponent" ? { side, steps: a.refutation, attacker: a.opp, defender: a.me } : { side, steps: a.best, attacker: a.me, defender: a.opp };
}
function stakeFor(a, side) {
  const f = a.facts;
  return side === "opponent" ? f.materialBefore - f.materialAfterRefutation : f.materialAfterBestLine - f.materialAfterRefutation;
}
function makeResult(tag, side, confidence, squares, pieces, evidence, keyMoveSan) {
  return {
    tag,
    side,
    confidence: Math.max(0, Math.min(1, confidence)),
    squares: [...new Set(squares)],
    pieces,
    evidence,
    keyMoveSan
  };
}
function bestOf(results) {
  let top = null;
  for (const r of results) if (r && (!top || r.confidence > top.confidence)) top = r;
  return top;
}
var nameOf = (p) => PIECE_NAME[p.type];
var value = (p) => PIECE_VALUE[p.type];
var describe = (p) => `${nameOf(p)} on ${p.square}`;
function findPins(board, attacker) {
  const pins = [];
  for (const s of board.pieces(attacker)) {
    for (const dir of slidingDirs(s.type)) {
      const [first, second] = board.firstTwoOnRay(s.square, dir);
      if (!first || !second) continue;
      if (first.color === attacker || second.color === attacker) continue;
      if (first.type === "k" || value(first) < 3) continue;
      if (second.type === "k" || value(second) > value(first)) {
        pins.push({ pinner: s, pinned: first, behind: second });
      }
    }
  }
  return pins;
}
var pinKey = (p) => `${p.pinner.square}-${p.pinned.square}-${p.behind.square}`;

// explain/motifs/allowedMate.ts
var detectAllowedMate = (a) => {
  const before = a.ctx.evalBefore.mate;
  const after = a.ctx.evalAfter.mate;
  if (after === null || after >= 0) return null;
  if (before !== null && before < 0) return null;
  const first = a.refutation[0];
  if (!first) return null;
  const n = -after;
  const mateStep = a.refutation.find((s) => s.isMate);
  const king = a.after.kingSquare(a.me);
  const kingPiece = king ? a.after.get(king) : void 0;
  return makeResult(
    "allowedMate",
    "opponent",
    mateStep ? 0.95 : 0.85,
    [first.from, first.to, ...mateStep ? [mateStep.to] : [], ...king ? [king] : []],
    kingPiece ? [toRef(kingPiece)] : [],
    n === 1 ? `${first.san} is checkmate` : `they have a forced checkmate in ${n} moves starting with ${first.san}`,
    first.san
  );
};

// explain/motifs/backRankWeakness.ts
function backRankOn(a, side) {
  const { steps, attacker, defender } = lineFor(a, side);
  const backRank = defender === "w" ? 0 : 7;
  const forward = defender === "w" ? 1 : -1;
  for (const s of steps.slice(0, 6)) {
    if (s.mover !== attacker || !s.isCheck) continue;
    if (s.piece !== "r" && s.piece !== "q") continue;
    if (rankOf(s.to) !== backRank) continue;
    const board = s.boardAfter;
    const king = board.kingSquare(defender);
    if (!king || rankOf(king) !== backRank) continue;
    const escapes = [-1, 0, 1].map((df) => toSquare(fileOf(king) + df, backRank + forward)).filter((sq) => sq !== null);
    const boxedIn = escapes.every((sq) => {
      const occ = board.get(sq);
      return occ !== void 0 && occ.color === defender || board.attackers(sq, attacker).length > 0;
    });
    if (!boxedIn) continue;
    const mates = steps.slice(s.ply, s.ply + 5).some((x) => x.isMate);
    const confidence = mates ? 0.9 : stakeFor(a, side) >= 2 ? 0.6 : 0;
    if (confidence === 0) continue;
    const kingPiece = board.get(king);
    const checker = board.get(s.to);
    const owner = side === "opponent" ? "your" : "their";
    return makeResult(
      "backRankWeakness",
      side,
      confidence,
      [s.to, king, ...escapes],
      [kingPiece, checker].filter((p) => p !== void 0).map(toRef),
      `${owner} king on ${king} is boxed in by its own pieces, so ${s.san} with the ${checker ? nameOf(checker) : "piece"} on the back rank ${mates ? "is checkmate" : "wins material"}`,
      s.san
    );
  }
  return null;
}
var detectBackRankWeakness = (a) => bestOf([backRankOn(a, "opponent"), backRankOn(a, "you")]);

// explain/motifs/discoveredAttack.ts
function discoveredOn(a, side) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    for (const d of s.boardBefore.pieces(attacker)) {
      if (d.square === s.from) continue;
      for (const dir of slidingDirs(d.type)) {
        const blockerBefore = s.boardBefore.ray(d.square, dir).blocker;
        if (!blockerBefore || blockerBefore.square !== s.from) continue;
        const target = s.boardAfter.ray(d.square, dir).blocker;
        if (!target || target.color !== defender) continue;
        const isKing = target.type === "k";
        const worthIt = isKing || target.type !== "p" && (value(target) > value(d) || see(s.boardAfter, target.square, attacker) > 0);
        if (!worthIt) continue;
        const stake = stakeFor(a, side);
        const won = !isKing && isCapturedLater(steps, target.square, defender, s.ply);
        let confidence = 0;
        if (stake < 1.5) continue;
        if (isKing && s.isCheck) confidence = 0.9;
        else if (won) confidence = 0.85;
        else confidence = 0.6;
        if (confidence === 0) continue;
        const mover = s.boardAfter.get(s.to);
        const owner = side === "opponent" ? "your" : "their";
        const what = isKing ? `a discovered check on ${owner} king` : `a discovered attack on ${owner} ${nameOf(target)} on ${target.square}`;
        return makeResult(
          "discoveredAttack",
          side,
          confidence,
          [s.from, s.to, d.square, target.square],
          mover ? [toRef(mover), toRef(d), toRef(target)] : [toRef(d), toRef(target)],
          `${s.san} moves out of the way of the ${nameOf(d)} on ${d.square}, giving ${what}`,
          s.san
        );
      }
    }
  }
  return null;
}
var detectDiscoveredAttack = (a) => bestOf([discoveredOn(a, "opponent"), discoveredOn(a, "you")]);

// explain/motifs/fork.ts
function forkOn(a, side) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    const board = s.boardAfter;
    const forker = board.get(s.to);
    if (!forker) continue;
    const targets = board.attacksFrom(s.to).map((sq) => board.get(sq)).filter((p) => p !== void 0 && p.color === defender).filter(
      (p) => p.type === "k" || p.type !== "p" && (value(p) > value(forker) || see(board, p.square, attacker) > 0)
    );
    if (targets.length < 2) continue;
    const won = targets.find((t) => t.type !== "k" && isCapturedLater(steps, t.square, defender, s.ply));
    const stake = stakeFor(a, side);
    if (stake < 1.5) continue;
    const confidence = won ? 0.9 : 0.65;
    const names = targets.map((t) => `${nameOf(t)} on ${t.square}`).join(" and ");
    const who = side === "opponent" ? "their" : "your";
    return makeResult(
      "fork",
      side,
      confidence,
      [s.to, ...targets.map((t) => t.square)],
      [toRef(forker), ...targets.map(toRef)],
      `${s.san} lets ${who} ${nameOf(forker)} attack the ${names} at once`,
      s.san
    );
  }
  return null;
}
var detectFork = (a) => bestOf([forkOn(a, "opponent"), forkOn(a, "you")]);

// explain/motifs/hangingPiece.ts
var detectHangingPiece = (a) => {
  const early = a.refutation.slice(0, 4);
  for (const h of a.facts.leftHanging) {
    const sq = h.piece.square;
    const capture = isCapturedLater(early, sq, a.me, -1);
    const lostInLine = a.facts.materialBefore - a.facts.materialAfterRefutation;
    let confidence = 0;
    if (capture) confidence = h.loss >= 3 ? 0.9 : 0.55;
    else if (h.loss >= 2 && lostInLine >= h.loss - 0.5) confidence = 0.55;
    if (confidence === 0) continue;
    const movedIt = sq === a.playedStep.to;
    const how = capture ? ` with ${capture.san}` : "";
    const evidence = movedIt ? `you moved your ${h.piece.piece} to ${sq}, where it can be taken${how}` : `your ${h.piece.piece} on ${sq} was left undefended and can be taken${how}`;
    return makeResult(
      "hangingPiece",
      "opponent",
      confidence,
      capture ? [sq, capture.from] : [sq],
      [h.piece],
      evidence,
      capture?.san ?? null
    );
  }
  return null;
};

// explain/motifs/kingSafetyBlunder.ts
var detectKingSafetyBlunder = (a) => {
  const step = a.playedStep;
  const king = a.before.kingSquare(a.me);
  if (!king) return null;
  const up = a.me === "w" ? 1 : -1;
  let weakness = null;
  if (step.piece === "p") {
    const fileGap = Math.abs(fileOf(step.from) - fileOf(king));
    const ahead = (rankOf(step.from) - rankOf(king)) * up;
    if (fileGap <= 1 && ahead >= 1 && ahead <= 2) weakness = `pushing the pawn on ${step.from} opened up your king on ${king}`;
  } else if (step.piece === "k" && Math.abs(fileOf(step.from) - fileOf(step.to)) < 2 && a.facts.phase !== "endgame") {
    weakness = `walking your king to ${step.to} left it exposed`;
  }
  if (!weakness) return null;
  const oppMoves = movesBy(a.refutation, a.opp, 2);
  const checks = oppMoves.filter((s) => s.isCheck);
  const mated = a.facts.mate.theyHaveMateIn !== null;
  const drop = a.ctx.winProbBefore - a.ctx.winProbAfter;
  if (drop < 5) return null;
  const vacated = step.piece === "p" ? step.from : null;
  const kingNow = a.after.kingSquare(a.me) ?? king;
  const zone = /* @__PURE__ */ new Set([...a.after.attacksFromKingZone(kingNow), ...vacated ? [vacated] : []]);
  let aimer = null;
  for (const s of oppMoves) {
    const hits = s.boardAfter.attacksFrom(s.to).filter((sq) => zone.has(sq));
    const raysBefore = s.boardBefore.attacksFrom(s.from).filter((sq) => zone.has(sq));
    if (hits.length > raysBefore.length) {
      aimer = s;
      break;
    }
  }
  const firstCheck = checks[0];
  let confidence = 0;
  if (mated) confidence = 0.75;
  else if (firstCheck) confidence = 0.7;
  else if (aimer) confidence = 0.55;
  if (confidence === 0) return null;
  const key = firstCheck ?? aimer;
  return makeResult(
    "kingSafetyBlunder",
    "opponent",
    confidence,
    [step.from, step.to, king, ...key ? [key.to] : []],
    [{ piece: "king", square: step.piece === "k" ? step.to : king, color: a.me }],
    firstCheck ? `${weakness}, and ${firstCheck.san} attacks it right away` : aimer ? `${weakness}, and ${aimer.san} starts aiming at it` : weakness,
    key?.san ?? null
  );
};

// explain/motifs/missedCapture.ts
var detectMissedCapture = (a) => {
  const best = a.best[0];
  if (!best || best.captured === null) return null;
  if (best.uci === a.ctx.movePlayedUci) return null;
  const victim = a.before.get(best.to);
  if (!victim) return null;
  const gain = seeCapture(a.before, best.from, best.to);
  const missed = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  if (gain < 1 || missed < 1) return null;
  const confidence = gain >= 2 ? 0.85 : 0.5;
  const capturer = a.before.get(best.from);
  return makeResult(
    "missedCapture",
    "you",
    confidence,
    [best.to, best.from],
    capturer ? [toRef(victim), toRef(capturer)] : [toRef(victim)],
    `${best.san} would have won the ${describe(victim)}`,
    best.san
  );
};

// explain/motifs/missedMate.ts
var detectMissedMate = (a) => {
  const before = a.ctx.evalBefore.mate;
  const after = a.ctx.evalAfter.mate;
  if (before === null || before <= 0) return null;
  if (after !== null && after > 0) return null;
  const first = a.best[0];
  if (!first) return null;
  const mateStep = a.best.find((s) => s.isMate);
  const theirKing = a.before.kingSquare(a.opp);
  return makeResult(
    "missedMate",
    "you",
    mateStep ? 0.95 : 0.85,
    [first.from, first.to, ...theirKing ? [theirKing] : []],
    [],
    before === 1 ? `${first.san} was checkmate` : `you had a forced checkmate in ${before} moves starting with ${first.san}`,
    first.san
  );
};

// explain/motifs/missedPromotion.ts
var detectMissedPromotion = (a) => {
  if (a.playedStep.promotion !== null) return null;
  const mine = movesBy(a.best, a.me, 2);
  const idx = mine.findIndex((s) => s.promotion !== null);
  const promo = mine[idx];
  if (!promo || promo.promotion === null) return null;
  const swing = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  const drop = a.ctx.winProbBefore - a.ctx.winProbAfter;
  if (swing < 3 && drop < 10) return null;
  return makeResult(
    "missedPromotion",
    "you",
    idx === 0 ? 0.9 : 0.7,
    [promo.from, promo.to],
    [{ piece: "pawn", square: promo.from, color: a.me }],
    `${promo.san} would have turned your pawn into a ${PIECE_NAME[promo.promotion]}`,
    promo.san
  );
};

// explain/motifs/overloadedDefender.ts
var detectOverloadedDefender = (a) => {
  const board = a.after;
  for (const d of board.pieces(a.me)) {
    const duties = board.pieces(a.me).filter(
      (y) => y.square !== d.square && y.type !== "k" && board.attackers(y.square, a.opp).length > 0 && board.attacks(d.square, y.square) && board.attackers(y.square, a.me).length === 1
    );
    if (duties.length < 2) continue;
    const dutySquares = new Set(duties.map((y) => y.square));
    const steps = a.refutation;
    let pattern = false;
    for (let i = 0; i + 2 < steps.length; i++) {
      const s1 = steps[i];
      const s2 = steps[i + 1];
      const s3 = steps[i + 2];
      if (!s1 || !s2 || !s3) continue;
      if (s1.mover !== a.opp || !s1.captured || !dutySquares.has(s1.to)) continue;
      if (s2.from !== d.square || s2.to !== s1.to) continue;
      if (s3.mover === a.opp && s3.captured && dutySquares.has(s3.to) && s3.to !== s1.to) pattern = true;
      break;
    }
    const stake = stakeFor(a, "opponent");
    const takesDuty = steps.slice(0, 3).some((s) => s.mover === a.opp && s.captured && dutySquares.has(s.to));
    const confidence = pattern ? 0.85 : takesDuty && stake >= 2 ? 0.55 : 0;
    if (confidence === 0) continue;
    const list = duties.map((y) => `${nameOf(y)} on ${y.square}`).join(" and ");
    return makeResult(
      "overloadedDefender",
      "opponent",
      confidence,
      [d.square, ...duties.map((y) => y.square)],
      [toRef(d), ...duties.map(toRef)],
      `your ${nameOf(d)} on ${d.square} is the only defender of both the ${list}, so it cannot protect both`,
      steps[0]?.san ?? null
    );
  }
  return null;
};

// explain/motifs/pin.ts
function pinOn(a, side) {
  const { steps, attacker, defender } = lineFor(a, side);
  const existing = new Set(findPins(a.before, attacker).map(pinKey));
  const boards = [];
  if (side === "opponent") boards.push({ board: a.after, ply: -1, san: null });
  for (const s of movesBy(steps, attacker, 2)) boards.push({ board: s.boardAfter, ply: s.ply, san: s.san });
  for (const { board, ply, san } of boards) {
    for (const pin of findPins(board, attacker)) {
      if (board.attackers(pin.pinned.square, defender).length === 0) continue;
      const isNew = !existing.has(pinKey(pin));
      const won = isCapturedLater(steps, pin.pinned.square, defender, ply);
      const stake = stakeFor(a, side);
      let confidence = 0;
      if (won && stake >= 1.5) confidence = 0.85;
      else if (isNew && side === "opponent" && stake >= 2) confidence = 0.6;
      if (confidence === 0) continue;
      const toWhat = pin.behind.type === "k" ? "king" : nameOf(pin.behind);
      const owner = side === "opponent" ? "your" : "their";
      const how = san ?? a.playedStep.san;
      return makeResult(
        "pin",
        side,
        confidence,
        [pin.pinned.square, pin.pinner.square, pin.behind.square],
        [toRef(pin.pinned), toRef(pin.pinner), toRef(pin.behind)],
        `after ${how}, ${owner} ${nameOf(pin.pinned)} on ${pin.pinned.square} is pinned to the ${toWhat} on ${pin.behind.square} by the ${nameOf(pin.pinner)} on ${pin.pinner.square}`,
        san
      );
    }
  }
  return null;
}
var detectPin = (a) => bestOf([pinOn(a, "opponent"), pinOn(a, "you")]);

// explain/motifs/positionalLoss.ts
function positionalLoss(a) {
  const best = a.best[0];
  const swing = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  return makeResult(
    "positionalLoss",
    "you",
    swing < 1.5 ? 0.4 : 0.25,
    best ? [best.from, best.to] : [],
    [],
    best ? `no immediate tactic; ${best.san} was the stronger idea` : "no immediate tactic",
    best?.san ?? null
  );
}

// explain/motifs/skewer.ts
function skewerOn(a, side) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    const board = s.boardAfter;
    const slider = board.get(s.to);
    if (!slider) continue;
    for (const dir of slidingDirs(slider.type)) {
      const [front, back] = board.firstTwoOnRay(s.to, dir);
      if (!front || !back || front.color !== defender || back.color !== defender) continue;
      if (back.type === "k" || value(back) < 3) continue;
      if (!(front.type === "k" || value(front) > value(back))) continue;
      const won = isCapturedLater(steps, back.square, defender, s.ply);
      const stake = stakeFor(a, side);
      const confidence = stake < 1.5 ? 0 : won ? 0.9 : 0.6;
      if (confidence === 0) continue;
      const owner = side === "opponent" ? "your" : "their";
      return makeResult(
        "skewer",
        side,
        confidence,
        [s.to, front.square, back.square],
        [toRef(slider), toRef(front), toRef(back)],
        `${s.san} attacks ${owner} ${nameOf(front)} on ${front.square}; once it moves, the ${nameOf(back)} behind it on ${back.square} falls`,
        s.san
      );
    }
  }
  return null;
}
var detectSkewer = (a) => bestOf([skewerOn(a, "opponent"), skewerOn(a, "you")]);

// explain/motifs/trappedPiece.ts
var import_chess4 = __toESM(require_chess(), 1);
var detectTrappedPiece = (a) => {
  for (const s of movesBy(a.refutation, a.opp, 2)) {
    if (s.isCheck) continue;
    const board = s.boardAfter;
    const pinned = new Set(findPins(board, a.opp).map((p) => p.pinned.square));
    const chess = new import_chess4.Chess(s.fenAfter);
    for (const x of board.pieces(a.me)) {
      if (x.type === "k" || x.type === "p" || value(x) < 3 || pinned.has(x.square)) continue;
      const moves = chess.moves({ square: x.square, verbose: true });
      const safeExists = moves.some((m) => {
        const net = seeCapture(board, m.from, m.to);
        return net > -2;
      });
      if (safeExists) continue;
      const won = isCapturedLater(a.refutation, x.square, a.me, s.ply);
      if (!won) continue;
      const confidence = 0.85;
      return makeResult(
        "trappedPiece",
        "opponent",
        confidence,
        [x.square, s.to, ...moves.map((m) => m.to)],
        [toRef(x)],
        `after ${s.san}, your ${nameOf(x)} on ${x.square} has no safe square to go to`,
        s.san
      );
    }
  }
  return null;
};
var TRAP_MIN_VALUE = PIECE_VALUE.n;

// explain/motifs/index.ts
var DETECTORS = {
  hangingPiece: detectHangingPiece,
  missedCapture: detectMissedCapture,
  fork: detectFork,
  pin: detectPin,
  skewer: detectSkewer,
  discoveredAttack: detectDiscoveredAttack,
  backRankWeakness: detectBackRankWeakness,
  missedMate: detectMissedMate,
  allowedMate: detectAllowedMate,
  trappedPiece: detectTrappedPiece,
  overloadedDefender: detectOverloadedDefender,
  missedPromotion: detectMissedPromotion,
  kingSafetyBlunder: detectKingSafetyBlunder
};
var RELEVANCE = {
  allowedMate: 1.2,
  missedMate: 1.2,
  backRankWeakness: 0.95,
  fork: 0.9,
  skewer: 0.9,
  discoveredAttack: 0.9,
  missedPromotion: 0.9,
  pin: 0.85,
  trappedPiece: 0.85,
  hangingPiece: 0.85,
  missedCapture: 0.85,
  overloadedDefender: 0.8,
  kingSafetyBlunder: 0.6,
  positionalLoss: 0.1
};
var SPECIFIC = /* @__PURE__ */ new Set([
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "trappedPiece",
  "overloadedDefender"
]);
var MAX_TAGS = 2;
var SECOND_TAG_MIN_SCORE = 0.5;
var score = (r) => r.confidence * RELEVANCE[r.tag];
function runDetectors(a) {
  const found = [];
  for (const detect of Object.values(DETECTORS)) {
    const r = detect(a);
    if (r) found.push(r);
  }
  return found;
}
function detectMotifs(a) {
  const found = runDetectors(a);
  const specific = found.filter((r) => SPECIFIC.has(r.tag));
  const kept = found.filter((r) => {
    if (r.tag !== "hangingPiece" && r.tag !== "missedCapture") return true;
    const sq = r.squares[0];
    return !specific.some((s) => sq !== void 0 && s.squares.includes(sq));
  });
  kept.sort((x, y) => score(y) - score(x));
  const out = [];
  for (const r of kept) {
    if (out.length >= MAX_TAGS) break;
    if (out.length > 0 && score(r) < SECOND_TAG_MIN_SCORE) break;
    out.push(r);
  }
  return out.length > 0 ? out : [positionalLoss(a)];
}

// explain/vocabulary.ts
var NARRATED_PLIES = 6;
var stripSan = (san) => san.replace(/[+#!?]+$/g, "");
function buildVocabulary(a, tags) {
  const squares = /* @__PURE__ */ new Set();
  const moves = /* @__PURE__ */ new Set();
  const pieces = /* @__PURE__ */ new Set();
  const f = a.facts;
  for (const m of [f.played, f.best]) {
    squares.add(m.from);
    squares.add(m.to);
    moves.add(stripSan(m.san));
    pieces.add(m.piece);
    if (m.captured) pieces.add(m.captured);
    if (m.promotion) pieces.add(m.promotion);
  }
  for (const steps of [a.best.slice(0, NARRATED_PLIES), a.refutation.slice(0, NARRATED_PLIES)]) {
    for (const s of steps) {
      squares.add(s.from);
      squares.add(s.to);
      moves.add(stripSan(s.san));
      pieces.add(PIECE_NAME[s.piece]);
      if (s.captured) pieces.add(PIECE_NAME[s.captured]);
      if (s.promotion) pieces.add(PIECE_NAME[s.promotion]);
      if (s.isCheck) pieces.add("king");
    }
  }
  const mp = f.movedPiece;
  for (const p of [...mp.attackedBefore, ...mp.attackedAfter, ...mp.defendedBefore, ...mp.defendedAfter]) {
    squares.add(p.square);
    pieces.add(p.piece);
  }
  for (const h of f.leftHanging) {
    squares.add(h.piece.square);
    pieces.add(h.piece.piece);
  }
  for (const t of tags) {
    for (const sq of t.squares) squares.add(sq);
    for (const p of t.pieces) {
      squares.add(p.square);
      pieces.add(p.piece);
    }
    if (t.keyMoveSan) moves.add(stripSan(t.keyMoveSan));
  }
  if (f.mate.iHadMateIn !== null || f.mate.theyHaveMateIn !== null) pieces.add("king");
  return { squares, moves, pieces };
}

// explain/narrator/prompt.ts
var PROMPT_VERSION = "v1";
var SYSTEM_PROMPT = `You are a friendly chess coach talking to a club player rated about 1200.
You explain why ONE move they just played was a mistake.

Rules:
- Use ONLY the moves, squares and pieces listed under "allowed". Never invent other moves, squares or pieces.
- Base the explanation ONLY on "findings" and "lines". Do not claim any tactic that is not in "findings".
- Never mention centipawns, evaluations, numbers of points, engines, depth or percentages.
- Speak directly to the player as "you". Their opponent is "they" / "your opponent".
- Keep it simple and concrete: say what goes wrong after their move, and what the better move does.
- If the only finding is "positionalLoss", say the move was simply weaker and name the better idea; do not invent a tactic.

Reply with ONE JSON object and nothing else:
{
  "headline": "at most 8 words",
  "explanation": "2 or 3 sentences",
  "lesson": "exactly 1 sentence the player can reuse in future games",
  "highlightSquares": ["squares from the allowed list worth highlighting"]
}`;
var COLOR = { w: "White", b: "Black" };
function materialWords(n) {
  if (n <= -8) return "you lose a lot of material (about a queen)";
  if (n <= -4) return "you lose a rook or more";
  if (n <= -2) return "you lose a piece";
  if (n <= -1) return "you lose a pawn";
  if (n >= 8) return "you win a lot of material";
  if (n >= 4) return "you win a rook or more";
  if (n >= 2) return "you win a piece";
  if (n >= 1) return "you win a pawn";
  return "material stays about even";
}
function buildUserPrompt(facts, tags, vocab) {
  const payload = {
    you_play: COLOR[facts.myColor],
    move_number: facts.moveNumber,
    game_phase: facts.phase,
    how_bad: facts.severity,
    your_move: { san: facts.played.san, piece: facts.played.piece, from: facts.played.from, to: facts.played.to },
    better_move: { san: facts.best.san, piece: facts.best.piece, from: facts.best.from, to: facts.best.to },
    lines: {
      after_your_move: facts.refutationLineSan.slice(0, NARRATED_PLIES),
      after_the_better_move: facts.bestLineSan.slice(0, NARRATED_PLIES),
      material_after_your_move_line: materialWords(facts.materialAfterRefutation - facts.materialBefore),
      material_after_better_move_line: materialWords(facts.materialAfterBestLine - facts.materialBefore)
    },
    findings: tags.map((t) => ({
      motif: t.tag,
      who_benefits: t.side === "opponent" ? "your opponent" : "you (missed)",
      evidence: t.evidence,
      key_move: t.keyMoveSan
    })),
    your_pieces_left_undefended: facts.leftHanging.map((h) => `${h.piece.piece} on ${h.piece.square}`),
    checkmate: {
      you_had_mate_in: facts.mate.iHadMateIn,
      opponent_now_has_mate_in: facts.mate.theyHaveMateIn
    },
    allowed: {
      moves: [...vocab.moves],
      squares: [...vocab.squares],
      pieces: [...vocab.pieces]
    }
  };
  return JSON.stringify(payload, null, 2);
}
var RETRY_SUFFIX = "\n\nYour previous reply was not valid JSON in the required shape. Reply with ONLY the JSON object.";

// explain/narrator/template.ts
var LESSONS = {
  hangingPiece: "Before every move, check which of your pieces are attacked and whether they are still defended.",
  missedCapture: "Before every move, check whether your opponent has left a piece you can take for free.",
  fork: "Look for squares where one enemy piece could attack two of yours at once, and keep your pieces off them.",
  pin: "Be careful lining up one of your pieces in front of a more valuable one on an open line.",
  skewer: "Keep your most valuable pieces off the same open line.",
  discoveredAttack: "When an enemy piece blocks one of their long-range pieces, ask what happens if it moves.",
  backRankWeakness: "Make an escape square for your king before your back rank runs out of defenders.",
  missedMate: "Always check every check first: checks can end the game.",
  allowedMate: "Before every move, look at every check your opponent could give next.",
  trappedPiece: "Before grabbing material, make sure your piece will still have a safe way back.",
  overloadedDefender: "If one of your pieces is defending two things, it is defending neither well.",
  missedPromotion: "When a pawn can reach the last rank, check whether promoting right now wins.",
  kingSafetyBlunder: "Leave the pawns in front of your king alone unless you have a clear reason.",
  positionalLoss: "Compare a few candidate moves before you play, not just the first one you see."
};
function headline(t, facts) {
  const pieceOf = (i) => t.pieces[i]?.piece ?? "piece";
  const mine = t.side === "opponent";
  switch (t.tag) {
    case "hangingPiece":
      return `Your ${pieceOf(0)} was left undefended`;
    case "missedCapture":
      return `You missed a free ${pieceOf(0)}`;
    case "fork":
      return mine ? `Their ${pieceOf(0)} attacks two pieces at once` : `You missed a ${pieceOf(0)} fork`;
    case "pin":
      return mine ? `Your ${pieceOf(0)} gets pinned` : "You missed a winning pin";
    case "skewer":
      return mine ? `A skewer wins your ${pieceOf(2)}` : "You missed a winning skewer";
    case "discoveredAttack":
      return mine ? "A discovered attack costs you material" : "You missed a discovered attack";
    case "backRankWeakness":
      return mine ? "Your back rank was too weak" : "Their back rank was weak";
    case "missedMate":
      return "You missed checkmate";
    case "allowedMate":
      return "This move allows checkmate";
    case "trappedPiece":
      return `Your ${pieceOf(0)} gets trapped`;
    case "overloadedDefender":
      return `Your ${pieceOf(0)} had too many jobs`;
    case "missedPromotion":
      return "You missed a pawn promotion";
    case "kingSafetyBlunder":
      return "This move weakened your king";
    case "positionalLoss":
      return `${facts.best.san} was the stronger idea`;
  }
}
function sentence(s) {
  const t = s.trim().replace(/[.]+$/, "");
  if (/^[a-h][1-8x]/.test(t) || /^[KQRBN][a-h1-8x]/.test(t) || /^O-O/.test(t)) return `${t}.`;
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`;
}
function templateExplanation(facts, tags) {
  const top = tags[0];
  const played = facts.played.san;
  const best = facts.best.san;
  if (!top || top.tag === "positionalLoss") {
    return {
      headline: `${best} was the stronger idea`,
      explanation: `${sentence(`you played ${played}, which was simply weaker here`)} ${sentence(`${best} was the better idea`)}`,
      lesson: LESSONS.positionalLoss,
      highlightSquares: [facts.best.from, facts.best.to]
    };
  }
  const parts = [sentence(top.evidence)];
  const second = tags[1];
  if (second && second.tag !== "positionalLoss") parts.push(sentence(second.evidence));
  if (top.side === "opponent") parts.push(sentence(`you should have played ${best} instead`));
  else parts.push(sentence(`you played ${played} instead, and the chance was gone`));
  const squares = [.../* @__PURE__ */ new Set([...top.squares, ...second?.squares ?? []])].slice(0, 6);
  return {
    headline: headline(top, facts),
    explanation: parts.slice(0, 3).join(" "),
    lesson: LESSONS[top.tag],
    highlightSquares: squares
  };
}

// explain/narrator/validator.ts
function parseExplanation(raw) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not valid JSON" };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return { ok: false, reason: "not a JSON object" };
  const o = data;
  const { headline: headline2, explanation, lesson, highlightSquares } = o;
  if (typeof headline2 !== "string" || typeof explanation !== "string" || typeof lesson !== "string") {
    return { ok: false, reason: "missing headline/explanation/lesson strings" };
  }
  if (!Array.isArray(highlightSquares) || !highlightSquares.every((s) => typeof s === "string")) {
    return { ok: false, reason: "highlightSquares must be an array of strings" };
  }
  const squares = [];
  for (const s of highlightSquares) {
    const lower = s.trim().toLowerCase();
    if (!isSquare(lower)) return { ok: false, reason: `highlightSquares has a non-square "${s}"` };
    squares.push(lower);
  }
  return {
    ok: true,
    value: { headline: headline2.trim(), explanation: explanation.trim(), lesson: lesson.trim(), highlightSquares: squares }
  };
}
var PIECE_WORD = /\b(king|queen|rook|bishop|knight|pawn)s?\b/gi;
var SAN_TOKEN = /(?<![\w-])(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8](?:=[QRBN])?|[a-h][1-8]=[QRBN])[+#]?(?![\w-])/g;
var SQUARE_TOKEN = /(?<![\w])[a-h][1-8](?![\w])/g;
var JARGON = /centipawn|\bcp\b|\bevals?\b|\bevaluation\b|\bengine\b|stockfish|\bdepth\b|[+-]\d+\.\d|\d+(\.\d+)?\s*%|\bpoints?\b/i;
var CLAIMS = [
  { re: /\bfork/i, tags: ["fork"], name: "fork" },
  { re: /\bpin(s|ned|ning)?\b/i, tags: ["pin"], name: "pin" },
  { re: /\bskewer/i, tags: ["skewer"], name: "skewer" },
  { re: /\bdiscover/i, tags: ["discoveredAttack"], name: "discovered attack" },
  { re: /back[- ]rank/i, tags: ["backRankWeakness"], name: "back rank" },
  { re: /\btrap/i, tags: ["trappedPiece"], name: "trapped piece" },
  { re: /overload/i, tags: ["overloadedDefender"], name: "overloaded defender" },
  { re: /promot/i, tags: ["missedPromotion"], name: "promotion" },
  { re: /\bmate\b|checkmat|\bmates\b|\bmating\b/i, tags: ["allowedMate", "missedMate", "backRankWeakness"], name: "checkmate" }
];
function countSentences(s) {
  const cleaned = s.replace(/[+#]/g, "").trim();
  if (cleaned === "") return 0;
  return cleaned.split(/[.!?]+(?:\s+|$)/).filter((x) => x.trim() !== "").length;
}
var wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
function checkExplanation(e, vocab, tags) {
  const reasons = [];
  const text = `${e.headline}
${e.explanation}
${e.lesson}`;
  if (wordCount(e.headline) === 0 || wordCount(e.headline) > 8) reasons.push("headline must be 1-8 words");
  const n = countSentences(e.explanation);
  if (n < 2 || n > 3) reasons.push(`explanation must be 2-3 sentences (got ${n})`);
  if (countSentences(e.lesson) !== 1) reasons.push("lesson must be exactly 1 sentence");
  if (!/\byou(r|rs)?\b/i.test(e.explanation)) reasons.push('explanation must address the player as "you"');
  if (JARGON.test(text)) reasons.push("uses engine jargon or numbers");
  for (const m of text.matchAll(SAN_TOKEN)) {
    const san = stripSan(m[0]);
    if (!vocab.moves.has(san)) reasons.push(`move "${m[0]}" is not in the facts`);
  }
  const withoutSan = text.replace(SAN_TOKEN, " ");
  for (const m of withoutSan.matchAll(SQUARE_TOKEN)) {
    const sq = m[0];
    if (isSquare(sq) && !vocab.squares.has(sq)) reasons.push(`square "${sq}" is not in the facts`);
  }
  for (const m of text.matchAll(PIECE_WORD)) {
    const word = (m[1] ?? "").toLowerCase();
    if (!vocab.pieces.has(word)) reasons.push(`piece "${word}" is not in the facts`);
  }
  for (const sq of e.highlightSquares) {
    if (!vocab.squares.has(sq)) reasons.push(`highlight square "${sq}" is not in the facts`);
  }
  const tagSet = new Set(tags.map((t) => t.tag));
  for (const c of CLAIMS) {
    if (c.re.test(text) && !c.tags.some((t) => tagSet.has(t))) reasons.push(`claims a ${c.name} the analysis did not find`);
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons: [...new Set(reasons)] };
}

// explain/narrator/llm.ts
var LlmError = class extends Error {
  constructor(message, status = null) {
    super(message);
    this.status = status;
    this.name = "LlmError";
  }
  status;
};

// explain/narrator/gemini.ts
var DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
function extractText(body) {
  if (typeof body !== "object" || body === null) throw new LlmError("Gemini: response is not an object");
  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) throw new LlmError("Gemini: no candidates");
  const first = candidates[0];
  const parts = first.content?.parts;
  if (!Array.isArray(parts)) throw new LlmError("Gemini: no content parts");
  const text = parts.map((p) => typeof p.text === "string" ? p.text : "").join("");
  if (text.trim() === "") throw new LlmError("Gemini: empty text");
  return text;
}
var GeminiClient = class {
  apiKey;
  model;
  timeoutMs;
  doFetch;
  constructor(opts) {
    if (!opts.apiKey) throw new LlmError("Gemini: missing API key");
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_GEMINI_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 2e4;
    this.doFetch = opts.fetch ?? globalThis.fetch;
  }
  async complete(system, user) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
        }),
        signal: controller.signal
      });
      const raw = await res.text();
      if (!res.ok) throw new LlmError(`Gemini HTTP ${res.status}: ${raw.slice(0, 200)}`, res.status);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new LlmError("Gemini: response is not JSON");
      }
      return extractText(body);
    } catch (e) {
      if (e instanceof LlmError) throw e;
      throw new LlmError(`Gemini request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
};

// explain/narrator/openrouter.ts
var DEFAULT_OPENROUTER_MODEL = "openrouter/free";
function extractContent(body) {
  if (typeof body !== "object" || body === null) throw new LlmError("OpenRouter: response is not an object");
  const o = body;
  if (o.error && typeof o.error.message === "string") throw new LlmError(`OpenRouter: ${o.error.message}`);
  if (!Array.isArray(o.choices) || o.choices.length === 0) throw new LlmError("OpenRouter: no choices");
  const msg = o.choices[0].message;
  const content = msg?.content;
  if (typeof content !== "string" || content.trim() === "") throw new LlmError("OpenRouter: empty content");
  return { text: content, model: typeof o.model === "string" ? o.model : null };
}
var OpenRouterClient = class {
  apiKey;
  model;
  timeoutMs;
  doFetch;
  /** Which model actually answered the last request (the free router picks one). */
  lastModel = null;
  constructor(opts) {
    if (!opts.apiKey) throw new LlmError("OpenRouter: missing API key");
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_OPENROUTER_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 3e4;
    this.doFetch = opts.fetch ?? globalThis.fetch;
  }
  async complete(system, user) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Title": "Blunderwise"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4
        }),
        signal: controller.signal
      });
      const raw = await res.text();
      if (!res.ok) throw new LlmError(`OpenRouter HTTP ${res.status}: ${raw.slice(0, 200)}`, res.status);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new LlmError("OpenRouter: response is not JSON");
      }
      const { text, model } = extractContent(body);
      this.lastModel = model;
      return text;
    } catch (e) {
      if (e instanceof LlmError) throw e;
      throw new LlmError(`OpenRouter request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
};

// explain/index.ts
function explainInstantly(ctx) {
  const a = analyze(ctx);
  const tags = detectMotifs(a);
  return { facts: a.facts, tags, explanation: templateExplanation(a.facts, tags), source: "template", fromCache: false, rejections: [] };
}
async function explainMistake(ctx, opts = {}) {
  const a = analyze(ctx);
  const tags = detectMotifs(a);
  const vocab = buildVocabulary(a, tags);
  const cache = opts.cache ? new ExplanationCache(opts.cache) : null;
  const key = cacheKey(ctx.fen, ctx.movePlayedUci, PROMPT_VERSION);
  const cached = cache ? await cache.get(key) : null;
  if (cached) {
    return { facts: a.facts, tags, explanation: cached, source: "llm", fromCache: true, rejections: [] };
  }
  const rejections = [];
  if (opts.llm) {
    const user = buildUserPrompt(a.facts, tags, vocab);
    let parsed = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      try {
        const raw = await opts.llm.complete(SYSTEM_PROMPT, attempt === 0 ? user : user + RETRY_SUFFIX);
        const p = parseExplanation(raw);
        if (p.ok) parsed = p.value;
        else rejections.push(`parse: ${p.reason}`);
      } catch (e) {
        rejections.push(`llm: ${e instanceof Error ? e.message : String(e)}`);
        break;
      }
    }
    if (parsed) {
      const check = checkExplanation(parsed, vocab, tags);
      if (check.ok) {
        if (cache) await cache.set(key, parsed);
        return { facts: a.facts, tags, explanation: parsed, source: "llm", fromCache: false, rejections };
      }
      rejections.push(...check.reasons);
    }
  }
  return { facts: a.facts, tags, explanation: templateExplanation(a.facts, tags), source: "template", fromCache: false, rejections };
}

// main/coach.ts
var fenKey = (fen) => fen.split(" ").slice(0, 4).join(" ");
function uciOf(m) {
  return `${m.from}${m.to}${m.promotion ?? ""}`;
}
var CoachService = class {
  constructor(engines2, db2, settings) {
    this.engines = engines2;
    this.db = db2;
    this.settings = settings;
  }
  engines;
  db;
  settings;
  inflight = /* @__PURE__ */ new Map();
  /** Engine eval for the side to move, cached in SQLite and de-duplicated while in flight. */
  analyzeFen(fen, lane = "live") {
    const depth = this.settings.get().analysisDepth;
    const key = `${fenKey(fen)}@${depth}`;
    const chess = new import_chess5.Chess(fen);
    if (chess.isCheckmate()) return Promise.resolve({ cp: null, mate: -1, pv: [], bestMove: null });
    if (chess.isDraw() || chess.isStalemate()) return Promise.resolve({ cp: 0, mate: null, pv: [], bestMove: null });
    const cached = this.db.getAnalysis(fenKey(fen), depth);
    if (cached) return Promise.resolve(cached);
    const running = this.inflight.get(key);
    if (running) return running;
    const job = (lane === "bulk" ? this.engines.bulk() : this.engines.coach()).evaluate(fen, depth).then((e) => {
      this.db.putAnalysis(fenKey(fen), depth, e);
      return e;
    }).finally(() => this.inflight.delete(key));
    this.inflight.set(key, job);
    return job;
  }
  async prefetch(fen) {
    await this.analyzeFen(fen).catch(() => void 0);
  }
  async checkMove(req, lane = "live") {
    const chess = new import_chess5.Chess(req.fenBefore);
    const move = chess.move(parseUciMove(req.moveUci));
    const before = await this.analyzeFen(req.fenBefore, lane);
    const best = before.bestMove;
    const bestSan = best ? sanOf(req.fenBefore, best) : null;
    const base = { moveUci: req.moveUci, san: move.san, bestMoveUci: best, bestMoveSan: bestSan };
    const evalBefore = { cp: before.cp, mate: before.mate };
    const wpB = winProbability(evalBefore);
    if (chess.isCheckmate()) {
      return { ...base, classification: "good", winProbBefore: wpB, winProbAfter: 100, stop: false, ctx: null, instant: null };
    }
    const afterRaw = await this.analyzeFen(chess.fen(), lane);
    const evalAfter = negateScore({ cp: afterRaw.cp, mate: afterRaw.mate });
    const wpA = winProbability(evalAfter);
    let classification = classifyMove(wpB, wpA);
    if (best === req.moveUci) classification = "good";
    const flagged = classification !== "good" && !isDecidedEitherWay(wpB, wpA) && best !== null;
    if (!flagged || !best) {
      return { ...base, classification, winProbBefore: wpB, winProbAfter: wpA, stop: false, ctx: null, instant: null };
    }
    const ctx = {
      fen: req.fenBefore,
      movePlayedUci: req.moveUci,
      bestMoveUci: best,
      evalBefore,
      evalAfter,
      winProbBefore: wpB,
      winProbAfter: wpA,
      bestLine: before.pv.length > 0 ? before.pv : [best],
      refutationLine: afterRaw.pv,
      moveNumber: Number(req.fenBefore.split(" ")[5] ?? "1"),
      myColor: req.myColor
    };
    const stopOn = this.settings.get().stopOn;
    const stop = classification === "blunder" || stopOn === "mistake" && classification === "mistake";
    let instant = null;
    try {
      instant = explainInstantly(ctx);
    } catch (e) {
      console.error("explainInstantly failed", e);
    }
    return { ...base, classification, winProbBefore: wpB, winProbAfter: wpA, stop, ctx, instant };
  }
  /** The LLM for the selected provider, or null when that provider has no key (template-only). */
  llm(timeoutMs) {
    const s = this.settings.get();
    const key = this.settings.getApiKey(s.llmProvider);
    if (!key) return null;
    if (s.llmProvider === "openrouter") {
      const client2 = new OpenRouterClient({ apiKey: key, model: s.openrouterModel, timeoutMs });
      return { client: client2, label: `OpenRouter (${s.openrouterModel})`, lastModel: () => client2.lastModel };
    }
    const client = new GeminiClient({ apiKey: key, model: s.geminiModel, timeoutMs });
    return { client, label: `Gemini (${s.geminiModel})`, lastModel: () => null };
  }
  narrate(ctx) {
    return explainMistake(ctx, { llm: this.llm()?.client ?? null, cache: this.db.explanationStore() });
  }
  async testApiKey() {
    const llm = this.llm(3e4);
    if (!llm) return { ok: false, message: "No API key saved for this provider." };
    try {
      await llm.client.complete('Reply with the JSON object {"ok": true}.', "ping");
      const used = llm.lastModel();
      return { ok: true, message: `${llm.label} answered${used ? ` using ${used}` : ""}.` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }
  async reviewGame(pgn, myColor, onProgress, lane = "live") {
    const game = new import_chess5.Chess();
    game.loadPgn(pgn);
    const history = game.history({ verbose: true });
    const total = history.filter((m) => m.color === myColor).length;
    let done = 0;
    onProgress({ done, total });
    const out = [];
    for (const [ply, m] of history.entries()) {
      const mine = m.color === myColor;
      let check = null;
      if (mine) {
        check = await this.checkMove({ fenBefore: m.before, moveUci: uciOf(m), myColor }, lane);
        done += 1;
        onProgress({ done, total });
      }
      out.push({ ply, fenBefore: m.before, fenAfter: m.after, san: m.san, uci: uciOf(m), mine, check });
    }
    return out;
  }
};
function parseUciMove(uci) {
  const promotion = uci.length > 4 ? uci.slice(4, 5) : void 0;
  return promotion ? { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion } : { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}
function sanOf(fen, uci) {
  try {
    return new import_chess5.Chess(fen).move(parseUciMove(uci)).san;
  } catch {
    return null;
  }
}

// main/db.ts
var import_node_sqlite = require("node:sqlite");
var Db = class _Db {
  db;
  constructor(file) {
    this.db = new import_node_sqlite.DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        my_color TEXT NOT NULL,
        opponent TEXT NOT NULL,
        result TEXT NOT NULL,
        pgn TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS analyses (
        fen TEXT NOT NULL,
        depth INTEGER NOT NULL,
        cp INTEGER,
        mate INTEGER,
        pv TEXT NOT NULL,
        best TEXT,
        PRIMARY KEY (fen, depth)
      );
      CREATE TABLE IF NOT EXISTS explanations (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mistakes (
        game_id INTEGER NOT NULL,
        ply INTEGER NOT NULL,
        fen TEXT NOT NULL,
        played_uci TEXT NOT NULL,
        played_san TEXT NOT NULL,
        best_uci TEXT NOT NULL,
        best_san TEXT NOT NULL,
        classification TEXT NOT NULL,
        phase TEXT NOT NULL,
        tags TEXT NOT NULL,
        sides TEXT NOT NULL,
        win_before REAL NOT NULL,
        win_after REAL NOT NULL,
        PRIMARY KEY (game_id, ply)
      );
      CREATE TABLE IF NOT EXISTS drills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fen TEXT NOT NULL,
        my_color TEXT NOT NULL,
        played_uci TEXT NOT NULL,
        played_san TEXT NOT NULL,
        best_uci TEXT NOT NULL,
        best_san TEXT NOT NULL,
        classification TEXT NOT NULL,
        tags TEXT NOT NULL,
        game_id INTEGER,
        created_at INTEGER NOT NULL,
        due_at INTEGER NOT NULL,
        interval_days REAL NOT NULL,
        ease REAL NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        UNIQUE (fen, played_uci)
      );
    `);
    this.migrate();
  }
  /** Add columns introduced after the first release. */
  migrate() {
    const cols = new Set(
      this.db.prepare("PRAGMA table_info(games)").all().map((c) => c.name)
    );
    if (!cols.has("source")) this.db.exec("ALTER TABLE games ADD COLUMN source TEXT NOT NULL DEFAULT 'bot'");
    if (!cols.has("external_id")) this.db.exec("ALTER TABLE games ADD COLUMN external_id TEXT");
    if (!cols.has("analyzed")) this.db.exec("ALTER TABLE games ADD COLUMN analyzed INTEGER NOT NULL DEFAULT 0");
    if (!cols.has("my_moves")) this.db.exec("ALTER TABLE games ADD COLUMN my_moves INTEGER NOT NULL DEFAULT 0");
    this.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS games_external ON games(external_id) WHERE external_id IS NOT NULL");
  }
  /** Insert imported games, skipping ones already in the library. Returns how many were new. */
  importGames(games) {
    const stmt = this.db.prepare(
      "INSERT OR IGNORE INTO games (created_at, my_color, opponent, result, pgn, source, external_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    let added = 0;
    for (const g of games) {
      const r = stmt.run(g.playedAt, g.myColor, g.opponent, g.result, g.pgn, g.source, g.externalId);
      added += Number(r.changes);
    }
    return added;
  }
  unanalyzedGameIds() {
    return this.db.prepare("SELECT id FROM games WHERE analyzed = 0 ORDER BY created_at DESC").all().map(
      (r) => Number(r.id)
    );
  }
  /** Replace a game's stored mistakes and mark it analyzed. */
  storeAnalysis(gameId, myMoves, rows) {
    this.db.prepare("DELETE FROM mistakes WHERE game_id = ?").run(gameId);
    const ins = this.db.prepare(
      "INSERT INTO mistakes (game_id, ply, fen, played_uci, played_san, best_uci, best_san, classification, phase, tags, sides, win_before, win_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const m of rows) {
      ins.run(gameId, m.ply, m.fen, m.playedUci, m.playedSan, m.bestUci, m.bestSan, m.classification, m.phase, m.tags.join(","), m.sides.join(","), m.winBefore, m.winAfter);
    }
    this.db.prepare("UPDATE games SET analyzed = 1, my_moves = ? WHERE id = ?").run(myMoves, gameId);
  }
  /** Create a drill unless the same position + move is already a drill. */
  addDrill(d, card) {
    this.db.prepare(
      "INSERT OR IGNORE INTO drills (fen, my_color, played_uci, played_san, best_uci, best_san, classification, tags, game_id, created_at, due_at, interval_days, ease, reps, lapses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(d.fen, d.myColor, d.playedUci, d.playedSan, d.bestUci, d.bestSan, d.classification, d.tags.join(","), d.gameId, Date.now(), card.dueAt, card.intervalDays, card.ease, card.reps, card.lapses);
  }
  static toDrill(r) {
    return {
      id: Number(r.id),
      fen: String(r.fen),
      myColor: r.my_color === "b" ? "b" : "w",
      playedUci: String(r.played_uci),
      playedSan: String(r.played_san),
      bestUci: String(r.best_uci),
      bestSan: String(r.best_san),
      classification: String(r.classification),
      tags: String(r.tags).split(",").filter(Boolean),
      gameId: r.game_id === null ? null : Number(r.game_id),
      dueAt: Number(r.due_at),
      intervalDays: Number(r.interval_days),
      ease: Number(r.ease),
      reps: Number(r.reps),
      lapses: Number(r.lapses)
    };
  }
  /** Due drills, most-missed first. `tag` filters to drills carrying that motif. */
  dueDrills(now, tag, limit) {
    const rows = tag ? this.db.prepare("SELECT * FROM drills WHERE due_at <= ? AND (',' || tags || ',') LIKE ? ORDER BY lapses DESC, due_at ASC LIMIT ?").all(now, `%,${tag},%`, limit) : this.db.prepare("SELECT * FROM drills WHERE due_at <= ? ORDER BY lapses DESC, due_at ASC LIMIT ?").all(now, limit);
    return rows.map((r) => _Db.toDrill(r));
  }
  getDrill(id) {
    const r = this.db.prepare("SELECT * FROM drills WHERE id = ?").get(id);
    return r ? _Db.toDrill(r) : null;
  }
  updateDrill(id, card) {
    this.db.prepare("UPDATE drills SET due_at = ?, interval_days = ?, ease = ?, reps = ?, lapses = ? WHERE id = ?").run(card.dueAt, card.intervalDays, card.ease, card.reps, card.lapses, id);
  }
  drillCounts(now) {
    const total = Number(this.db.prepare("SELECT COUNT(*) AS n FROM drills").get().n);
    const due = Number(this.db.prepare("SELECT COUNT(*) AS n FROM drills WHERE due_at <= ?").get(now).n);
    const next = this.db.prepare("SELECT MIN(due_at) AS t FROM drills WHERE due_at > ?").get(now);
    return { total, due, nextDueAt: next.t === null ? null : Number(next.t) };
  }
  report() {
    const g = this.db.prepare("SELECT COUNT(*) AS games, COALESCE(SUM(my_moves), 0) AS moves FROM games WHERE analyzed = 1").get();
    const rows = this.db.prepare("SELECT classification, phase, tags, sides FROM mistakes").all();
    const byClass = { inaccuracy: 0, mistake: 0, blunder: 0 };
    const tagMap = /* @__PURE__ */ new Map();
    const phaseMap = /* @__PURE__ */ new Map();
    for (const r of rows) {
      if (r.classification === "inaccuracy" || r.classification === "mistake" || r.classification === "blunder") byClass[r.classification] += 1;
      if (r.classification === "inaccuracy") continue;
      const isBlunder = r.classification === "blunder" ? 1 : 0;
      const ph = phaseMap.get(r.phase) ?? { count: 0, blunders: 0 };
      phaseMap.set(r.phase, { count: ph.count + 1, blunders: ph.blunders + isBlunder });
      const tags = r.tags.split(",").filter(Boolean);
      const sides = r.sides.split(",");
      tags.forEach((t, i) => {
        const e = tagMap.get(t) ?? { count: 0, allowed: 0, missed: 0, blunders: 0 };
        const allowed = sides[i] === "opponent" ? 1 : 0;
        tagMap.set(t, { count: e.count + 1, allowed: e.allowed + allowed, missed: e.missed + (1 - allowed), blunders: e.blunders + isBlunder });
      });
    }
    return {
      gamesAnalyzed: Number(g.games),
      myMoves: Number(g.moves),
      byClassification: byClass,
      byTag: [...tagMap].map(([tag, v]) => ({ tag, ...v })).sort((a, b) => b.count - a.count),
      byPhase: [...phaseMap].map(([phase, v]) => ({ phase, ...v }))
    };
  }
  saveGame(g) {
    const r = this.db.prepare("INSERT INTO games (created_at, my_color, opponent, result, pgn) VALUES (?, ?, ?, ?, ?)").run((/* @__PURE__ */ new Date()).toISOString(), g.myColor, g.opponent, g.result, g.pgn);
    return Number(r.lastInsertRowid);
  }
  static toGame(row) {
    return {
      id: Number(row.id),
      source: row.source === "lichess" || row.source === "chesscom" ? row.source : "bot",
      analyzed: Number(row.analyzed ?? 0) === 1,
      createdAt: String(row.created_at),
      myColor: row.my_color === "b" ? "b" : "w",
      opponent: String(row.opponent),
      result: String(row.result),
      pgn: String(row.pgn)
    };
  }
  listGames() {
    return this.db.prepare("SELECT * FROM games ORDER BY created_at DESC LIMIT 500").all().map((r) => _Db.toGame(r));
  }
  getGame(id) {
    const row = this.db.prepare("SELECT * FROM games WHERE id = ?").get(id);
    return row ? _Db.toGame(row) : null;
  }
  getAnalysis(fenKey2, depth) {
    const row = this.db.prepare("SELECT * FROM analyses WHERE fen = ? AND depth >= ? ORDER BY depth DESC LIMIT 1").get(fenKey2, depth);
    if (!row) return null;
    return {
      cp: row.cp === null ? null : Number(row.cp),
      mate: row.mate === null ? null : Number(row.mate),
      pv: String(row.pv).split(" ").filter(Boolean),
      bestMove: row.best === null ? null : String(row.best)
    };
  }
  putAnalysis(fenKey2, depth, e) {
    this.db.prepare("INSERT OR REPLACE INTO analyses (fen, depth, cp, mate, pv, best) VALUES (?, ?, ?, ?, ?, ?)").run(fenKey2, depth, e.cp, e.mate, e.pv.join(" "), e.bestMove);
  }
  getSetting(key) {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? row.value : null;
  }
  setSetting(key, value2) {
    if (value2 === null) this.db.prepare("DELETE FROM settings WHERE key = ?").run(key);
    else this.db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value2);
  }
  /** Explanation cache for the pipeline. */
  explanationStore() {
    return {
      get: (key) => {
        const row = this.db.prepare("SELECT value FROM explanations WHERE key = ?").get(key);
        return Promise.resolve(row ? row.value : null);
      },
      set: (key, value2) => {
        this.db.prepare("INSERT OR REPLACE INTO explanations (key, value) VALUES (?, ?)").run(key, value2);
        return Promise.resolve();
      }
    };
  }
  close() {
    this.db.close();
  }
};

// main/engineManager.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);

// main/uciEngine.ts
var import_node_child_process = require("node:child_process");
var import_node_readline = require("node:readline");

// engine/uci.ts
function parseInfo(line) {
  if (!line.startsWith("info ")) return null;
  const t = line.split(/\s+/);
  let depth = null;
  let multipv = 1;
  let cp = null;
  let mate = null;
  let pv = [];
  for (let i = 1; i < t.length; i++) {
    const k = t[i];
    if (k === "depth") depth = Number(t[++i]);
    else if (k === "multipv") multipv = Number(t[++i]);
    else if (k === "score") {
      const kind = t[++i];
      const v = Number(t[++i]);
      if (kind === "cp") cp = v;
      else if (kind === "mate") mate = v;
      if (t[i + 1] === "lowerbound" || t[i + 1] === "upperbound") i++;
    } else if (k === "pv") {
      pv = t.slice(i + 1).filter(Boolean);
      break;
    } else if (k === "string") break;
  }
  if (cp === null && mate === null) return null;
  return { depth, multipv, cp, mate, pv };
}
function parseBestMove(line) {
  if (!line.startsWith("bestmove")) return void 0;
  const mv = line.split(/\s+/)[1];
  return mv && mv !== "(none)" && mv !== "0000" ? mv : null;
}
function goCommand(opts) {
  if (opts.nodes !== void 0) return `go nodes ${opts.nodes}`;
  if (opts.depth !== void 0) return `go depth ${opts.depth}`;
  return `go movetime ${opts.movetimeMs ?? 500}`;
}

// main/uciEngine.ts
var UciEngine = class {
  name;
  proc;
  listeners = /* @__PURE__ */ new Set();
  queue = Promise.resolve();
  ready;
  sentOptions = /* @__PURE__ */ new Map();
  dead = null;
  timeoutMs;
  constructor(opts) {
    this.name = opts.name;
    this.timeoutMs = opts.searchTimeoutMs ?? 6e4;
    this.proc = (0, import_node_child_process.spawn)(opts.path, [...opts.args ?? []], { stdio: "pipe" });
    this.proc.on("error", (e) => this.fail(e));
    this.proc.on("exit", (code) => this.fail(new Error(`${opts.name} exited with code ${code ?? "null"}`)));
    (0, import_node_readline.createInterface)({ input: this.proc.stdout }).on("line", (line) => {
      for (const l of [...this.listeners]) l(line.trim());
    });
    this.proc.stderr.resume();
    this.ready = (async () => {
      this.send("uci");
      await this.waitFor((l) => l === "uciok", 1e4);
      for (const [k, v] of Object.entries(opts.options ?? {})) this.setOption(k, v);
      await this.sync();
    })();
  }
  fail(e) {
    if (!this.dead) this.dead = e;
    for (const l of [...this.listeners]) l("__dead__");
  }
  get alive() {
    return this.dead === null;
  }
  async whenReady() {
    await this.ready;
  }
  send(cmd) {
    if (this.dead) throw this.dead;
    this.proc.stdin.write(`${cmd}
`);
  }
  setOption(name, value2) {
    if (this.sentOptions.get(name) === value2) return;
    this.send(`setoption name ${name} value ${value2}`);
    this.sentOptions.set(name, value2);
  }
  waitFor(test, timeoutMs, onLine) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`${this.name}: timed out`));
      }, timeoutMs);
      const listener = (line) => {
        if (line === "__dead__") {
          clearTimeout(timer);
          this.listeners.delete(listener);
          reject(this.dead ?? new Error(`${this.name} died`));
          return;
        }
        onLine?.(line);
        if (test(line)) {
          clearTimeout(timer);
          this.listeners.delete(listener);
          resolve(line);
        }
      };
      this.listeners.add(listener);
    });
  }
  async sync() {
    this.send("isready");
    await this.waitFor((l) => l === "readyok", 1e4);
  }
  run(job) {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => void 0);
    return next;
  }
  search(fen, go, options) {
    return this.run(async () => {
      await this.ready;
      for (const [k, v] of Object.entries(options)) this.setOption(k, v);
      this.send(`position fen ${fen}`);
      await this.sync();
      let cp = 0;
      let mate = null;
      let pv = [];
      const onLine = (line) => {
        const info = parseInfo(line);
        if (!info || info.multipv !== 1) return;
        cp = info.cp;
        mate = info.mate;
        if (info.pv.length > 0) pv = info.pv;
      };
      this.send(go);
      const done = await this.waitFor((l) => parseBestMove(l) !== void 0, this.timeoutMs, onLine);
      const bestMove = parseBestMove(done) ?? null;
      return { cp: mate === null ? cp : null, mate, pv, bestMove };
    });
  }
  evaluate(fen, depth) {
    return this.search(fen, goCommand({ depth }), {});
  }
  getBestMove(fen, opts) {
    const options = {};
    if (opts.skill !== void 0) options["Skill Level"] = String(Math.max(0, Math.min(20, Math.round(opts.skill))));
    return this.search(fen, goCommand(opts), options);
  }
  dispose() {
    try {
      this.send("quit");
    } catch {
    }
    setTimeout(() => this.proc.kill(), 300);
  }
};

// main/engineManager.ts
var STOCKFISH_CANDIDATES = ["/usr/bin/stockfish", "/usr/local/bin/stockfish", "/usr/games/stockfish"];
var LC0_CANDIDATES = ["/usr/bin/lc0", "/usr/local/bin/lc0"];
function firstExisting(paths) {
  for (const p of paths) if (p && (0, import_node_fs.existsSync)(p)) return p;
  return null;
}
function inPath(bin) {
  for (const dir of (process.env.PATH ?? "").split(import_node_path.default.delimiter)) {
    const p = import_node_path.default.join(dir, bin);
    if (dir && (0, import_node_fs.existsSync)(p)) return p;
  }
  return null;
}
function resolveStockfish(settings, resourcesDir) {
  return firstExisting([
    settings.stockfishPath,
    process.env.STOCKFISH_PATH ?? "",
    import_node_path.default.join(resourcesDir, "engines", "stockfish"),
    // bundled with the Flatpak
    ...STOCKFISH_CANDIDATES,
    inPath("stockfish") ?? ""
  ]);
}
var IN_FLATPAK = Boolean(process.env.FLATPAK_ID) || (0, import_node_fs.existsSync)("/.flatpak-info");
function resolveLc0Launch(settings, inFlatpak = IN_FLATPAK, exists = import_node_fs.existsSync) {
  const candidates = [settings.lc0Path, process.env.LC0_PATH ?? "", ...LC0_CANDIDATES].filter(Boolean);
  if (!inFlatpak) {
    const p = candidates.find((c) => exists(c)) ?? inPath("lc0");
    return p ? { path: p, args: [], display: p } : null;
  }
  for (const c of candidates) {
    if (exists(c)) return { path: c, args: [], display: c };
    if (c.startsWith("/") && exists(`/run/host${c}`)) return { path: "flatpak-spawn", args: ["--host", c], display: `${c} (host)` };
  }
  return null;
}
function resolveLc0(settings) {
  return resolveLc0Launch(settings)?.display ?? null;
}
function findMaiaWeights(dir) {
  const out = /* @__PURE__ */ new Map();
  if (!dir || !(0, import_node_fs.existsSync)(dir)) return out;
  for (const f of (0, import_node_fs.readdirSync)(dir)) {
    const m = /^maia-(\d{4})\.pb(\.gz)?$/.exec(f);
    if (m?.[1]) out.set(Number(m[1]), import_node_path.default.join(dir, f));
  }
  return new Map([...out].sort((a, b) => a[0] - b[0]));
}
var EngineManager = class {
  constructor(getSettings, resourcesDir) {
    this.getSettings = getSettings;
    this.resourcesDir = resourcesDir;
  }
  getSettings;
  resourcesDir;
  coachEngine = null;
  opponentEngine = null;
  bulkEngine = null;
  maia = /* @__PURE__ */ new Map();
  stockfishPath = null;
  stockfishError = null;
  startStockfish(name, threads) {
    this.stockfishPath = resolveStockfish(this.getSettings(), this.resourcesDir);
    if (!this.stockfishPath) {
      this.stockfishError = IN_FLATPAK ? "The bundled Stockfish is missing from this build." : "Stockfish not found. Install it (paru -S stockfish) or set its path in Settings.";
      return null;
    }
    this.stockfishError = null;
    return new UciEngine({ name, path: this.stockfishPath, options: { Threads: threads, Hash: "64" } });
  }
  coach() {
    if (!this.coachEngine || !this.coachEngine.alive) this.coachEngine = this.startStockfish("stockfish-coach", "2");
    if (!this.coachEngine) throw new Error(this.stockfishError ?? "Stockfish unavailable");
    return this.coachEngine;
  }
  /** Separate engine for background analysis (imports, auto-analysis) so live coaching never waits behind it. */
  bulk() {
    if (!this.bulkEngine || !this.bulkEngine.alive) this.bulkEngine = this.startStockfish("stockfish-bulk", "2");
    if (!this.bulkEngine) throw new Error(this.stockfishError ?? "Stockfish unavailable");
    return this.bulkEngine;
  }
  opponent() {
    if (!this.opponentEngine || !this.opponentEngine.alive) this.opponentEngine = this.startStockfish("stockfish-opponent", "1");
    if (!this.opponentEngine) throw new Error(this.stockfishError ?? "Stockfish unavailable");
    return this.opponentEngine;
  }
  maiaEngine(rating) {
    const existing = this.maia.get(rating);
    if (existing?.alive) return existing;
    const s = this.getSettings();
    const lc0 = resolveLc0Launch(s);
    if (!lc0) throw new Error("lc0 not found. Install lc0 (paru -S lc0) or set its path in Settings.");
    const weights = findMaiaWeights(s.maiaWeightsDir).get(rating);
    if (!weights) throw new Error(`No Maia weights for ${rating} in ${s.maiaWeightsDir || "(no folder set)"}`);
    const e = new UciEngine({ name: `maia-${rating}`, path: lc0.path, args: [...lc0.args, `--weights=${weights}`], options: { Threads: "1" } });
    this.maia.set(rating, e);
    return e;
  }
  async status() {
    let sfOk = false;
    let sfErr = null;
    try {
      await this.coach().whenReady();
      sfOk = true;
    } catch (e) {
      sfErr = e instanceof Error ? e.message : String(e);
    }
    const s = this.getSettings();
    const lc0 = resolveLc0(s);
    const ratings = [...findMaiaWeights(s.maiaWeightsDir).keys()];
    let maiaErr = null;
    if (!lc0) maiaErr = "lc0 not found";
    else if (ratings.length === 0) maiaErr = "No Maia weight files (maia-XXXX.pb.gz) in the weights folder";
    return {
      stockfish: { ok: sfOk, path: this.stockfishPath, error: sfErr },
      maia: { ok: maiaErr === null, lc0Path: lc0, ratings, error: maiaErr }
    };
  }
  restart() {
    this.dispose();
  }
  dispose() {
    this.coachEngine?.dispose();
    this.opponentEngine?.dispose();
    this.bulkEngine?.dispose();
    this.bulkEngine = null;
    for (const e of this.maia.values()) e.dispose();
    this.coachEngine = null;
    this.opponentEngine = null;
    this.maia.clear();
  }
};

// main/settings.ts
var import_electron = require("electron");
var DEFAULT_SETTINGS = {
  stopOn: "blunder",
  botMovetimeMs: 400,
  analysisDepth: 16,
  llmProvider: "gemini",
  geminiModel: DEFAULT_GEMINI_MODEL,
  openrouterModel: DEFAULT_OPENROUTER_MODEL,
  stockfishPath: "",
  lc0Path: "",
  maiaWeightsDir: "",
  lichessUsername: "",
  chesscomUsername: ""
};
var KEY_SETTING = { gemini: "geminiKey", openrouter: "openrouterKey" };
function clampInt(v, lo, hi, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fallback;
}
function sanitize(raw, base) {
  const stopOn = raw.stopOn === "mistake" || raw.stopOn === "blunder" ? raw.stopOn : base.stopOn;
  return {
    stopOn,
    botMovetimeMs: clampInt(raw.botMovetimeMs ?? base.botMovetimeMs, 50, 1e4, base.botMovetimeMs),
    analysisDepth: clampInt(raw.analysisDepth ?? base.analysisDepth, 8, 30, base.analysisDepth),
    llmProvider: raw.llmProvider === "openrouter" || raw.llmProvider === "gemini" ? raw.llmProvider : base.llmProvider,
    geminiModel: typeof raw.geminiModel === "string" && raw.geminiModel.trim() ? raw.geminiModel.trim() : base.geminiModel,
    openrouterModel: typeof raw.openrouterModel === "string" && raw.openrouterModel.trim() ? raw.openrouterModel.trim() : base.openrouterModel,
    stockfishPath: typeof raw.stockfishPath === "string" ? raw.stockfishPath.trim() : base.stockfishPath,
    lc0Path: typeof raw.lc0Path === "string" ? raw.lc0Path.trim() : base.lc0Path,
    maiaWeightsDir: typeof raw.maiaWeightsDir === "string" ? raw.maiaWeightsDir.trim() : base.maiaWeightsDir,
    lichessUsername: typeof raw.lichessUsername === "string" ? raw.lichessUsername.trim() : base.lichessUsername,
    chesscomUsername: typeof raw.chesscomUsername === "string" ? raw.chesscomUsername.trim() : base.chesscomUsername
  };
}
var SettingsStore = class {
  constructor(db2) {
    this.db = db2;
    let stored = {};
    try {
      stored = JSON.parse(db2.getSetting("settings") ?? "{}");
    } catch {
      stored = {};
    }
    this.cached = sanitize(stored, DEFAULT_SETTINGS);
  }
  db;
  cached;
  get() {
    return this.cached;
  }
  set(patch) {
    this.cached = sanitize({ ...this.cached, ...patch }, this.cached);
    this.db.setSetting("settings", JSON.stringify(this.cached));
    return this.cached;
  }
  keyStatus(provider) {
    const backend = process.platform === "linux" ? import_electron.safeStorage.getSelectedStorageBackend() : "os";
    const encrypted = import_electron.safeStorage.isEncryptionAvailable() && backend !== "basic_text";
    return { hasKey: this.db.getSetting(KEY_SETTING[provider]) !== null, storageBackend: backend, encrypted };
  }
  /** Stores an API key encrypted with the OS keyring (KWallet / GNOME keyring via safeStorage). */
  setApiKey(provider, key) {
    const name = KEY_SETTING[provider];
    if (key === null || key.trim() === "") {
      this.db.setSetting(name, null);
    } else if (import_electron.safeStorage.isEncryptionAvailable()) {
      this.db.setSetting(name, `enc:${import_electron.safeStorage.encryptString(key.trim()).toString("base64")}`);
    } else {
      this.db.setSetting(name, `plain:${key.trim()}`);
    }
    return this.keyStatus(provider);
  }
  getApiKey(provider) {
    const v = this.db.getSetting(KEY_SETTING[provider]);
    if (!v) return null;
    if (v.startsWith("plain:")) return v.slice(6);
    if (v.startsWith("enc:")) {
      try {
        return import_electron.safeStorage.decryptString(Buffer.from(v.slice(4), "base64"));
      } catch {
        return null;
      }
    }
    return null;
  }
};

// main/main.ts
import_electron2.app.commandLine.appendSwitch("ozone-platform-hint", "auto");
var db = null;
var engines = null;
function createWindow() {
  const win = new import_electron2.BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Blunderwise",
    backgroundColor: "#1e1f22",
    webPreferences: {
      preload: import_node_path2.default.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void import_electron2.shell.openExternal(url);
    return { action: "deny" };
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(import_node_path2.default.join(__dirname, "../renderer/index.html"));
  return win;
}
void import_electron2.app.whenReady().then(() => {
  db = new Db(import_node_path2.default.join(import_electron2.app.getPath("userData"), "blunderwise.sqlite"));
  const settings = new SettingsStore(db);
  engines = new EngineManager(() => settings.get(), process.resourcesPath);
  const coach = new CoachService(engines, db, settings);
  const library = new Library(db, coach);
  const store = db;
  const eng = engines;
  import_electron2.ipcMain.handle(IPC.engineStatus, () => eng.status());
  import_electron2.ipcMain.handle(IPC.engineRestart, () => {
    eng.restart();
    return eng.status();
  });
  import_electron2.ipcMain.handle(IPC.botMove, async (_e, req) => {
    const r = req.opponent === "maia" ? await eng.maiaEngine(req.maiaRating).getBestMove(req.fen, { nodes: 1 }) : await eng.opponent().getBestMove(req.fen, { skill: req.skill, movetimeMs: req.movetimeMs });
    return r.bestMove;
  });
  import_electron2.ipcMain.handle(IPC.prefetch, (_e, fen) => coach.prefetch(fen));
  import_electron2.ipcMain.handle(IPC.checkMove, (_e, req) => coach.checkMove(req));
  import_electron2.ipcMain.handle(IPC.narrate, (_e, ctx) => coach.narrate(ctx));
  import_electron2.ipcMain.handle(IPC.hint, async (_e, fen) => (await coach.analyzeFen(fen)).bestMove);
  import_electron2.ipcMain.handle(IPC.gamesSave, (_e, req) => {
    const id = store.saveGame(req);
    library.analyzeInBackground(id);
    return id;
  });
  import_electron2.ipcMain.handle(IPC.importLichess, (_e, username, max) => {
    settings.set({ lichessUsername: username });
    return library.importLichess(username, max);
  });
  import_electron2.ipcMain.handle(IPC.importChessCom, (_e, username, max) => {
    settings.set({ chesscomUsername: username });
    return library.importChessCom(username, max);
  });
  import_electron2.ipcMain.handle(IPC.analyzeAll, (e) => library.analyzeAll((p) => e.sender.send(IPC.libraryProgress, p)));
  import_electron2.ipcMain.handle(IPC.analyzeGame, (_e, id) => library.analyzeGame(id));
  import_electron2.ipcMain.handle(IPC.report, () => store.report());
  import_electron2.ipcMain.handle(IPC.drillsDue, (_e, tag, limit) => store.dueDrills(Date.now(), tag, limit));
  import_electron2.ipcMain.handle(IPC.drillsCounts, () => store.drillCounts(Date.now()));
  import_electron2.ipcMain.handle(IPC.drillsAnswer, (_e, id, uci) => library.answerDrill(id, uci));
  import_electron2.ipcMain.handle(IPC.gamesList, () => store.listGames());
  import_electron2.ipcMain.handle(IPC.gamesGet, (_e, id) => store.getGame(id));
  import_electron2.ipcMain.handle(
    IPC.reviewAnalyze,
    (e, pgn, myColor) => coach.reviewGame(pgn, myColor, (p) => e.sender.send(IPC.reviewProgress, p))
  );
  import_electron2.ipcMain.handle(IPC.settingsGet, () => settings.get());
  import_electron2.ipcMain.handle(IPC.settingsSet, (_e, patch) => {
    const before = settings.get();
    const next = settings.set(patch);
    if (before.stockfishPath !== next.stockfishPath || before.lc0Path !== next.lc0Path || before.maiaWeightsDir !== next.maiaWeightsDir) {
      eng.restart();
    }
    return next;
  });
  import_electron2.ipcMain.handle(IPC.keyStatus, (_e, provider) => settings.keyStatus(provider));
  import_electron2.ipcMain.handle(IPC.setApiKey, (_e, provider, key) => settings.setApiKey(provider, key));
  import_electron2.ipcMain.handle(IPC.testApiKey, () => coach.testApiKey());
  createWindow();
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
import_electron2.app.on("window-all-closed", () => {
  engines?.dispose();
  db?.close();
  import_electron2.app.quit();
});
/*! Bundled license information:

chess.js/dist/cjs/chess.js:
  (**
   * @license
   * Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   *    this list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the documentation
   *    and/or other materials provided with the distribution.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=main.cjs.map
