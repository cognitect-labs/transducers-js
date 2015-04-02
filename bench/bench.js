// Copyright 2014-2015 Cognitect. All Rights Reserved.
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

var t  = null;
var ld = null;
var ud = null;

if(typeof require != "undefined") {
    t  = require("../target/transducers.js");
    ld = require("../node_modules/lodash/lodash.js");
    ud = require("../node_modules/underscore/underscore.js");
} else {
    if(typeof _ != "undefined") {
        ld = _;
    }
    t  = transducers;
}

var map       = t.map,
    filter    = t.filter,
    reduce    = t.reduce,
    transduce = t.transduce,
    mapcat    = t.mapcat,
    reduced   = t.reduced,
    isReduced = t.isReduced,
    comp      = t.comp;

function log(varArgs) {
    if(typeof console != "undefined") {
        console.log.apply(console, Array.prototype.slice.call(arguments, 0));
    } else {
        print(Array.prototype.slice.call(arguments, 0).join(" "));
    }
}

function time(f, iters) {
    iters = iters || 1;
    for(var i = 0; i < iters; i++) {
        var s = new Date();
        var ret = f();
        log(ret, "elapsed "+((new Date()).valueOf()-s.valueOf())+"ms");
        log("----------");
    }
}

function inc(n) { return n + 1; };
function isEven(n) { return n % 2 == 0; };
function apush(arr, x) { arr.push(x); return arr; };
function addEntry(obj, entry) { obj[entry[0]] = entry[1]; return obj; };
function ucKeys(entry) { return [entry[0].toUpperCase(), entry[1]]; };
function doubleN(n) { return n + n; };
function squareN(n) { return n * n; };
function reverse(arr) {
    var clone = Array.prototype.slice.call(arr, 0);
    clone.reverse();
    return clone;
};

log(comp(doubleN,squareN)(3));
log(transduce(map(inc), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(transduce(filter(isEven), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(transduce(comp(map(inc), filter(isEven)), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(transduce(mapcat(reverse), apush, [], [[0,1,2],[3,4,5],[6,7,8]]));
log(transduce(map(ucKeys), addEntry, {}, {foo: 1, bar:2}));

var xf = comp(map(inc), map(inc), map(inc));

log(transduce(xf, apush, [], [1,2,3]));

var largeArray = [];
for(var i = 0; i < 1000000; i++) {
    largeArray.push(i);
}

log("for loop, 1 op")
time(function() {
    var ret = [];
    for(var i = 0; i < largeArray.length; i++) {
        ret.push(inc(largeArray[i]));
    }
    return ret.length;
});

log("native map array, 1 op")
time(function() {
    return largeArray.map(inc).length;
});

log("transduce map large array, 1 op")
time(function() {
    return transduce(map(inc), apush, [], largeArray).length;
});

log("for loop, 2 ops")
time(function() {
    var ret = [];
    for(var i = 0; i < largeArray.length; i++) {
        var n = inc(largeArray[i]);
        if(isEven(n)) {
            ret.push(n);
        }
    }
    return ret.length;
}, 10);

log("native map/filter array, 2 ops")
time(function() {
    return largeArray.map(inc).filter(isEven).length;
}, 10);

log("transduce map/filter large array, 2 ops")
time(function() {
    return transduce(comp(map(inc),filter(isEven)), apush, [], largeArray).length;
}, 10);

if(ld != null) {

log("lodash map/filter large array, 2 ops")
time(function() {
    return ld.chain(largeArray).map(inc).filter(isEven).value().length;
}, 10);

}

/*
log("transduce map/filter large array, 5 ops")
time(function() {
    return _.transduce(_.comp(_.map(inc),_.map(doubleN),_.map(inc),_.map(doubleN)), apush, [], largeArray).length;
},10);

log("lodash map/filter large array, 5 ops")
time(function() {
    return ld.chain(largeArray).map(inc).filter(doubleN).map(inc).map(doubleN).value().length;
},10);
*/
