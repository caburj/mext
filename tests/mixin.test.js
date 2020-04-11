import { extend, reset, defclass, defmixin, mix } from "../mext.js";

beforeEach(() => reset());

describe("mixin", () => {
  test("simple mixin", async () => {
    class X {
      foo() {
        return "foo";
      }
    }
    const Adef = defclass(async () => {
      const SimpleMixin = await SimpleMixinDef.compile();
      return class extends (await mix(X).with([SimpleMixin])) {
        foo() {
          return "foo " + super.foo();
        }
      };
    });
    const SimpleMixinDef = defmixin(async (toExtend) => {
      return class extends toExtend {
        bar() {
          return "mixin bar";
        }
      };
    });
    const A = await Adef.compile();
    const a = new A();
    expect(a.foo()).toEqual("foo foo");
    expect(a.bar()).toEqual("mixin bar");
  });

  test("extended mixin", async () => {
    const ADef = defclass(async () => {
      return class {
        constructor(foo) {
          this._foo = foo;
        }
        get foo() {
          return this._foo;
        }
      };
    });
    const BDef = defclass(async () => {
      const A = await ADef.compile();
      const Mixin = await MixinDef.compile();
      return class extends (await mix(A).with([Mixin])) {
        get foo() {
          return `B ${super.foo}`;
        }
      };
    });
    const MixinDef = defmixin(async (toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend(MixinDef, async (toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    // mixin should have no effect on A
    const A = await ADef.compile();
    const a = new A("x");
    expect(a.foo).toEqual("x");
    expect(a.bar).toEqual(undefined);
    // mixin applied when defining B
    const B = await BDef.compile();
    const b = new B("y");
    expect(b.foo).toEqual("B y");
    expect(b.bar()).toEqual("extended bar");
  });

  test("multiple mixins", async () => {
    const Adef = defclass(async () => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    // |B| => B -> OtherMixin -> |Mixin| -> |A|
    const BDef = defclass(async () => {
      const A = await Adef.compile();
      const Mixin = await MixinDef.compile();
      const OtherMixin = await OtherMixinDef.compile();
      return class extends (await mix(A).with([Mixin, OtherMixin])) {
        foo() {
          return `B ${super.foo()}`;
        }
      };
    });
    const MixinDef = defmixin(async (toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend(MixinDef, async (toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    const OtherMixinDef = defmixin(async (toExtend) => {
      return class extends toExtend {
        baz() {
          return "baz";
        }
      };
    });
    // mixin should have no effect on A
    const A = await Adef.compile();
    const a = new A();
    expect(a.foo()).toEqual("foo");
    expect(a.bar).toEqual(undefined);
    expect(a.baz).toEqual(undefined);
    // mixin applied when defining B
    const B = await BDef.compile();
    const b = new B();
    expect(b.foo()).toEqual("B foo");
    expect(b.bar()).toEqual("extended bar");
    expect(b.baz()).toEqual("baz");
  });
});
