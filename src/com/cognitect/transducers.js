// Copyright 2014 Cognitect. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

goog.provide("com.cognitect.transducers");

/** @define {boolean} */
var TRANSDUCERS_NODE_TARGET = false;

/** @define {boolean} */
var TRANSDUCERS_BROWSER_TARGET = false;

/** @define {boolean} */
var TRANSDUCERS_BROWSER_AMD_TARGET = false;

goog.scope(function() {
    
var transducers = com.cognitect.transducers;

// =============================================================================
// Utilities

transducers.isString = function(s) {
    return typeof x == "string";
};

if(typeof Array.isArray != "undefined") {
    transducers.isArray = function(x) {
        return Array.isArray(x);
    }
} else {
    transducers.isArray = function(x) {
        return typeof x == "array";
    }
}

transducers.isIterable = function(x) {
    return x["@@iterator"] != null;
};

transducers.slice = function(array, start, n) {
    return Array.prototype.slice(array, start, n);
};

transducers.wrap = function(f) {
    return {
        init: function() {
            throw new Error("init not implemented");
        },
        result: function(result) {
            return result;
        },
        step: function(result, next) {
            return f(result, next);
        }
    };
};

// =============================================================================
// Main Functions

transducers.Reduced = function(value) {
    this.value = value;
};

transducers.reduced = function(x) {
    return new transducers.Reduced(x);
};

transducers.isReduced = function(x) {
    return x instanceof transducers.Reduced;
};
    
transducers.comp = function(varArgs) {
    var arglen = arguments.length;
    if(arglen == 2) {
        var f = arguments[0],
            g = arguments[1];
        return function(varArgs) {
            return f(g.apply(null, transducers.slice(arguments, 0)));
        };
    } if(arglen > 2) {
    } else {
        throw new Error("comp must given at least 2 arguments");
    }
};

transducers.map = function(f) {
    if(f == null) {
        throw new Error("At least one argument must be supplied to map");
    } else {
        return function(xf) {
            return {
                init: function() {
                    return xf.init();
                },
                result: function(result) {
                    return xf.result(result);
                },
                step: function(result, next) {
                    return xf.step(result, next);
                }
            };
        };
    }
};

transducers.filter = function(pred) {
    if(pred == null) {
        throw new Error("At least one argument must be supplied to filter");
    } else {
        return function(xf) {
            return {
                init: function() {
                    return xf.init();
                },
                result: function(result) {
                    return xf.result(result);
                },
                step: function(result, next) {
                    if(pred(next)) {
                        return xf.step(result, next);
                    } else {
                        return result;
                    }
                }
            };
        }
    }
};

transducers.cat = function(f) {
    
};

transducers.mapcat = transducers.comp(transducers.map, transducers.cat);

transducers.stringReduce = function(xf, f, init, string) {
    var acc = init,
        f   = typeof f == "function" ? transducers.wrap(f) : f,
        xf  = xf(f);
    for(var i = 0; i < string.length; i++) {
        acc = xf.step(acc, string.charAt(i));
        if(transducers.isReduced(acc)) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
};

transducers.arrayReduce = function(xf, f, init, array) {
    var acc = init,
        f   = typeof f == "function" ? transducers.wrap(f) : f;
        xf  = xf(f);
    for(var i = 0; i < array.length; i++) {
        acc = xf.step(acc, array[i]);
        if(transducers.isReduced(acc)) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
};

transducers.reduce = function(xf, f, init, coll) {
    if(transducers.isString(coll)) {
        return transducers.stringReduce(xf, f, init, coll);
    } else if(transducers.isArray(coll)) {
        return transducers.arrayReduce(xf, f, init, coll);
    } else if(transducers.isIterable(coll)) {
        return transducers.iterableReduce(xf, f, init, coll);
    } else {
        throw new Error("Cannot reduce instance of " + coll.constructor.name);
    }
};

// =============================================================================
// Exporting

if(TRANSDUCERS_BROWSER_TARGET) {
    goog.exportSymbol("transducers.reduced", transducers.reduced);
    goog.exportSymbol("transducers.isReduced", transducers.isReduced);
    goog.exportSymbol("transducers.comp", transducers.comp);
    goog.exportSymbol("transducers.map", transducers.map);
    goog.exportSymbol("transducers.filter", transducers.filter);
    goog.exportSymbol("transducers.reduce", transducers.reduce);
}

if(TRANSDUCERS_NODE_TARGET) {
    module.exports = {
        reduced: transducers.reduced,
        isReduced: transducers.isReduced,
        comp: transducers.comp,
        map: transducers.map,
        filter: transducers.filter,
        reduce: transducers.reduce
    };
}

});
