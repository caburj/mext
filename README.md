# mext.js

The goal of this project is to provide a way to extend a class in-place, more
commonly known as monkey-patching. The main idea is to declare a class using
`defclass` and declare its extensions/patches using `extend`. With this series
of declaration, the compiled class (containing the base and its extensions) is
'promised' thru `compile`. Look at the following for simple illustration:

```js
// app.js
import { defclass, extend } from './mext.js'

// define class Foo
const FooDef = defclass(async() => {
  return class {
    get value() {
      return 'foo'
    }
  }
});

// extend class Foo
// The argument of the callback is the compiled class to be extended.
extend(FooDef, async(CompiledFoo) => {
  return class extends CompiledFoo {
    get value() {
      return 'foo1 -> ' + super.value;
    }
  }
})

// It is now promised to have a class Foo in the registry that is extended.
// We access this class thru `compile` of the definition which returns a
// promise that resolve to the compiled class.
FooDef.compile().then(Foo => {
  const foo = new Foo();
  console.log(foo.value); // logs 'foo1 -> foo'
})
```

If we want to define a class that extends another class, for instance, we want
to create Bar derived from Foo declared above, we can to the following:

```js
// app.js continued

// we ask the 'promised' class Foo by compiling the definition, then return a
// class definition that extends it.
const BarDef = defclass(async() => {
  const Foo = await FooDef.compile();
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
extend(BarDef, async(Bar) => {
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
BarDef.compile().then(Bar => {
  const bar = new Bar();
  console.log(bar.value); // logs 'bar1 -> bar -> foo1 -> foo'
  console.log(bar.test()); // logs 'test1 -> test'
})
```

## whenReady

When all js files are loaded, that is the time that we can start asking for the
'promised' classes from class definitions. The common practice is to have an
entry point which is run when the dom is ready, that entry point is normally the
class Main.

```js
// app.js continued

import { define, extend, whenReady } from './mext.js';

// export so that it can be used from other file or it can be extended.
export const MainDef = defclass(async() => {
  // class Bar is defined above.
  const Bar = await BarDef.compile();
  const { add } = await utilsDef.compile();
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
const utilsDef = defmodule(async() => {
  const Utils = await UtilsDef.compile();
  return new Utils();
})

// define class Utils to have add method.
export const UtilDef = defclass(async() => {
  return class {
    add(a, b) {
      return a + b;
    }
  }
})

// whenReady is resolved when DOMContentLoaded is triggered.
whenReady().then(async () => {
  const Main = await MainDef.compile();
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
import { UtilsDef, MainDef } from './app.js';

// alter add method of Utils
// export this extension if we allow extensions that relies on this extension
export const ExtendedUtilsDef = extend(UtilsDef, async(Utils) => {
  return class extends Utils {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  }
});

// alter start method of Main
extend(MainDef, async(Main) => {
  return class extends Main {
    start() {
      super.start();
      console.log('added log from extension');
    }
  }
});
```

When the above file is loaded together with the `app.js` file, instead of
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
