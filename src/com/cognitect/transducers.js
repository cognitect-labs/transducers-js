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
    
/**
 * @class transducers
 */
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
    return x["@@iterator"] || x["next"];
};

transducers.slice = function(arrayLike, start, n) {
    if(n == null) {
        return Array.prototype.slice.call(arrayLike, start);
    } else {
        return Array.prototype.slice.call(arrayLike, start, n);
    }
};

/**
 * Take a predicate function and return its complement.
 * @method transducers.complement
 * @param {function} a predicate function
 * @return {function} the complement predicate function
 * @example
 *     var isEven = function(n) { return n % 2 == 0; };
 *     var isOdd = transducers.complement(isEven);
 */
transducers.complement = function(f) {
    return function(varArgs) {
        return !f.apply(null, transducers.slice(arguments, 0));
    };
};

/**
 * @constructor
 */
transducers.Wrap = function(stepFn) {
    this.stepFn = stepFn;
};
transducers.Wrap.prototype.init = function() {
    throw new Error("init not implemented");
};
transducers.Wrap.prototype.result = function(result) {
    return result;
};
transducers.Wrap.prototype.step = function(result, input) {
    return this.stepFn(result, input);
};

/**
 * Take a two-arity reducing function where the first argument is the
 * accumluation and the second argument is the next input and convert
 * it into a transducer transformer object.
 * @method transducers.wrap
 * @param {function} stepFn a two-arity reducing function
 * @return {transducers.Wrap} a transducer transformer object
 * @example
 *     var t = transducers;
 *     var arrayPush = t.wrap(function(arr, x) { arr.push(x); return arr; });
 */
transducers.wrap = function(stepFn) {
    return new transducers.Wrap(stepFn);
};

// =============================================================================
// Main

/**
 * @constructor
 */
transducers.Reduced = function(value) {
    this.__transducers_reduced__ = true;
    this.value = value;
};

/**
 * Return a reduced value. Reduced values short circuit transduce.
 * @method transducers.reduced
 * @param {Object} x any JavaScript value
 * @return {transducers.Reduced} a reduced value
 * @example
 *     var reduced = transducers.reduced(1);
 */ 
transducers.reduced = function(x) {
    return new transducers.Reduced(x);
};

/**
 * Check if a value is reduced.
 * @method transducers.isReduced
 * @param {Object} x any JavaScript value
 * @return {Boolean} true if the value is an instance of transducers.Reduced
 *   false otherwise
 * @example
 *     var t = transducers;
 *     t.isReduced(1); // false
 *     t.isReduced(t.reduced(1)); // true
 */
transducers.isReduced = function(x) {
    return (x instanceof transducers.Reduced) || (x && x.__transducers_reduced__);
};

/**
 * Ensure that a value is reduced. If already reduced will not re-wrap.
 * @method transducers.ensureReduced
 * @param {Object} x any JavaScript value
 * @return {transducers.Reduced} a reduced value.
 * @example
 *     var t = transducers;
 *     var x = t.ensureReduced(1);
 *     var y = t.ensureReduced(x);
 *     x === y; // true
 */
transducers.ensureReduced = function(x) {
    if(transducers.isReduced(x)) {
        return x;
    } else {
        return transducers.reduced(x);
    }
};

transducers.deref = function(x) {
    return x.value;
};

/**
 * Ensure a value is not reduced. Unwraps if reduced.
 * @method transducers.unreduced
 * @param {Object} x any JavaScript value
 * @return {Object} a JavaScript value
 * @example
 *     var t = transducers;
 *     var x = t.reduced(1);
 *     t.unreduced(x); // 1
 *     t.unreduced(t.unreduced(x)); // 1
 */
transducers.unreduced = function(x) {
    if(transducers.isReduced(x)) {
        return transducers.deref(x);
    } else {
        return x;
    }
};

/**
 * Identity function.
 * @method transducers.identiy
 * @param {Object} x any JavaScript value
 * @return {Object} a JavaScript value
 * @example
 *     transducers.identity(1); // 1
 */
transducers.identity = function(x) {
    return x;
};
    
