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

## Building

Fetch the dependecies:

```
bin/deps
```

To build for Node.js

```
bin/build_release_node
```

To build for the browser

```
bin/build_release_browser
```

## Running the tests

Make sure you've first fetched the dependencies, then:

```
bin/test
```

## Copyright and License

Copyright © 2014 Cognitect

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
