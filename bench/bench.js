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

if(typeof require != "undefined") {
    var _ = require("../target/transducers.js");
} else {
    var _ = transducers;
}

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

log(_.comp(doubleN,squareN)(3));
log(_.transduce(_.map(inc), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(_.transduce(_.filter(isEven), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(_.transduce(_.comp(_.map(inc), _.filter(isEven)), apush, [], [0,1,2,3,4,5,6,7,8,9]));
log(_.transduce(_.mapcat(reverse), apush, [], [[0,1,2],[3,4,5],[6,7,8]]));
log(_.transduce(_.map(ucKeys), addEntry, {}, {foo: 1, bar:2}));

log(_.chain([1,2,3])
     .map(inc)
     .map(inc)
     .value());

log(_.chain({foo: 1, bar: 2})
     .map(ucKeys)
     .value());

var xf = _.comp(_.map(inc), _.map(inc), _.map(inc));

console.log(_.transduce(xf, apush, [], [1,2,3]));

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
    return _.transduce(_.map(inc), apush, [], largeArray).length;
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
});

log("native map/filter array, 2 ops")
time(function() {
    return largeArray.map(inc).filter(isEven).length;
});

log("transduce map large array, 2 ops")
time(function() {
    return _.transduce(_.comp(_.map(inc),_.filter(isEven)), apush, [], largeArray).length;
});
