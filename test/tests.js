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

var t            = require("../target/transducers.js"),
    comp         = t.comp,
    complement   = t.complement,
    transduce    = t.transduce,
    reduce       = t.reduce,
    map          = t.map,
    filter       = t.filter,
    identity     = t.identity,
    remove       = t.remove,
    keep         = t.keep,
    keepIndexed  = t.keepIndexed,
    mapcat       = t.mapcat,
    take         = t.take,
    takeWhile    = t.takeWhile,
    takeNth      = t.takeNth,
    drop         = t.drop,
    dropWhile    = t.dropWhile,
    into         = t.into,
    partitionBy  = t.partitionBy,
    partitionAll = t.partitionAll,
    completing   = t.completing,
    toFn         = t.toFn,
    first        = t.first,
    wrap         = t.wrap;

var smallArray = [0,1,2,3,4,5,6,7,8,9];

var inc = function(n) {
    return n+1;
};

var isEven = function(n) {
    return (n % 2) == 0;
};

var square = function(n) {
    return n*n;
};

var keepEven = function(n) {
    return (n % 2 == 0) ? true : null;
};

var keepIdxFn = function(i, x) {
    switch(i) {
        case 0:
        case 2:
        case 3:
        case 6:
        case 7:
        return true;
        break;
        default:
        return null;
        break;
    }
};

var lessThanFive = function(n) {
    return n < 5;
};

var arrayClone = function(arr) {
    return Array.prototype.slice.call(arr, 0);
};

var reverse = function(arr) {
    return arrayClone(arr).reverse();
};

var arrayPush = function(arr, x) {
    arr.push(x);
    return arr;
};

exports.testMap = function(test) {
    var res = transduce(map(inc), arrayPush, [], smallArray);
    test.deepEqual(res, smallArray.map(inc));
    test.done();
};

exports.testFilter = function(test) {
    var res = transduce(filter(isEven), arrayPush, [], smallArray);
    test.deepEqual(res, smallArray.filter(isEven));
    test.done();
};

exports.testIdentity = function(test) {
    var res = transduce(identity, arrayPush, [], smallArray);
    test.deepEqual(res, smallArray);
    test.done();
}

exports.testRemove = function(test) {
    var res = transduce(remove(isEven), arrayPush, [], smallArray);
    test.deepEqual(res, smallArray.filter(complement(isEven)));
    test.done();
};

exports.testKeep = function(test) {
    var res = transduce(keep(keepEven), arrayPush, [], smallArray);
    test.deepEqual(res, smallArray.filter(isEven));
    test.done();
};

exports.testKeepIndexed = function(test) {
    var res = transduce(keepIndexed(keepIdxFn), arrayPush, [], smallArray);
    test.deepEqual(res, [0, 2, 3, 6, 7]);
    test.done();
};

exports.testMapCat = function(test) {
    var res = transduce(mapcat(reverse), arrayPush, [], [[3,2,1],[6,5,4],[9,8,7]]);
    test.deepEqual(res, [1,2,3,4,5,6,7,8,9]);
    test.done();
};

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

exports.testTakeWhile = function(test) {
    var res = transduce(takeWhile(lessThanFive), arrayPush, [], smallArray);
    test.deepEqual(res, [0,1,2,3,4]);
    test.done();
};

exports.testTakeNth = function(test) {
    var res = transduce(takeNth(2), arrayPush, [], smallArray);
    test.deepEqual(res, smallArray.filter(isEven));
    test.done();
};

exports.testDrop = function(test) {
    var res = transduce(drop(5), arrayPush, [], smallArray);
    test.deepEqual(res, [5,6,7,8,9]);
    test.done();
};

exports.testDropWhile = function(test) {
    var res = transduce(dropWhile(lessThanFive), arrayPush, [], smallArray);
    test.deepEqual(res, [5,6,7,8,9]);
    test.done();
};

exports.testPartitionBy = function(test) {
    var res0 = transduce(partitionBy(lessThanFive), arrayPush, [], smallArray);
    test.deepEqual(res0, [[0,1,2,3,4],[5,6,7,8,9]]);

    var arr = [1, 1, 1, 2, 2, 3, 3, 3, 3];
    var res1 = into([], comp(partitionBy(function(x) { return x; }), take(2)), arr);
    test.deepEqual(res1, [[1,1,1],[2,2]]);
    
    test.done();
};

exports.testPartitionAll = function(test) {
    var res0 = transduce(partitionAll(2), arrayPush, [], smallArray);
    test.deepEqual(res0, [[0,1],[2,3],[4,5],[6,7],[8,9]]);

    var res1 = into([], comp(partitionAll(2), take(2)), smallArray);
    test.deepEqual(res1, [[0,1],[2,3]]);

    test.done();
};

exports.testComp = function(test) {
    var xf  = comp(filter(isEven),map(inc),map(square)),
        res = transduce(xf, arrayPush, [], smallArray);
    test.deepEqual(res, [1,9,25,49,81]);
    test.done();
};

exports.testToFn = function(test) {
    var f   = toFn(comp(filter(isEven),map(inc)),arrayPush),
        res = smallArray.reduce(f, []);
    test.deepEqual(res, [1,3,5,7,9]);
    test.done();
};

exports.testFirst = function(test) {
    test.equal(reduce(first, null, [1,2,3]), 1);
    test.equal(reduce(map(inc)(first), null, [1,2,3]), 2);
    test.done();
};

exports.testCompleting = function(test) {
    var arrWrap       = function(arr) { return {value: arr}; },
        arrayPushWrap = completing(arrayPush, arrWrap),
        xf            = comp(map(inc), filter(isEven));

    test.deepEqual(transduce(xf, arrayPushWrap, [], [0,1,2,3]), {value: [2,4]});

    test.done();
};

var range = function(n) {
    var i = 0;
    return {
        next: function() {
            if(i < n) {
                var ret = {done: false, value: i};
                i++;
                return ret;
            } else {
                return {done: true, value: null}
            }
        }
    };
};

exports.testIterableReduce = function(test) {
    var ints = range(10),
        res  = transduce(map(inc), arrayPush, [], ints);

    test.deepEqual(res, [1,2,3,4,5,6,7,8,9,10]);

    test.done();
};

exports.testFirstTakeWhile = function(test) {
    test.equal(transduce(dropWhile(lessThanFive), first, null, range(10)), 5);
    test.done();
};
