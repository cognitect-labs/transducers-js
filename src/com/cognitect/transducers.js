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
        return goog.typeOf(x) == "array";
    }
}

transducers.isIterable = function(x) {
    return x["@@iterator"] != null;
};

transducers.slice = function(arrayLike, start, n) {
    if(n == null) {
        return Array.prototype.slice.call(arrayLike, start);
    } else {
        return Array.prototype.slice.call(arrayLike, start, n);
    }
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

/**
 * @constructor
 */
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
        // TODO
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
                    return xf.step(result, f(next));
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

transducers.preservingReduced = function(xf) {
    return {
        init: function() {
            return xf.init();
        },
        result: function(result) {
            return result;
        },
        step: function(result, input) {
            var ret = xf.step(result, input);
            if(transducers.isReduced(ret)) {
                return transducers.reduced(ret);
            } else {
                return ret;
            }
        }
    };
};

transducers.cat = function(xf) {
    var rxf = transducers.preservingReduced(xf);
    return {
        init: function() {
            return xf.init();
        },
        result: function(result) {
            return xf.result(result);
        },
        step: function(result, input) {
            return transducers.reduce(rxf, result, input);
        }
    };
};

transducers.mapcat = function(f) {
    return transducers.comp(transducers.map(f), transducers.cat);
};

transducers.stringReduce = function(xf, init, string) {
    var acc = init;
    for(var i = 0; i < string.length; i++) {
        acc = xf.step(acc, string.charAt(i));
        if(transducers.isReduced(acc)) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
};

transducers.arrayReduce = function(xf, init, array) {
    var acc = init;
    for(var i = 0; i < array.length; i++) {
        acc = xf.step(acc, array[i]);
        if(transducers.isReduced(acc)) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
};

transducers.objectReduce = function(xf, init, obj) {
    var acc = init;
    for(var p in obj) {
        acc = xf.step(acc, [p, obj[p]]);
        if(transducers.isReduced(acc)) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
};

transducers.reduce = function(xf, init, coll) {
    xf = typeof xf == "function" ? transducers.wrap(xf) : xf;
    if(transducers.isString(coll)) {
        return transducers.stringReduce(xf, init, coll);
    } else if(transducers.isArray(coll)) {
        return transducers.arrayReduce(xf, init, coll);
    } else if(transducers.isIterable(coll)) {
        return transducers.iterableReduce(xf, init, coll);
    } else if(goog.typeOf(coll) == "object") {
        return transducers.objectReduce(xf, init, coll);
    } else {
        throw new Error("Cannot reduce instance of " + coll.constructor.name);
    }
};

transducers.transduce = function(xf, f, init, coll) {
    f = typeof f == "function" ? transducers.wrap(f) : f;
    xf = xf(f);
    return transducers.reduce(xf, init, coll);
};

// =============================================================================
// Underscore/Lodash style sugar

/**
 * @constructor
 */
transducers.Chain = function(coll, xf) {
    this.coll = coll;
    this.xf = xf;
};

transducers.Chain.prototype.map = function(f) {
    return transducers.chain(this, transducers.map(f));
};

transducers.Chain.prototype.filter = function(f) {
    return transducers.chain(this, transducers.filter(f));
};

transducers.Chain.prototype.reduce = function(f, init) {
    return transducers.transduce(this.xf, f, init, this.coll);
};

transducers.Chain.prototype.value = function() {
    var f    = null,
        init = null; 
    if(transducers.isArray(this.coll)) {
        f = function(arr, x) {
            arr.push(x);
            return arr;
        }
        init = [];
    } else if(goog.typeOf(this.coll) == "object") {
        f = function(obj, entry) {
            obj[entry[0]] = entry[1];
            return obj;
        }
        init = {};
    }
    return transducers.transduce(this.xf, f, init, this.coll);
};

transducers.isChain = function(x) {
    return x instanceof transducers.Chain;
};

transducers.chain = function(x, xf) {
    if(transducers.isChain(x)) {
        if(x.xf) {
            return new transducers.Chain(x.coll, transducers.comp(x.xf, xf));
        } else {
            return new transducers.Chain(x.coll, xf);
        }
    } else {
        return new transducers.Chain(x, xf);
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
    goog.exportSymbol("transducers.cat", transducers.cat);
    goog.exportSymbol("transducers.mapcat", transducers.mapcat);
    goog.exportSymbol("transducers.transduce", transducers.transduce);
    goog.exportSymbol("transducers.reduce", transducers.reduce);
    goog.exportSymbol("transducers.chain", transducers.chain);
}

if(TRANSDUCERS_NODE_TARGET) {
    module.exports = {
        reduced: transducers.reduced,
        isReduced: transducers.isReduced,
        comp: transducers.comp,
        map: transducers.map,
        filter: transducers.filter,
        cat: transducers.cat,
        mapcat: transducers.mapcat,
        transduce: transducers.transduce,
        reduce: transducers.reduce,
        chain: transducers.chain
    };
}

});