/**
 * Function composition. Take N function and return their composition.
 * @method transducers.comp
 * @param {Function} varArgs N functions
 * @result {Function} a function that represent the composition of the arguments.
 * @example
 *     var t = transducers;
 *     var inc = function(n) { return n + 1 };
 *     var double = function(n) { return n * 2 };
 *     var incDouble = t.comp(double, inc);
 *     incDouble(3); // 8
 */
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

/**
 * Mapping transducer constructor
 * @method transducers.map 
 * @param {Function} f the mapping operation
 * @return {transducers.Map} returns a mapping transducer
 * @example
 *     var t = transducers;
 *     var inc = function(n) { return n+1; };
 *     var xf = t.map(inc);
 *     t.into([], xf, [1,2,3]); // [2,3,4]
 */
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

/**
 * Filtering transducer constructor
 * @method transducers.filter
 * @param {Function} pred a predicate function
 * @return {transducers.Filter} returns a filtering transducer
 * @example
 *     var t = transducers;
 *     var isEven = function(n) { return n % 2 == 0; };
 *     var xf = t.filter(isEven);
 *     t.into([], xf, [0,1,2,3,4]); // [0,2,4];
 */
transducers.filter = function(pred) {
    if(TRANSDUCERS_DEV && (typeof pred != "function")) {
        throw new Error("filter must be given a function");
    } else {
        return function(xf) {
            return new transducers.Filter(pred, xf);
        };
    }
};

/**
 * Similar to filter except the predicate is used to
 * eliminate values.
 * @method transducers.remove 
 * @param {Function} pred a predicate function
 * @return {transducers.Filter} returns a removing transducer
 * @example
 *     var t = transducers;
 *     var isEven = function(n) { return n % 2 == 0; };
 *     var xf = t.remove(isEven);
 *     t.into([], xf, [0,1,2,3,4]); // [1,3];
 */
transducers.remove = function(pred) {
    if(TRANSDUCERS_DEV && (typeof pred != "function")) {
        throw new Error("remove must be given a function");
    } else {
        return transducers.filter(transducers.complement(pred));
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
        result = transducers.ensureReduced(result);
    }
    this.n--;
    return result;
};

/**
 * A take transducer constructor. Will take n values before
 * returning a reduced result.
 * @method transducers.take
 * @param {Number} n the number of inputs to receive.
 * @return {transducers.Take} a take transducer
 * @example
 *     var t = transducers;
 *     var xf = t.take(3);
 *     t.into([], xf, [0,1,2,3,4,5]); // [0,1,2];
 */
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

/**
 * Like the take transducer except takes as long as the pred
 * return true for inputs.
 * @method transducers.takeWhile
 * @param {Function} pred a predicate function
 * @return {transducers.TakeWhile} a takeWhile transducer
 * @example
 *     var t = transducers;
 *     var xf = t.takeWhile(function(n) { return n < 3; });
 *     t.into([], xf, [0,1,2,3,4,5]); // [0,1,2];
 */
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

/**
 * A transducer that takes every Nth input
 * @method transducers.takeNth
 * @param {Number} n an integer
 * @return {transducers.TakeNth} a takeNth transducer
 * @example
 *     var t = transducers;
 *     var xf = t.takeNth(3);
 *     t.into([], xf, [0,1,2,3,4,5]); // [2,5];
 */
transducers.takeNth = function(n) {
    if(TRANSDUCERS_DEV && (typeof n != "number")) {
        throw new Error("takeNth must be given a number");
    } else {
        return function(xf) {
            return new transducers.TakeNth(n, xf);
        };
    }
};

// no maps in JS, perhaps define only if transit or
// Map available? - David

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

/**
 * A dropping transducer constructor
 * @method transducers.drop
 * @param {Number} n an integer, the number of inputs to drop.
 * @return {transducers.Drop} a dropping transducer
 * @example
 *     var t = transducers;
 *     var xf = t.drop(3);
 *     t.into([], xf, [0,1,2,3,4,5]); // [3,4,5];
 */
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

