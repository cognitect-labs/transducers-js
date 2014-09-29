# transducers-js

A high performance Transducers implementation for JavaScript.

## Releases and Dependency Information

## Usage

### Requiring

To import the library under Node.js you can just use `require`:

```js
var t = require("transducers-js");
```

The browser release of the library simply exports a top level
`transducers` object:

```js
var t = transducers;
```

### Basic Usage

With <=ES5:

```js
var map    = t.map,
    filter = t.filter,
    comp   = t.comp,
    into   = t.into;

var inc = function(n) { return n + 1; };
var isEven = function(n) { return n % 2 == 0; };
var xf = comp(map(inc), filter(isEven));

console.log(into([], xf, [0,1,2,3,4]));
```

With ES6:

```js
let {map, filter, comp, into} = t;

let inc = (n) => n + 1;
let isEven = (n) => n % 2 == 0;
let xf = comp(map(inc), filter(isEven));

console.log(into([], xf, [0,1,2,3,4]));
```