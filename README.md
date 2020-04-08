# mext.js

The goal of this project is to provide a way to extend a class in-place, more
commonly known as monkey-patching. The main idea is to declare a class using
`define` and declare its extensions/patches using `extend`. With this series of
declaration, the compiled class (containing the base and its extensions) is
'promised' thru `require`. Look at the following for simple illustration:

```js
import { define, extend, require } from './mext.js'

// define class Foo
define('Foo', async() => {
  return class {
    get value() {
      return 'foo'
    }
  }
});

// extend class Foo
// The second argument of the callback is the class to be extended.
extend('Foo', async(_, Foo) => {
  return class extends Foo {
    get value() {
      return 'foo1 -> ' + super.value;
    }
  }
})

// It is now promised to have a class Foo in the registry that is extended.
// We access this class thru `require`.
require('Foo').then(Foo => {
  const foo = new Foo();
  console.log(foo.value); // logs 'foo1 -> foo'
})
```

If we want to define a class that extends another class, for instance, we want
to create Bar derived from Foo declared above, we can to the following:

```js
// we ask the 'promised' class Foo thru require, then return a class definition
// that extends it.
define('Bar', async({ require }) => {
  const Foo = await require('Foo');
  return class extends Foo {
    get value() {
      return 'bar -> ' + super.value;
    }
    test() {
      return 'test';
    }
  }
});

// we can also extend Bar
extend('Bar', async(_, Bar) => {
  return class extends Bar {
    get value() {
      return 'bar1 -> ' + super.value;
    }
    test() {
      return 'test1 -> ' + super.test();
    }
  }
});

// if we say |Bar| is the final form of class Bar, the inheritance chain can be
// visualize as so: |Bar| => bar1 -> bar -> foo1 -> foo
require('Bar').then(Bar => {
  const bar = new Bar();
  console.log(bar.value); // logs 'bar1 -> bar -> foo1 -> foo'
  console.log(bar.test()); // logs 'test1 -> test'
})
```

## class Main

Normally, for an app, there is a single entry point. `mext` assume it to be the
class Main.

```js
import { define, extend, whenReady } from './mext.js';

define('Main', async({require}) => {
  // class Bar is defined above.
  const Bar = await require('Bar');
  const { add } = await require('utils');
  return class {
    constructor() {
      this.bar = new Bar();
      console.log(add(1, 1));
    }
    start() {
      console.log(bar.value);
    }
  }
});

// define utils. Note that it is an instance of class Utils.
// We can think of this as a singleton.
define('utils', async({require}) => {
  const Utils = await require('Utils');
  return new Utils();
})

// define class Utils to have add method.
define('Utils', async() => {
  return class {
    add(a, b) {
      return a + b;
    }
  }
})

// whenReady call returns a promise that resolves to class Main
whenReady().then(Main => {
  const main = new Main(); // logs '2'
  main.start(); // logs 'bar1 -> bar -> foo1 -> foo'
})
```

## Extensions

This is where this patching pattern shines. When we load another file that
contains extensions as illustrated in the listing below, we can basically alter
the behavior of the app.

```js
// extensions.js
import { extend } from './mext.js';

// alter add method of Utils
extend('Utils', async(_, Utils) => {
  return class extends Utils {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  }
});

// alter start method of Main
extend('Main', async(_, Utils) => {
  return class extends Main {
    start() {
      super.start();
      console.log('added log from extension');
    }
  }
});
```

When the above file is loaded together with the original file, instead of
logging the following:

```
2
bar1 -> bar -> foo1 -> foo
```
It will now log:
```
3                             (1) due to overriding of add in Utils
bar1 -> bar -> foo1 -> foo
added log from extension      (2) due to overriding of start in Main
```
