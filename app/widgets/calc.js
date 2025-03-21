/*
 * The Calculator widget.
 */
define(function() {
    return {
        id: 28,
        sort: 230,
        size: 4,
        order: 20,
        nicename: "calc",
        sizes: ["tiny", "small", "medium"],
        settings: [
            {
                type: "size"
            }
        ],
        config: {
            size: "medium"
        },
        render: function() {
            /*
                This calculator works for the most part, but can't really be expanded.

                If it needs to be it should be rewritten so problems are stored as an array, like so:

                    ["2", " x ", "3.14", " + ", ["2", " x ", ["sqrt", ["2", " + ", "3"]]]]

                That would be rendered as: 2 x 3.14 + (2 x √(2 + 3)).

                The syntax can be easily expanded so the calculator supports sin, cos, tan, square roots, exponents, etc.

                This also makes decimal point validation easier, and makes sure there are no missing parentheses or consecutive operators.

                But, right now it's unnecessary.
            */

            this.utils.render();

            var btns = this.elm.find("button"),
                display = this.elm.find(".display"),
                d0 = display[0],
                overwrite = false,
                nums = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
                f,
                that = this;

            // Safe expression evaluator
            var safeEvaluator = {
                // Tokenize the expression into an array of tokens
                tokenize: function(expr) {
                    // Replace operators with standardized versions
                    expr = expr
                        .replace(/×/g, "*") // Multiplication symbol with *
                        .replace(/x/gi, "*") // x with *
                        .replace(/÷/g, "/"); // Division symbol with /
                    
                    // Create a regular expression to match numbers, operators, and parentheses
                    var regex = /(\d+\.?\d*)|(\+|\-|\*|\/|\(|\))/g;
                    var tokens = [];
                    var match;
                    
                    // Extract tokens
                    while ((match = regex.exec(expr)) !== null) {
                        tokens.push(match[0]);
                    }
                    
                    return tokens;
                },
                
                // Parse tokens with operator precedence
                parse: function(tokens) {
                    var pos = 0;
                    
                    // Parse expression with operator precedence
                    function parseExpression() {
                        var left = parseTerm();
                        
                        while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
                            var operator = tokens[pos++];
                            var right = parseTerm();
                            left = [left, operator, right];
                        }
                        
                        return left;
                    }
                    
                    // Parse term (multiplication/division)
                    function parseTerm() {
                        var left = parseFactor();
                        
                        while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
                            var operator = tokens[pos++];
                            var right = parseFactor();
                            left = [left, operator, right];
                        }
                        
                        return left;
                    }
                    
                    // Parse factor (number or parenthesized expression)
                    function parseFactor() {
                        if (tokens[pos] === "(") {
                            pos++; // Skip opening parenthesis
                            var result = parseExpression();
                            pos++; // Skip closing parenthesis
                            return result;
                        } else {
                            // Parse number
                            return parseFloat(tokens[pos++]);
                        }
                    }
                    
                    return parseExpression();
                },
                
                // Evaluate the parsed expression tree
                evaluate: function(expr) {
                    // Base case: if it's a number, return it
                    if (typeof expr === 'number') {
                        return expr;
                    }
                    
                    // Recursive case: evaluate the operation
                    var left = this.evaluate(expr[0]);
                    var operator = expr[1];
                    var right = this.evaluate(expr[2]);
                    
                    switch (operator) {
                        case '+': return left + right;
                        case '-': return left - right;
                        case '*': return left * right;
                        case '/': return left / right;
                        default: throw new Error('Unknown operator: ' + operator);
                    }
                },
                
                // Main function to evaluate an expression
                calc: function(expression) {
                    var tokens = this.tokenize(expression);
                    var parsedExpr = this.parse(tokens);
                    return this.evaluate(parsedExpr);
                }
            };

            var calculate = function() {
                var problem = d0.value
                    .replace(/×/g, "*") // Multiplication symbol with *
                    .replace(/x/gi, "*") // x with *
                    .replace(/÷/g, "/") // Division symbol with /
                    .replace(/[^ +\-()1234567890*\/\.]|[\-+\/\*\.]{2}/g, "") // Replace all invalid characters
                    .replace(/ {1,}/g, " ") // Multiple spaces
                    .replace(/([0-9]) ([0-9])/g, "$1$2") // Spaces in numbers
                    .replace(/[0-9\.]+/g, function(match) { // Handle multiple decimal places within a number
                        f = true;

                        return " " + match.replace(/\./g, function() { return (f && !(f = false)) ? "." : ""; }) + " ";
                    })
                    .replace(/ {1,}/g, " ") // Multiple spaces
                    .replace(/([0-9]) ?\(/g, "$1 * (") // Handle parentheses adjacent to numbers by multiplying them
                    .replace(/\) ?([0-9])/g, ") * $1") // Again
                    .trim();

                if (problem.indexOf("(") !== -1 || problem.indexOf(")") !== -1) {
                    // Modified from: http://stackoverflow.com/a/14369329/900747
                    var check = function(str) {
                        var s;

                        str = str.replace(/[^()]/g, "");

                        while (s !== str) {
                            s = str;

                            str = str.replace(/\(\)/g, "");
                        }

                        return !str;
                    };

                    while ((problem.match(/\(/g) || "").length > (problem.match(/\)/g) || "").length) {
                        problem += ")";
                    }

                    while ((problem.match(/\)/g) || "").length > (problem.match(/\(/g) || "").length) {
                        problem = "(" + problem;
                    }

                    if (!check(problem)) {
                        d0.value = that.utils.translate("mismatch");
                        return;
                    }
                }

                try {
                    var answer = safeEvaluator.calc(problem);

                    if (typeof answer !== "number" || isNaN(answer)) {
                        d0.value = that.utils.translate("error");
                    }
                    else if (answer === Infinity || answer === -Infinity) {
                        d0.value = that.utils.translate("infinity");
                    }
                    else {
                        d0.value = +answer.toFixed(8); // Maximum of 8 decimal places
                    }
                }
                catch(e) {
                    console.error("Calculator error:", e);
                    d0.value = that.utils.translate("error");
                }

                overwrite = true;
            };

            btns.on("click", function(e) {
                e.preventDefault();

                var which = this.getAttribute("data-id"),
                    value,
                    num = false;

                if (nums.indexOf(which) !== -1) {
                    value = which;

                    num = true;
                }
                else {
                    switch (which) {
                        case "oparen":
                            value = "(";
                        break;
                        case "cparen":
                            value = ")";
                        break;
                        case "plus":
                            value = " + ";
                        break;
                        case "minus":
                            value = " - ";
                        break;
                        case "multiply":
                            value = " × ";
                        break;
                        case "divide":
                            value = " ÷ ";
                        break;
                        case "decimal":
                            value = ".";
                        break;
                        case "clear":
                            d0.value = "";
                        break;
                        case "equals":
                            calculate();
                        break;
                    }
                }

                if (value) {
                    if ((overwrite && !num) || !overwrite) {
                        d0.value += value;
                    }
                    else {
                        d0.value = value;
                    }

                    overwrite = false;

                    d0.focus();
                }
            });

            display.on("keydown", function(e) {
                if (e.which === 13) {
                    calculate();
                }
            }).on("input", function() {
                var val = d0.value.replace(/[^ +\-()1234567890*\/×x\.÷]/g, "");

                if (d0.value !== val) {
                    var start = d0.selectionStart - 1, // These are -1 since the cursor is just after the entered text and we want to be before
                        end = d0.selectionEnd - 1;

                    d0.value = val;

                    d0.setSelectionRange(start, end);
                }
            }).on("focusout", function() {
                d0.value = d0.value // See calculate() for comments
                    .replace(/[^ +\-()1234567890*\/x\.×÷]|[\-+\/\*\.]{2}/g, "")
                    .replace(/[0-9\.]+/g, function(match) {
                        f = true;

                        return " " + match.replace(/\./g, function() { return (f && !(f = false)) ? "." : ""; }) + " ";
                    })
                    .replace(/ {1,}/g, " ")
                    .replace(/\( /g, "(")
                    .replace(/ \)/g, ")")
                    .replace(/([+\-x×÷*\/])(\()|(\))([+\-x×÷*\/])/g, "$1 $2")
                    .trim();
            });
        }
    };
});