/**
 * A dropping transducer that drop inputs as long as
 * pred is true.
 * @method transducers.dropWhile
 * @param {Function} pred a predicate function
 * @return {transducers.DropWhile} a dropWhile transducer
 * @example
 *     var t = transducers;
 *     var xf = t.dropWhile(function(n) { return n < 3; });
 *     t.into([], xf, [0,1,2,3,4,5]); // [3,4,5];
 */
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
        var ret = transducers.unreduced(this.xf.step(result, this.a));
        this.a = [];
        if(!transducers.isReduced(ret)) {
            this.a.push(input);
        }
        return ret;
    }
};

/**
 * A partitioning transducer. Collects inputs into
 * arrays as long as predicate remains true for contiguous
 * inputs.
 * @method transducers.partitionBy
 * @param {Function} f a partition function. When the result
 *   for an input changes from the previous result will create
 *   a partition.
 * @return {transducers.PartitionBy} a partitionBy transducer
 * @example
 *     var t = transducers;
 *     var xf = t.partitionBy(function(x) { return typeof x == "string"; });
 *     t.into([], xf, [0,1,"foo","bar",2,3,"bar","baz"]); // [[0,1],["foo","bar"],[2,3],["bar","baz"]];
 */
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
        return transducers.unreduced(this.xf.step(result, a));
    } else {
        return result;
    }
};

/**
 * A partitioning transducer. Collects inputs into
 * arrays of size N.
 * @method transducers.partitionAll
 * @param {Number} n an integer
 * @return {transducers.PartitionAll} a partitionAll transducer
 * @example
 *     var t = transducers;
 *     var xf = t.partitionAll(3);
 *     t.into([], xf, [0,1,2,3,4,5]); // [[0,1,2],[3,4,5]]
 */
transducers.partitionAll = function(n) {
    if(TRANSDUCERS_DEV && (typeof n != "number")) {
        throw new Error("partitionAll must be given a number");
    } else {
        return function(xf) {
            return new transducers.PartitionAll(n, xf);
        };
    }
};

/**
 * @constructor
 */
transducers.Keep = function(f, xf) {
    this.f = f;
    this.xf = xf;
};
transducers.Keep.prototype.init = function() {
    return this.xf.init();
};
transducers.Keep.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.Keep.prototype.step = function(result, input) {
    var v = this.f(input);
    if(v == null) {
        return result;
    } else {
        return this.xf.step(result, input);
    }
};

/**
 * A keeping transducer. Keep inputs as long as the provided
 * function does not return null or undefined.
 * @method transducers.keep
 * @param {Function} f a function
 * @return {transducers.Keep} a keep transducer
 * @example
 *     var t = transducers;
 *     var xf = t.keep(function(x) { if(typeof x == "string") return "cool"; });
 *     t.into([], xf, [0,1,"foo",3,4,"bar"]); // ["foo","bar"]
 */
transducers.keep = function(f) {
    if(TRANSDUCERS_DEV && (typeof f != "function")) {
        throw new Error("keep must be given a function");
    } else {
        return function(xf) {
            return new transducers.Keep(f, xf);
        };
    }
};

// keepIndexed
/**
 * @constructor
 */
transducers.KeepIndexed = function(f, xf) {
    this.i = -1;
    this.f = f;
    this.xf = xf;
};
transducers.KeepIndexed.prototype.init = function() {
    return this.xf.init();
};
transducers.KeepIndexed.prototype.result = function(result) {
    return this.xf.result(result);
};
transducers.KeepIndexed.prototype.step = function(result, input) {
    this.i++;
    var v = this.f(this.i, input);
    if(v == null) {
        return result;
    } else {
        return this.xf.step(result, input);
    }
};

/**
 * Like keep but the provided function will be passed the
 * index as the second argument.
 * @method transducers.keepIndexed
 * @param {Function} f a function
 * @return {transducers.KeepIndexed} a keepIndexed transducer
 * @example
 *     var t = transducers;
 *     var xf = t.keepIndexed(function(x, i) { if(typeof x == "string") return "cool"; });
 *     t.into([], xf, [0,1,"foo",3,4,"bar"]); // ["foo","bar"]
 */
