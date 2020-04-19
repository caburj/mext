# mext.js

The goal of this project is to provide a way to extend a class *in-place*. This
has similarity to extension methods of other programming languages. This however
relies on *class inheritance*. The main idea is to declare a class using
`defclass` and declare its extensions/patches using `extend`. With this series
of declaration, we `compile` the definition to get the compiled class. Look at
the following for simple illustration:

```js
// app.js

import { defclass, extend } from './mext.js'

// define class Foo
// `defclass` takes a function that returns the real class
export const FooDef = defclass(() => {
  return class {
    get value() {
      return 'foo'
    }
  }
});

// extend class Foo
// `extend` takes the definition to extend, and a function
// that returns the extended class.
const FooExt1 = extend(FooDef, (CompiledFoo) => {
  return class extends CompiledFoo {
    get value() {
      return 'foo1 -> ' + super.value;
    }
  }
})
```

With the above declaration, we basically delayed the creation of `class Foo`. To
get the real class, we call `compile` on the definition as illustrated below:

```js
// compile the definition to get class Foo
const Foo = FooDef.compile();
const foo = new Foo();
console.log(foo.value); // logs 'foo1 -> foo'
```

`FooDef` is the definition and `FooExt1` is the extension. With these two, we
are promised with a `class Foo` by `compiling` the definition (`FooDef`). In
essence, we have `class Foo` equivalent to the following inheritance chain:

```
class Foo => FooExt1 -> FooDef
```

Now, if we want to define a class that extends another class, for example, we
want to create `Bar` derived from `Foo` declared above, we can to the following:

```js
// app.js continued

// we ask the class Foo by compiling the definition, then return a
// class definition that extends it.
export const BarDef = defclass(() => {
  const Foo = FooDef.compile();
  return class extends Foo {
    get value() {
      return 'bar -> ' + super.value;
    }
    test() {
      return 'test';
    }
  }
});

// we can also extend Bar in-place
const BarExt1 = extend(BarDef, (Bar) => {
  return class extends Bar {
    get value() {
      return 'bar1 -> ' + super.value;
    }
    test() {
      return 'test1 -> ' + super.test();
    }
  }
});
```

With the above declaration on top of the original declation, we can have the
following:

```js
const Bar = BarDef.compile();
const bar = new Bar();
console.log(bar.value); // logs 'bar1 -> bar -> foo1 -> foo'
console.log(bar.test()); // logs 'test1 -> test'
```

Notice that `class Foo` is compiled in `BarDef`, because we want the new
`class Bar` to have `class Foo` as superclass. `class Bar` is also extended using
`BarExt1`, so we basically have the following as the inheritance chain of
`class Bar`:

```
assigning
  [Bar] = class Bar
  [Foo] = class Foo
then
  [Bar] => BarExt1 -> BarDef -> [Foo]
  [Bar] => BarExt1 -> BarDef -> FooExt1 -> FooDef
```

## whenReady

When all js files are loaded, this is the best time to start asking for the
compiled classes of the class definitions. The common practice is to have an
entry point which is run when the dom is ready. We can assume that the entry
point is the `class Main`.

In the following listing, we define `class Main` then instantiate it when DOM is
ready (when call to `whenReady` has resolved).

```js
// app.js continued

import { define, extend, whenReady } from './mext.js';

// export so that it can be used from other file or it can be extended.
export const MainDef = defclass(() => {
  // class Bar is defined above.
  const Bar = BarDef.compile();
  const { add } = utilsDef.compile();
  return class {
    constructor() {
      this.bar = new Bar();
      console.log(add(1, 1));
    }
    start() {
      console.log(this.bar.value);
    }
  }
});

// define utils. Note that it is an instance of class Utils.
// We can think of this as a singleton.
const utilsDef = defmodule(() => {
  const Utils = UtilsDef.compile();
  return new Utils();
})

// define class Utils to have `add` method.
export const UtilsDef = defclass(() => {
  return class {
    add(a, b) {
      return a + b;
    }
  }
})

// whenReady is resolved when DOMContentLoaded is triggered.
whenReady().then(() => {
  const Main = MainDef.compile();
  const main = new Main(); // logs '2'
  main.start(); // logs 'bar1 -> bar -> foo1 -> foo'
})
```

## Extensions

Normally, when we import something from a library, that import is only used
(consumed), and is rarely added with new functionality because we are limited to
adding methods to the prototype. However, when importing a class definition
defined using `defclass`, not only we can consume it, but we can also extend it.

This is where this patching pattern shines. When we load another file that
contains extensions as illustrated in the listing below, we can basically alter
the behavior of the app.

```js
// extensions.js

import { extend } from './mext.js';
import { UtilsDef, MainDef } from './app.js';

// alter the `add` method of Utils
export const UtilsExt1 = extend(UtilsDef, (Utils) => {
  return class extends Utils {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  }
});

// alter the `start` method of Main
const MainExt1 = extend(MainDef, (Main) => {
  return class extends Main {
    start() {
      super.start();
      console.log('added log from extension');
    }
  }
});
```

When the above file is loaded together with the `app.js` file, instead of
seeing the following in the logs:

```
2
bar1 -> bar -> foo1 -> foo
```
We will see:
```
3                             (1) due to overriding of add in Utils
bar1 -> bar -> foo1 -> foo
added log from extension      (2) due to overriding of start in Main
```

## Removing/Reapplying Extensions

Extensions can actually be removed or reapplied as illustrated in the following
listing.

```js
const Bar = defclass(() => {
  return class {
    get val() {
      return 'Bar';
    }
  };
})

const BarExt1 = extend(Bar, (Bar) => {
  return class extends Bar {
    get val() {
      return 'Bar1 ' + super.val;
    }
  };
})

const BarExt2 = extend(Bar, (Bar) => {
  return class extends Bar {
    get val() {
      return 'Bar2 ' + super.val;
    }
  };
})

let bar = Bar.create();
console.log(bar.val); // logs 'Bar2 Bar1 Bar'

// remove BarExt1
BarExt1.remove();
bar = Bar.create();
console.log(bar.val); // logs 'Bar2 Bar'

// let's remove BarExt2
// then reapply BarExt1
BarExt2.remove();
BarExt1.reapply();
bar = Bar.create();
console.log(bar.val); // you guessed it, 'Bar1 Bar'
```

## Summary

Loading `app.js` and `extensions.js` from the listings above will generate the
following classes:

```
[Foo] => FooExt1 -> FooDef
[Bar] => BarExt1 -> BarDef -> [Foo]
      => BarExt1 -> BarDef -> FooExt1 -> FooDef
[Utils] => UtilsExt1 -> UtilsDef
[Main] => MainExt1 -> MainDef
```

And again, if we loaded the following as well:

```js
const FooExt2 = extend(FooDef, (Foo) => {
  return class extends Foo {};
});
```
`class Foo` and `class Bar` becomes:

```
[Foo] => FooExt2 -> FooExt2 -> FooDef
[Bar] => BarExt1 -> BarDef -> FooExt2 -> FooExt2 -> FooDef
```

Notice how the new extension fits itself in the inheritance chain.
