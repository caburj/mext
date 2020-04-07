import { define, extend, mixin, require, reset } from "../mext.js";

beforeEach(() => reset());

describe("mixin", () => {
  test("simple mixin", async () => {
    class X {
      foo() {
        return "foo";
      }
    }
    define("A", async ({ require, mixWith }) => {
      const SimpleMixin = await require("SimpleMixin");
      return class extends (await mixWith(X, [SimpleMixin])) {
        foo() {
          return "foo " + super.foo();
        }
      };
    });
    mixin("SimpleMixin", async (_, toExtend) => {
      return class extends toExtend {
        bar() {
          return "mixin bar";
        }
      };
    });
    const A = await require("A");
    const a = new A();
    expect(a.foo()).toEqual("foo foo");
    expect(a.bar()).toEqual("mixin bar");
  });

  test("extended mixin", async () => {
    define("A", async () => {
      return class {
        constructor(foo) {
          this._foo = foo;
        }
        get foo() {
          return this._foo;
        }
      };
    });
    define("B", async ({ require, mixWith }) => {
      const A = await require("A");
      const Mixin = await require("Mixin");
      return class extends (await mixWith(A, [Mixin])) {
        get foo() {
          return `B ${super.foo}`;
        }
      };
    });
    mixin("Mixin", async (_, toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend("Mixin", async (_, toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    // mixin should have no effect on A
    const A = await require("A");
    const a = new A("x");
    expect(a.foo).toEqual("x");
    expect(a.bar).toEqual(undefined);
    // mixin applied when defining B
    const B = await require("B");
    const b = new B("y");
    expect(b.foo).toEqual("B y");
    expect(b.bar()).toEqual("extended bar");
  });

  test("multiple mixins", async () => {
    define("A", async () => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    // |B| => B -> OtherMixin -> |Mixin| -> |A|
    define("B", async ({ require, mixWith }) => {
      const A = await require("A");
      const Mixin = await require("Mixin");
      const OtherMixin = await require("OtherMixin");
      return class extends (await mixWith(A, [Mixin, OtherMixin])) {
        foo() {
          return `B ${super.foo()}`;
        }
      };
    });
    mixin("Mixin", async (_, toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend("Mixin", async (_, toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    mixin("OtherMixin", async (_, toExtend) => {
      return class extends toExtend {
        baz() {
          return "baz";
        }
      };
    });
    // mixin should have no effect on A
    const A = await require("A");
    const a = new A();
    expect(a.foo()).toEqual("foo");
    expect(a.bar).toEqual(undefined);
    expect(a.baz).toEqual(undefined);
    // mixin applied when defining B
    const B = await require("B");
    const b = new B();
    expect(b.foo()).toEqual("B foo");
    expect(b.bar()).toEqual("extended bar");
    expect(b.baz()).toEqual("baz");
  });
});
