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

// =============================================================================
// Build target config

/** @define {boolean} */
var TRANSDUCERS_DEV = true;

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

transducers.isObject = function(x) {
    return goog.typeOf(x) == "object";
};

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

transducers.complement = function(f) {
    return function(varArgs) {
        return !f.apply(null, transducers.slice(arguments, 0));
    };
};

/**
 * @constructor
 */
transducers.Wrap = function(f) {
    this.f = f;
};
transducers.Wrap.prototype.init = function() {
    throw new Error("init not implemented");
};
transducers.Wrap.prototype.result = function(result) {
    return result;
};
transducers.Wrap.prototype.step = function(result, input) {
    return this.f(result, input);
};

transducers.wrap = function(f) {
    return new transducers.Wrap(f);
};

// =============================================================================
// Main

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
        return transducers.reduce(transducers.comp, arguments[0], transducers.slice(arguments, 1));
    } else {
        if(TRANSDUCERS_DEV) {
            throw new Error("comp must given at least 2 arguments");
        }
    }
};

/**
 * @constructor
 */
transducers.Map = function(f, xf) {
    this.f = f;
    this.xf = xf;
};
transducers.Map.prototype.init = function() {
    return this.xf.init();
};
transducers.Map.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.Map.prototype.step = function(result, input) {
    return this.xf.step(result, this.f(input));
};