transducers.keepIndexed = function(f) {
    if(TRANSDUCERS_DEV && (typeof f != "function")) {
        throw new Error("keepIndexed must be given a function");
    } else {
        return function(xf) {
            return new transducers.KeepIndexed(f, xf);
        };
    }
};

// randomSample
// iteration

/**
 * Given a transformer returns a transformer which preserves
 * reduced by wrapping one more time. See cat.
 * @method transducers.preservingReduced
 * @param {transformer} xf a transformer
 * @return {transformer} a transformer which preserves reduced
 */
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

/**
 * Given a transformer return a concatenating transformer
 * @method transducers.cat
 * @param {transformer} xf a transformer
 * @return {transformer} a concatenating transformer
 */
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

/**
 * A mapping concatenating transformer
 * @method transducers.mapcat
 * @param {Function} f the mapping function
 * @return {Transducer} a mapping concatenating transducer
 * @example
 *     var t = transducers;
 *     var reverse = function(arr) { var arr = Array.prototype.slice.call(arr, 0); arr.reverse(); return arr; }
 *     var xf = t.mapcat(reverse);
 *     t.into([], xf, [[3,2,1],[6,5,4]]); // [1,2,3,4,5,6]
 */
transducers.mapcat = function(f) {
    return transducers.comp(transducers.map(f), transducers.cat);
};

transducers.stringReduce = function(xf, init, string) {
    var acc = init;
    for(var i = 0; i < string.length; i++) {
        acc = xf.step(acc, string.charAt(i));
        if(transducers.isReduced(acc)) {
            acc = transducers.deref(acc);
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
            acc = transducers.deref(acc);
            break;
        }
    }
    return xf.result(acc);
};

transducers.objectReduce = function(xf, init, obj) {
    var acc = init;
    for(var p in obj) {
        if(obj.hasOwnProperty(p)) {
            acc = xf.step(acc, [p, obj[p]]);
            if(transducers.isReduced(acc)) {
                acc = transducers.deref(acc);
                break;
            }
        }
    }
    return xf.result(acc);
};

transducers.iterableReduce = function(xf, init, iter) {
    if(iter["@@iterator"]) {
        iter = iter["@@iterator"]();
    }

    var acc  = init,
        step = iter.next();
    
    while(!step.done) {
        acc = xf.step(acc, step.value);
        if(transducers.isReduced(acc)) {
            acc = transducers.deref(acc);
            break;
        }
        step = iter.next();
    }

    return xf.result(acc);
};

/**
 * Given a transducer, an intial value and a 
 * collection - returns the reduction.
 * @method transducers.reduce
 * @param {Transducer|Function} xf a transducer or two-arity function
 * @param {Object} init any JavaScript value
 * @param {String|Array|Object|Iterable} coll any iterable JavaScript value
 * @return {Object} a iterable JavaScript value: string, array
 *   iterable, or object.
 */
transducers.reduce = function(xf, init, coll) {
    if(coll) {
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
    }
};

/**
 * Given a transducer, a builder function, an initial value
 * and a iterable collection - returns the reduction.
 * collection - returns the reduction.
 * @method transducers.transduce
 * @param {Transducer} xf a transducer
 * @param {Transducer|Function} f a transducer or two-arity function
 * @param {Object} init any JavaScript value
 * @param {String|Array|Object|Iterable} coll any iterable JavaScript value
 * @return {Object} a JavaScript value.
 * @example
 *     var t = transducers;
 *     var inc = function(n) { return n+1; };
 *     var isEven = function(n) { return n % 2 == 0; };
 *     var apush = function(arr,x) { arr.push(x); return arr; };
 *     var xf = t.comp(t.map(inc),t.filter(isEven));
 *     t.transduce(xf, apush, [], [1,2,3,4]); // [2,4]
 */
transducers.transduce = function(xf, f, init, coll) {
    f = typeof f == "function" ? transducers.wrap(f) : f;
    xf = xf(f);
    return transducers.reduce(xf, init, coll);
};

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

