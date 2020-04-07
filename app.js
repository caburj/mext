import { define, mixin, getMain } from "./mext.js";

getMain().then((Main) => {
  const main = new Main();
  console.log(`main instanceof Main: ${main instanceof Main}`);
});

// define Main.
// The compiled Main class is the resolve value of `getMain` call.
define("Main", async ({ require }) => {
  const { add } = await require("utils");
  const C = await require("C");
  const D = await require("D");
  return class {
    constructor() {
      this.c = new C();
      this.c.simpleMixinMethod();
      this.d = new D();
      this.d.simpleMixinMethod();
      this.d.otherMixinMethod();
      console.log(`1 + 1 = ${add(1, 1)}`);
    }
  };
});

// module that does only side effect when loaded.
define("helper", async () => {
  console.log("helper imported");
});

// module that returns a singleton.
define("utils", async () => {
  return {
    x: "x",
    add(a, b) {
      return a + b;
    },
  };
});

// define class A.
define("A", async ({ require }) => {
  const { x } = await require("utils");
  return class {
    constructor() {
      console.log("A", `using utils.x: ${x}`);
    }
  };
});

// define class B that extends A.
// |B| => B -> A
define("B", async ({ require }) => {
  const A = await require("A");
  return class extends A {
    constructor() {
      super();
      console.log("B based on A");
    }
  };
});

define("Z", async () => {
  return class {
    constructor() {
      console.log("Z: used by mixin");
    }
    foo() {
      console.log("foo");
    }
  };
});

// define SimpleMixin.
// This is mixin pattern where the mixin extends the class
// it will be mixed with. Thus, we have the second argument
// (arbitrarily named) that will serve as placeholder for
// the class to be extended.
mixin("SimpleMixin", async (_, toExtend) => {
  return class extends toExtend {
    simpleMixinMethod() {
      console.log("SimpleMixin");
    }
  };
});

// defining mixin can still use require.
// Here, we imported class Z, then instantiate it everytime
// otherMixinMethod is called.
mixin("OtherMixin", async ({ require }, toExtend) => {
  const Z = await require("Z");
  return class extends toExtend {
    otherMixinMethod() {
      const z = new Z();
      console.log("OtherMixin");
      z.foo();
    }
  };
});

// define class C by extending B mixed with SimpleMixin.
// The inheritance chain is: |C| => C -> SimpleMixin -> B -> A
define("C", async ({ require, mixWith }) => {
  const B = await require("B");
  const SimpleMixin = await require("SimpleMixin");
  return class extends (await mixWith(B, [SimpleMixin])) {
    constructor() {
      super();
      console.log("C");
    }
  };
});

// define class D by extending A mixed with SimpleMixin and OtherMixin.
// Inheritance chain is: |D| => D -> OtherMixin -> SimpleMixin -> A
define("D", async ({ require, mixWith }) => {
  const A = await require("A");
  const OtherMixin = await require("OtherMixin");
  const SimpleMixin = await require("SimpleMixin");
  return class extends (await mixWith(A, [SimpleMixin, OtherMixin])) {
    constructor() {
      super();
      console.log("D");
    }
  };
});