transducers.map = function(f) {
    if(TRANSDUCERS_DEV && (f == null)) {
        throw new Error("At least one argument must be supplied to map");
    } else {
        return function(xf) {
            return new transducers.Map(f, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.Filter = function(pred, xf) {
    this.pred = pred;
    this.xf = xf;
};
transducers.Filter.prototype.init = function() {
    return this.xf.init();
};
transducers.Filter.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.Filter.prototype.step = function(result, input) {
    if(this.pred(input)) {
        return this.xf.step(result, input);
    } else {
        return result;
    }
};

transducers.filter = function(pred) {
    if(TRANSDUCERS_DEV && (typeof pred != "function")) {
        throw new Error("filter must be given a function");
    } else {
        return function(xf) {
            return new transducers.Filter(pred, xf);
        };
    }
};

transducers.remove = function(f) {
    if(TRANSDUCERS_DEV && (typeof f != "function")) {
        throw new Error("remove must be given a function");
    } else {
        return transducers.filter(transducers.complement(f));
    }
};

/**
 * @constructor
 */
transducers.Take = function(n, xf) {
    this.n = n;
    this.xf = xf;
};
transducers.Take.prototype.init = function() {
    return this.xf.init();
};
transducers.Take.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.Take.prototype.step = function(result, input) {
    if(this.n > 0) {
        result = this.xf.step(result, input);
    } else {
        result = transducers.reduced(result);
    }
    this.n--;
    return result;
};

transducers.take = function(n) {
    if(TRANSDUCERS_DEV && (typeof n != "number")) {
        throw new Error("take must be given an integer");
    } else {
        return function(xf) {
            return new transducers.Take(n, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.TakeWhile = function(pred, xf) {
    this.pred = pred;
    this.xf = xf;
};
transducers.TakeWhile.prototype.init = function() {
    return this.xf.init();
};
transducers.TakeWhile.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.TakeWhile.prototype.step = function(result, input) {
    if(this.pred(input)) {
        return this.xf.step(result, input);
    } else {
        return transducers.reduced(result);
    }
};

transducers.takeWhile = function(pred) {
    if(TRANSDUCERS_DEV && (typeof pred != "function")) {
        throw new Error("takeWhile must given a function");
    } else {
        return function(xf) {
            return new transducers.TakeWhile(pred, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.TakeNth = function(n, xf) {
    this.i = -1;
    this.n = n;
    this.xf = xf;
};
transducers.TakeNth.prototype.init = function() {
    return this.xf.init();
};
transducers.TakeNth.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.TakeNth.prototype.step = function(result, input) {
    this.i++;
    if((this.i % this.n) == 0) {
        return this.xf.step(result, input);
    } else {
        return result;
    }
};

transducers.takeNth = function(n) {
    if(TRANSDUCERS_DEV && (typeof n != "number")) {
        throw new Error("takeNth must be given a number");
    } else {
        return function(xf) {
            return new transducers.TakeNth(n, xf);
        };
    }
};

// replace

/**
 * @constructor
 */
transducers.Drop = function(n, xf) {
    this.n = n;
    this.xf = xf;
};
transducers.Drop.prototype.init = function() {
    return this.xf.init();
};
transducers.Drop.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.Drop.prototype.step = function(result, input) {
    if(this.n > 0) {
        this.n--;
        return result;
    } else {
        return this.xf.step(result, input);
    }
};

transducers.drop = function(n) {
    if(TRANSDUCERS_DEV && (typeof n !== "number")) {
        throw new Error("drop must be given an integer");
    } else {
        return function(xf) {
            return new transducers.Drop(n, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.DropWhile = function(pred, xf) {
    this.drop = true;
    this.pred = pred;
    this.xf = xf;
};
transducers.DropWhile.prototype.init = function() {
    return this.xf.init();
};
transducers.DropWhile.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.DropWhile.prototype.step = function(result, input) {
    if(this.drop && this.pred(input)) {
        return result;
    } else {
        if(this.drop) this.drop = false;
        return this.xf.step(result, input);
    }
};

transducers.dropWhile = function(pred) {
    if(TRANSDUCERS_DEV && (typeof pred != "function")) {
        throw new Error("dropWhile must be given a function");
    } else {
        return function(xf) {
            return new transducers.DropWhile(pred, xf);
        };
    }
};

transducers.NONE = {};

/**
 * @constructor
 */
transducers.PartitionBy = function(f, xf) {
    this.f = f;
    this.xf = xf;
    this.a = [];
    this.pval = transducers.NONE;
};
transducers.PartitionBy.prototype.init = function() {
    return this.xf.init()
};
transducers.PartitionBy.prototype.result = function(result) {
    if(this.a.length != 0) {
        result = this.xf.step(result, this.a);
        this.a = [];
    }
    return this.xf.result(result);
};
transducers.PartitionBy.prototype.step = function(result, input) {
    var pval = this.pval;
        val  = this.f(input);

    this.pval = val;

    // NOTE: we should probably allow someone to define
    // equality? - David
    if((pval == transducers.NONE) ||
       (pval == val)) {
        this.a.push(input);
        return result;
    } else {
        var ret = this.xf.step(result, this.a),
            a   = this.a;
        this.a = [];
        if(!transducers.isReduced(ret)) {
            this.a.push(input);
        }
        return ret;
    }
};

transducers.partitionBy = function(f) {
    if(TRANSDUCERS_DEV && (typeof f != "function")) {
        throw new Error("partitionBy must be given an function");
    } else {
        return function(xf) {
            return new transducers.PartitionBy(f, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.PartitionAll = function(n, xf) {
    this.n = n;
    this.xf = xf;
    this.a = [];
};
transducers.PartitionAll.prototype.init = function() {
    return this.xf.init();
};
transducers.PartitionAll.prototype.result = function(result) {
    if(this.a.length > 0) {
        result = this.xf.step(result, this.a);
        this.a = [];
    }
    return this.xf.result(result);
};
transducers.PartitionAll.prototype.step = function(result, input) {
    this.a.push(input);
    if(this.n == this.a.length) {
        var a = this.a;
        this.a = [];
        return this.xf.step(result, a);
    } else {
        return result;
    }
};

transducers.partitionAll = function(n) {
    if(TRANSDUCERS_DEV && (typeof n != "number")) {
        throw new Error("partitionAll must be given a number");
    } else {
        return function(xf) {
            return new transducers.PartitionAll(n, xf);
        };
    }
};

// keepIndexed
// randomSample
// iteration

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
    } else if(transducers.isObject(coll)) {
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

// completing

transducers.stringAppend = function(string, x) {
    return string + x;
};

transducers.arrayPush = function(arr, x) {
    arr.push(x);
    return arr;
};

transducers.addEntry = function(obj, entry) {
    obj[entry[0]] = entry[1];
    return obj;
};

transducers.into = function(empty, xf, coll) {
    if(transducers.isString(coll)) {
        return transducers.transduce(xf, transducers.stringAppend, empty, coll);
    } else if(transducers.isArray(coll)) {
        return transducers.transduce(xf, transducers.arrayPush, empty, coll);
    } else if(transducers.isObject(coll)) {
        return transducers.transduce(xf, transducers.addEntry, empty, coll);
    }
};

// =============================================================================
// Exporting

if(TRANSDUCERS_BROWSER_TARGET) {
    goog.exportSymbol("transducers.reduced", transducers.reduced);
    goog.exportSymbol("transducers.isReduced", transducers.isReduced);
    goog.exportSymbol("transducers.comp", transducers.comp);
    goog.exportSymbol("transducers.complement", transducers.complement);
    goog.exportSymbol("transducers.map", transducers.map);
    goog.exportSymbol("transducers.filter", transducers.filter);
    goog.exportSymbol("transducers.remove", transducers.remove);
    goog.exportSymbol("transducers.cat", transducers.cat);
    goog.exportSymbol("transducers.mapcat", transducers.mapcat);
    goog.exportSymbol("transducers.transduce", transducers.transduce);
    goog.exportSymbol("transducers.reduce", transducers.reduce);
    goog.exportSymbol("transducers.take", transducers.take);
    goog.exportSymbol("transducers.takeWhile", transducers.takeWhile);
    goog.exportSymbol("transducers.takeNth", transducers.takeNth);
    goog.exportSymbol("transducers.drop", transducers.drop);
    goog.exportSymbol("transducers.dropWhile", transducers.dropWhile);
    goog.exportSymbol("transducers.partitionBy", transducers.partitionBy);
    goog.exportSymbol("transducers.partitionAll", transducers.partitionAll);
    goog.exportSymbol("transducers.into", transducers.into);
}

if(TRANSDUCERS_NODE_TARGET) {
    module.exports = {
        reduced: transducers.reduced,
        isReduced: transducers.isReduced,
        comp: transducers.comp,
        complement: transducers.complement,
        map: transducers.map,
        filter: transducers.filter,
        remove: transducers.remove,
        cat: transducers.cat,
        mapcat: transducers.mapcat,
        transduce: transducers.transduce,
        reduce: transducers.reduce,
        take: transducers.take,
        takeWhile: transducers.takeWhile,
        takeNth: transducers.takeNth,
        drop: transducers.drop,
        dropWhile: transducers.dropWhile,
        partitionBy: transducers.partitionBy,
        partitionAll: transducers.partitionAll,
        into: transducers.into
    };
}

});