/**
 * Reduce a value into the given empty value using a transducer.
 * @method transducers.into
 * @param {String|Array|Object} empty a JavaScript collection
 * @param {Transducer} xf a transducer
 * @param {Iterable} coll any iterable JavaScript value: array, string,
 *   object, or iterable.
 * @return {Object} a JavaScript value.
 * @example
 *     var t = transducers;
 *     var inc = function(n) { return n+1; };
 *     var isEven = function(n) { return n % 2 == 0; };
 *     var apush = function(arr,x) { arr.push(x); return arr; };
 *     var xf = t.comp(t.map(inc),t.filter(isEven));
 *     t.into([], xf, [1,2,3,4]); // [2,4]
 */
transducers.into = function(empty, xf, coll) {
    if(transducers.isString(empty)) {
        return transducers.transduce(xf, transducers.stringAppend, empty, coll);
    } else if(transducers.isArray(empty)) {
        return transducers.transduce(xf, transducers.arrayPush, empty, coll);
    } else if(transducers.isObject(empty)) {
        return transducers.transduce(xf, transducers.addEntry, empty, coll);
    }
};

/**
 * @constructor
 */
transducers.Completing = function(cf, xf) {
    this.cf = cf;
    this.xf = xf;
};
transducers.Completing.prototype.init = function() {
    return this.xf.init();
};
transducers.Completing.prototype.result = function(result) {
    return this.cf(result);
};
transducers.Completing.prototype.step = function(result, step) {
    return this.xf.step(result, step);
};

/**
 * A completing transducer constructor. Useful to provide cleanup
 * logic at the end of a reduction/transduction.
 * @method transducers.completing
 * @param {Transducer} xf a transducer
 * @param {Function} cf a function to apply at the end of the reduction/transduction
 * @return {Transducer} a transducer
 */
transducers.completing = function(xf, cf) {
    xf = typeof xf == "function" ? transducers.wrap(xf) : xf;
    cf = cf || transducers.identity;
    if(TRANSDUCERS_DEV && (xf != null) && !transducers.isObject(xf)) {
        throw new Error("completing must be given a transducer as first argument");
    } else {
        return new transducers.Completing(cf, xf);
    }
};

/**
 * Convert a transducer transformer object into a function so
 * that it can be used with existing reduce implementation i.e. native,
 * Underscore, lodash
 * @method transducers.toFn
 * @param {Transducer} xf a transducer
 * @param {Function} builder a function which take the accumulator and the
 *   the next input and return a new accumulator value.
 * @return {Function} a two-arity function compatible with existing reduce
 *   implementations
 * @example
 *     var t = transducers;
 *     var arr = [0,1,2,3,4,5],
 *     var apush = function(arr, x) { arr.push(x); return arr; },
 *     var xf = t.comp(t.map(inc),t.filter(isEven));
 *     arr.reduce(t.toFn(xf, apush), []); // [2,4,6]
 */
transducers.toFn = function(xf, builder) {
    if(typeof builder == "function") {
        builder = transducers.wrap(builder);
    }
    var rxf = xf(builder);
    return rxf.step.bind(rxf);
};

// =============================================================================
// Utilities

/**
 * Return a transducer which simply returns the first input.
 * @method transducers.first
 * @param {Transducer} xf a transducer
 * @return {Transducer} a transducer
 */
transducers.first = function(xf) {
    return new transducers.wrap(function(result, input) {
        return transducers.reduced(input);
    });
};

// =============================================================================
// Exporting

