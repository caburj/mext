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
export const FooDef = defclass(() => {
  return class {
    get value() {
      return 'foo'
    }
  }
});

// extend class Foo
// The argument of the callback is the compiled class to be extended.
const FooExt1 = extend(FooDef, (CompiledFoo) => {
  return class extends CompiledFoo {
    get value() {
      return 'foo1 -> ' + super.value;
    }
  }
})

// we can then compile the definition to get the class
const Foo = FooDef.compile();
const foo = new Foo();
console.log(foo.value); // logs 'foo1 -> foo'
```

In the example above, `FooDef` is the original declaration and `FooExt1` is the
extension. With these two, we are promised with a `class Foo` by `compiling`
`FooDef`. In essence, we have `class Foo` equivalent to the following
inheritance chain:

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

const Bar = BarDef.compile();
const bar = new Bar();
console.log(bar.value); // logs 'bar1 -> bar -> foo1 -> foo'
console.log(bar.test()); // logs 'test1 -> test'
```

In the listing above, `class Bar` is compiled by `BarDef`, which is a subclass
of `class Foo`. `Bar` is also extended using `BarExt1`, so we basically have the
following as the inheritance chain of `class Bar`:

```
assigning
  [Bar] = class Bar
  [Foo] = class Foo
then
  [Bar] => BarExt1 -> BarDef -> [Foo]
  [Bar] => BarExt1 -> BarDef -> FooExt1 -> FooDef
```

## whenReady

When all js files are loaded, that is the time that we can start asking for the
compiled classes from class definitions. The common practice is to have an
entry point which is run when the dom is ready, that entry point is normally the
`class Main`.

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

// define class Utils to have add method.
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

This is where this patching pattern shines. When we load another file that
contains extensions as illustrated in the listing below, we can basically alter
the behavior of the app.

```js
// extensions.js

import { extend } from './mext.js';
import { UtilsDef, MainDef } from './app.js';

// alter add method of Utils
// export this extension if we allow extensions that relies on this extension
export const UtilsExt1 = extend(UtilsDef, (Utils) => {
  return class extends Utils {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  }
});

// alter start method of Main
const MainExt1 = extend(MainDef, (Main) => {
  return class extends Main {
    start() {
      super.start();
      console.log('added log from extension');
    }
  }
});
```

When the above file is loaded together with the `app.js` file (except the
module-level `.compile` calls), instead of logging the following:

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

Loading the listings above will generate the following classes:

```
[Foo] = FooExt1 -> FooDef
[Bar] = BarExt1 -> BarDef -> [Foo]
[Utils] = UtilsExt1 -> UtilsDef
[Main] = MainExt1 -> MainDef
```

And if we loaded the following listing:

```js
const FooExt2 = extend(FooDef, (Foo) => {
  return class extends Foo {};
});
```
`class Foo` and `class Bar` becomes:

```
[Foo] = FooExt2 -> FooExt2 -> FooDef
[Bar] = BarExt1 -> BarDef -> FooExt2 -> FooExt2 -> FooDef
```
