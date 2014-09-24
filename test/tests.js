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

var t         = require("../target/transducers.js"),
    comp      = t.comp,
    transduce = t.transduce,
    reduce    = t.reduce,
    map       = t.map,
    mapcat    = t.mapcat,
    take      = t.take,
    drop      = t.drop,
    into      = t.into;

var smallArray = [0,1,2,3,4,5,6,7,8,9];

var inc = function(n) {
    return n+1;
};

var arrayPush = function(arr, x) {
    arr.push(x);
    return arr;
}

exports.testInto = function(test) {
    var xf  = map(inc),
        res = into([], xf, smallArray);
    test.deepEqual(res, [1,2,3,4,5,6,7,8,9,10]);
    test.done();
};

exports.testTake = function(test) {
    var res = transduce(take(5), arrayPush, [], smallArray);
    test.deepEqual(res, [0,1,2,3,4]);
    test.done();
};

exports.testDrop = function(test) {
    var res = transduce(drop(5), arrayPush, [], smallArray);
    test.deepEqual(res, [5,6,7,8,9]);
    test.done();
};