if(TRANSDUCERS_BROWSER_TARGET) {
    goog.exportSymbol("transducers.reduced", transducers.reduced);
    goog.exportSymbol("transducers.isReduced", transducers.isReduced);
    goog.exportSymbol("transducers.comp", transducers.comp);
    goog.exportSymbol("transducers.complement", transducers.complement);
    goog.exportSymbol("transducers.transduce", transducers.transduce);
    goog.exportSymbol("transducers.reduce", transducers.reduce);

    goog.exportSymbol("transducers.map", transducers.map);
    goog.exportSymbol("transducers.Map", transducers.Map);

    goog.exportSymbol("transducers.filter", transducers.filter);
    goog.exportSymbol("transducers.Filter", transducers.Filter);

    goog.exportSymbol("transducers.remove", transducers.remove);
    goog.exportSymbol("transducers.Remove", transducers.Remove);

    goog.exportSymbol("transducers.keep", transducers.keep);
    goog.exportSymbol("transducers.Keep", transducers.Keep);

    goog.exportSymbol("transducers.keepIndexed", transducers.keepIndexed);
    goog.exportSymbol("transducers.KeepIndexed", transducers.KeepIndexed);

    goog.exportSymbol("transducers.take", transducers.take);
    goog.exportSymbol("transducers.Take", transducers.Take);

    goog.exportSymbol("transducers.takeWhile", transducers.takeWhile);
    goog.exportSymbol("transducers.TakeWhile", transducers.TakeWhile);

    goog.exportSymbol("transducers.takeNth", transducers.takeNth);
    goog.exportSymbol("transducers.TakeNth", transducers.TakeNth);

    goog.exportSymbol("transducers.drop", transducers.drop);
    goog.exportSymbol("transducers.Drop", transducers.Drop);

    goog.exportSymbol("transducers.dropWhile", transducers.dropWhile);
    goog.exportSymbol("transducers.DropWhile", transducers.DropWhile);

    goog.exportSymbol("transducers.partitionBy", transducers.partitionBy);
    goog.exportSymbol("transducers.PartitionBy", transducers.PartitionBy);

    goog.exportSymbol("transducers.partitionAll", transducers.partitionAll);
    goog.exportSymbol("transducers.PartitionAll", transducers.PartitionAll);

    goog.exportSymbol("transducers.completing", transducers.completing);
    goog.exportSymbol("transducers.Completing", transducers.Completing);

    goog.exportSymbol("transducers.wrap", transducers.wrap);
    goog.exportSymbol("transducers.Wrap", transducers.Wrap);

    goog.exportSymbol("transducers.cat", transducers.cat);
    goog.exportSymbol("transducers.mapcat", transducers.mapcat);

    goog.exportSymbol("transducers.into", transducers.into);
    goog.exportSymbol("transducers.toFn", transducers.toFn);
    goog.exportSymbol("transducers.first", transducers.first);
    goog.exportSymbol("transducers.ensureReduced", transducers.first);
    goog.exportSymbol("transducers.unreduced", transducers.first);
    goog.exportSymbol("transducers.deref", transducers.deref);
}

if(TRANSDUCERS_NODE_TARGET) {
    module.exports = {
        reduced: transducers.reduced,
        isReduced: transducers.isReduced,
        comp: transducers.comp,
        complement: transducers.complement,

        map: transducers.map,
        Map: transducers.Map,

        filter: transducers.filter,
        Filter: transducers.Filter,

        remove: transducers.remove,
        Remove: transducers.Remove,

        keep: transducers.keep,
        Kemove: transducers.Keep,

        keepIndexed: transducers.keepIndexed,
        KeepIndexed: transducers.KeepIndexed,

        take: transducers.take,
        Take: transducers.Take,

        takeWhile: transducers.takeWhile,
        TakeWhile: transducers.TakeWhile,

        takeNth: transducers.takeNth,
        TakeNth: transducers.TakeNth,

        drop: transducers.drop,
        Drop: transducers.Drop,

        dropWhile: transducers.dropWhile,
        DropWhile: transducers.DropWhile,

        partitionBy: transducers.partitionBy,
        PartitionBy: transducers.PartitionBy,

        partitionAll: transducers.partitionAll,
        PartitionAll: transducers.PartitionAll,

        completing: transducers.completing,
        Completing: transducers.Completing,
        
        wrap: transducers.wrap,
        Wrap: transducers.Wrap,
        
        cat: transducers.cat,
        mapcat: transducers.mapcat,

        transduce: transducers.transduce,
        reduce: transducers.reduce,
        into: transducers.into,
        toFn: transducers.toFn,
        first: transducers.first,

        ensureReduced: transducers.ensureReduced,
        unreduced: transducers.unreduced,
        deref: transducers.deref
    };
}

});
