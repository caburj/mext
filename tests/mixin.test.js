import { extend, reset, defclass, defmixin, mix } from "../mext.js";

beforeEach(() => reset());

describe("mixin", () => {
  test("simple mixin", () => {
    class X {
      foo() {
        return "foo";
      }
    }
    const Adef = defclass(() => {
      const SimpleMixin = SimpleMixinDef.compile();
      return class extends mix(X).with([SimpleMixin]) {
        foo() {
          return "foo " + super.foo();
        }
      };
    });
    const SimpleMixinDef = defmixin((toExtend) => {
      return class extends toExtend {
        bar() {
          return "mixin bar";
        }
      };
    });
    const A = Adef.compile();
    const a = new A();
    expect(a.foo()).toEqual("foo foo");
    expect(a.bar()).toEqual("mixin bar");
  });

  test("extended mixin", () => {
    const ADef = defclass(() => {
      return class {
        constructor(foo) {
          this._foo = foo;
        }
        get foo() {
          return this._foo;
        }
      };
    });
    const BDef = defclass(() => {
      const A = ADef.compile();
      const Mixin = MixinDef.compile();
      return class extends mix(A).with([Mixin]) {
        get foo() {
          return `B ${super.foo}`;
        }
      };
    });
    const MixinDef = defmixin((toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend(MixinDef, (toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    // mixin should have no effect on A
    const A = ADef.compile();
    const a = new A("x");
    expect(a.foo).toEqual("x");
    expect(a.bar).toEqual(undefined);
    // mixin applied when defining B
    const B = BDef.compile();
    const b = new B("y");
    expect(b.foo).toEqual("B y");
    expect(b.bar()).toEqual("extended bar");
  });

  test("multiple mixins", () => {
    const Adef = defclass(() => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    // |B| => B -> OtherMixin -> |Mixin| -> |A|
    const BDef = defclass(() => {
      const A = Adef.compile();
      const Mixin = MixinDef.compile();
      const OtherMixin = OtherMixinDef.compile();
      return class extends mix(A).with([Mixin, OtherMixin]) {
        foo() {
          return `B ${super.foo()}`;
        }
      };
    });
    const MixinDef = defmixin((toExtend) => {
      return class extends toExtend {
        bar() {
          return "bar";
        }
      };
    });
    extend(MixinDef, (toExtend) => {
      return class extends toExtend {
        bar() {
          return `extended ${super.bar()}`;
        }
      };
    });
    const OtherMixinDef = defmixin((toExtend) => {
      return class extends toExtend {
        baz() {
          return "baz";
        }
      };
    });
    // mixin should have no effect on A
    const A = Adef.compile();
    const a = new A();
    expect(a.foo()).toEqual("foo");
    expect(a.bar).toEqual(undefined);
    expect(a.baz).toEqual(undefined);
    // mixin applied when defining B
    const B = BDef.compile();
    const b = new B();
    expect(b.foo()).toEqual("B foo");
    expect(b.bar()).toEqual("extended bar");
    expect(b.baz()).toEqual("baz");
  });
});
