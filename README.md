# transducers-js

A high performance Transducers implementation for JavaScript.

## Releases and Dependency Information

* Latest release: 0.4.78

### JavaScript

You can include either the [release](http://cdn.cognitect.com/transducers/transducers-0.4.78-min.js)(8.9K gzipped) or [development](http://cdn.cognitect.com/transducers/transducers-0.4.78.js) build of transducers-js on your webpage. We also provide [Require.js](http://requirejs.org) compatible [release](http://cdn.cognitect.com/transducers/transducers-0.4.78-amd-min.js) and [dev](http://cdn.cognitect.com/transducers/transducers-0.4.78-amd.js) builds.

### Node.js

transducers-js is released to [npm](https://www.npmjs.org). Add transducers-js to your `package.json` dependencies:

```javascript
{...
  "dependencies": {
    "transducers-js": "0.4.78"
  }
 ...}
```

### Bower

You can also include transducers-js in your `bower.json` dependencies:

```javascript
{...
  "dependencies": {
    "transducers-js": "0.4.78"
  }
 ...}
```

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

## Contributing 

This library is open source, developed internally by [Cognitect](http://cognitect.com). Issues can be filed using [GitHub Issues](https://github.com/cognitect-labs/transducers-js/issues).

This project is provided without support or guarantee of continued development.
Because transducers-js may be incorporated into products or client projects, we prefer to do development internally and do not accept pull requests or patches. 

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
