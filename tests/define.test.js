import {
  defclass,
  defmodule,
  extend,
  reset,
  defmixin,
  mix,
  isInCache,
} from "../mext.js";

beforeEach(() => reset());

describe("define", () => {
  test("define simple class", () => {
    let x = 0;
    const Main = defclass(() => {
      return class {
        constructor() {
          x += 1;
        }
      };
    }).compile();
    new Main();
    expect(x).toEqual(1);
  });

  test("extend class in-place", () => {
    let MainDef = defclass(() => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    extend(MainDef, (Main) => {
      return class extends Main {
        foo() {
          return super.foo() + " extended";
        }
      };
    });
    const Main = MainDef.compile();
    const main = new Main();
    expect(main.foo()).toEqual("foo extended");
  });

  test("define by extending other class", () => {
    const MDef = defclass(() => {
      return class {
        get value() {
          return 10;
        }
      };
    });
    const MainDef = defclass(() => {
      const M = MDef.compile();
      return class extends M {
        start() {
          return "start";
        }
      };
    });
    const Main = MainDef.compile();
    const main = new Main();
    expect(main.value).toEqual(10);
    expect(main.start()).toEqual("start");

    const M = MDef.compile();
    const m = new M();
    expect(m.value).toEqual(10);
    expect(m.start).toEqual(undefined);
  });

  test("define class based on other class that is extended in-place", () => {
    // |B| => B -> |A|
    // |A| => A2 -> A1 -> A
    const ADef = defclass(() => {
      return class {
        get name() {
          return "A";
        }
      };
    });
    const BDef = defclass(() => {
      const A = ADef.compile();
      return class extends A {
        get name() {
          return "B -> " + super.name;
        }
      };
    });
    extend(ADef, (A) => {
      return class extends A {
        get name() {
          return "A1 -> " + super.name;
        }
      };
    });
    extend(ADef, (A) => {
      return class extends A {
        get name() {
          return "A2 -> " + super.name;
        }
      };
    });
    const B = BDef.compile();
    const b = new B();
    expect(b.name).toEqual("B -> A2 -> A1 -> A");
  });

  test("define helper module", () => {
    const utilsDef = defmodule(() => {
      return {
        add(a, b) {
          return a + b;
        },
        mul(a, b) {
          return a * b;
        },
      };
    });
    const stupidUtilsDef = defmodule(() => {
      const { add, mul } = utilsDef.compile();
      return {
        add(a, b) {
          return add(a, b) + 1;
        },
        mul(a, b) {
          return mul(a, b) * 10;
        },
      };
    });
    const WrongMainDef = defclass(() => {
      const { add, mul } = stupidUtilsDef.compile();
      expect(add(1, 1)).toEqual(3);
      expect(mul(1, 2)).toEqual(20);
    });
    const CorrectMainDef = defclass(() => {
      const { add, mul } = utilsDef.compile();
      expect(add(1, 1)).toEqual(2);
      expect(mul(3, 2)).toEqual(6);
    });

    // call only for their side-effects
    WrongMainDef.compile();
    CorrectMainDef.compile();
  });

  test("extend multiple times", () => {
    // definitions
    const ADef = defclass(() => {
      return class {
        foo() {
          return "A0";
        }
      };
    });
    const BDef = defclass(() => {
      const A = ADef.compile();
      return class extends A {
        foo() {
          return super.foo() + "B0";
        }
      };
    });
    const CDef = defclass(() => {
      const B = BDef.compile();
      return class extends B {
        foo() {
          return super.foo() + "C0";
        }
      };
    });
    const DDef = defclass(() => {
      const A = ADef.compile();
      return class extends A {
        foo() {
          return super.foo() + "D0";
        }
      };
    });
    // extensions
    extend(ADef, (compiledA) => {
      return class extends compiledA {
        foo() {
          return super.foo() + "A1";
        }
      };
    });
    extend(ADef, (compiledA) => {
      return class extends compiledA {
        foo() {
          return super.foo() + "A2";
        }
      };
    });
    extend(CDef, (compileC) => {
      return class extends compileC {
        foo() {
          return super.foo() + "C1";
        }
      };
    });
    extend(BDef, (compiledB) => {
      return class extends compiledB {
        foo() {
          return super.foo() + "B1";
        }
      };
    });
    const a = new (ADef.compile())();
    const b = new (BDef.compile())();
    const c = new (CDef.compile())();
    const d = new (DDef.compile())();
    expect(a.foo()).toEqual("A0A1A2");
    expect(b.foo()).toEqual("A0A1A2B0B1");
    expect(c.foo()).toEqual("A0A1A2B0B1C0C1");
    expect(d.foo()).toEqual("A0A1A2D0");
  });

  test("return a function that returns a class and make the class patchable", () => {
    const RegistryDef = defmodule(() => {
      return function (name) {
        if (name === "Field")
          return class {
            foo() {
              return "foo";
            }
          };
      };
    });
    const MainDef = defclass(() => {
      const Registry = RegistryDef.compile();
      // extract the class from registry and make it extensible
      const FieldDef = defclass(() => {
        return Registry("Field");
      });
      // extend the newly defined class Field
      extend(FieldDef, (CompiledField) => {
        return class extends CompiledField {
          foo() {
            return super.foo() + "extended";
          }
        };
      });
      // get the promised class Field
      const Field = FieldDef.compile();
      expect("fooextended").toEqual(new Field().foo());
    });
    MainDef.compile();
  });

  test("extend then remove/reapply extension", () => {
    const ADef = defclass(() => {
      return class {
        get name() {
          return "A";
        }
      };
    });

    const BDef = defclass(() => {
      const A = ADef.compile();
      return class extends A {
        get name() {
          return "B -> " + super.name;
        }
      };
    });

    const AExt1 = extend(ADef, (A) => {
      return class extends A {
        get name() {
          return "A1 -> " + super.name;
        }
      };
    });

    const AExt2 = extend(ADef, (A) => {
      return class extends A {
        get name() {
          return "A2 -> " + super.name;
        }
      };
    });

    let B = BDef.compile();
    let b = new B();
    expect(b.name).toEqual("B -> A2 -> A1 -> A");

    AExt1.remove();
    B = BDef.compile();
    b = new B();
    expect(b.name).toEqual("B -> A2 -> A");

    AExt2.remove();
    AExt1.reapply();
    B = BDef.compile();
    b = new B();
    expect(b.name).toEqual("B -> A1 -> A");

    const BExt1 = extend(BDef, (B) => {
      return class extends B {
        get name() {
          return "B2 -> " + super.name;
        }
      };
    });

    B = BDef.compile();
    b = new B();
    expect(b.name).toEqual("B2 -> B -> A1 -> A");

    AExt1.remove();
    BExt1.remove();
    B = BDef.compile();
    b = new B();
    expect(b.name).toEqual("B -> A");

    AExt1.reapply();
    AExt2.reapply();
    BExt1.reapply();
    B = BDef.compile();
    b = new B();
    expect(b.name).toEqual("B2 -> B -> A2 -> A1 -> A");
  });

  test("registry cache on complex inheritance tree", () => {
    /**
     * Main 🠖 Foo 🠖 Mixin2
     *   🠗      🠗
     *  XXX    Bar 🠔 Baz 🠔 YYY (YYY called by Main)
     *   🠗      🠗
     * Mixin  Component
     */

    const MixinDef = defmixin((toExtend) => {
      return class extends toExtend {
        get val() {
          return "Mixin " + super.val;
        }
      };
    });

    const Mixin2Def = defmixin((toExtend) => {
      return class extends toExtend {
        get val() {
          return "Mixin2 " + super.val;
        }
      };
    });

    const ComponentDef = defclass(() => {
      return class {
        get val() {
          return "Component";
        }
      };
    });

    const XXXDef = defclass(() => {
      const XXX = class {
        get val() {
          return "XXX";
        }
      };
      return mix(XXX).with([MixinDef.compile()]);
    });

    const BarDef = defclass(() => {
      return class extends ComponentDef.compile() {
        get val() {
          return "Bar " + super.val;
        }
      };
    });

    const BazDef = defclass(() => {
      return class extends BarDef.compile() {
        get val() {
          return "Baz " + super.val;
        }
      };
    });

    const YYYDef = defclass(() => {
      return class extends BazDef.compile() {
        get val() {
          return "YYY " + super.val;
        }
      };
    });

    const FooDef = defclass(() => {
      return class extends mix(BarDef.compile()).with([Mixin2Def.compile()]) {
        get val() {
          return "Foo " + super.val;
        }
      };
    });

    const MainDef = defclass(() => {
      const Foo = FooDef.compile();
      const XXX = XXXDef.compile();
      const YYY = YYYDef.compile();
      return class {
        constructor() {
          this._foo = new Foo();
          this._xxx = new XXX();
          this._yyy = new YYY();
        }
        get foo() {
          return this._foo.val;
        }
        get xxx() {
          return this._xxx.val;
        }
        get yyy() {
          return this._yyy.val;
        }
        get val() {
          return "Main";
        }
      };
    });

    const BarExt = extend(BarDef, (Bar) => {
      return class extends Bar {
        get val() {
          return "Bar1 " + super.val;
        }
      };
    });

    let foo = FooDef.create();
    let baz = BazDef.create();
    expect(foo.val).toEqual("Foo Mixin2 Bar1 Bar Component");
    expect(baz.val).toEqual("Baz Bar1 Bar Component");

    // check inheritance tree after compiling FooDef and BazDef
    // They are compiled when create is called.
    expect(FooDef.compilationParents.size).toEqual(0);
    expect(BazDef.compilationParents.size).toEqual(0);
    expect(Mixin2Def.compilationParents.size).toEqual(1);
    expect(ComponentDef.compilationParents.size).toEqual(1);
    expect(BarDef.compilationParents.size).toEqual(2);
    const barParents = [...BarDef.compilationParents];
    expect(barParents[0]).toEqual(FooDef);
    expect(barParents[1]).toEqual(BazDef);

    BarExt.remove();

    expect(isInCache(FooDef)).toEqual(false);
    expect(isInCache(BazDef)).toEqual(false);
    expect(isInCache(Mixin2Def)).toEqual(true);
    expect(isInCache(ComponentDef)).toEqual(true);
    expect(isInCache(BarDef)).toEqual(false);

    BarExt.reapply();
    let main = MainDef.create();
    expect(main.foo).toEqual("Foo Mixin2 Bar1 Bar Component");
    expect(main.xxx).toEqual("Mixin XXX");
    expect(main.yyy).toEqual("YYY Baz Bar1 Bar Component");

    const Mixin2Ext = extend(Mixin2Def, (toExtend) => {
      return class extends toExtend {
        get val() {
          return "Mixin2Ext " + super.val;
        }
      };
    });
    // check which are in cache.
    expect(isInCache(MainDef)).toEqual(false);
    expect(isInCache(XXXDef)).toEqual(true);
    expect(isInCache(MixinDef)).toEqual(true);
    expect(isInCache(FooDef)).toEqual(false);
    expect(isInCache(Mixin2Def)).toEqual(false);
    expect(isInCache(BarDef)).toEqual(true);
    expect(isInCache(BazDef)).toEqual(true);
    expect(isInCache(YYYDef)).toEqual(true);
    expect(isInCache(ComponentDef)).toEqual(true);

    MainDef.compile(); // to cache again the classes

    const ComponentExt = extend(ComponentDef, (Component) => {
      return class extends Component {
        get val() {
          return "ComponentExt" + super.val;
        }
      };
    });

    const MixinExt = extend(MixinDef, (toExtend) => {
      return class extends toExtend {
        get val() {
          return "MixinExt" + super.val;
        }
      };
    });

    // check cache after couple of extensions

    expect(isInCache(MainDef)).toEqual(false);
    expect(isInCache(XXXDef)).toEqual(false);
    expect(isInCache(MixinDef)).toEqual(false);
    expect(isInCache(FooDef)).toEqual(false);
    expect(isInCache(Mixin2Def)).toEqual(true);
    expect(isInCache(BarDef)).toEqual(false);
    expect(isInCache(BazDef)).toEqual(false);
    expect(isInCache(YYYDef)).toEqual(false);
    expect(isInCache(ComponentDef)).toEqual(false);

    MainDef.compile(); // to cache again the classes

    // Extending Main should only invalidate Main's
    const MainExt = extend(MainDef, (Main) => {
      return class extends Main {
        get val() {
          return "MainExt " + super.val;
        }
      };
    });

    expect(isInCache(MainDef)).toEqual(false);
    expect(isInCache(XXXDef)).toEqual(true);
    expect(isInCache(MixinDef)).toEqual(true);
    expect(isInCache(FooDef)).toEqual(true);
    expect(isInCache(Mixin2Def)).toEqual(true);
    expect(isInCache(BarDef)).toEqual(true);
    expect(isInCache(BazDef)).toEqual(true);
    expect(isInCache(YYYDef)).toEqual(true);
    expect(isInCache(ComponentDef)).toEqual(true);

    MainDef.compile(); // to cache again the classes

    // what happens when ComponentExt is removed;
    ComponentExt.remove();
    expect(isInCache(MainDef)).toEqual(false);
    expect(isInCache(XXXDef)).toEqual(true);
    expect(isInCache(MixinDef)).toEqual(true);
    expect(isInCache(FooDef)).toEqual(false);
    expect(isInCache(Mixin2Def)).toEqual(true);
    expect(isInCache(BarDef)).toEqual(false);
    expect(isInCache(BazDef)).toEqual(false);
    expect(isInCache(YYYDef)).toEqual(false);
    expect(isInCache(ComponentDef)).toEqual(false);

    MainDef.compile(); // to cache again the classes

    // Let's remove the two mixin extensions and the Main extension
    // what happens to cache then?
    Mixin2Ext.remove();
    MixinExt.remove();
    MainExt.remove();
    expect(isInCache(MainDef)).toEqual(false);
    expect(isInCache(XXXDef)).toEqual(false);
    expect(isInCache(MixinDef)).toEqual(false);
    expect(isInCache(FooDef)).toEqual(false);
    expect(isInCache(Mixin2Def)).toEqual(false);
    expect(isInCache(BarDef)).toEqual(true);
    expect(isInCache(BazDef)).toEqual(true);
    expect(isInCache(YYYDef)).toEqual(true);
    expect(isInCache(ComponentDef)).toEqual(true);

    MainDef.compile();

    // Foo val before and after reapplication of Mixin2Ext
    foo = FooDef.create();
    expect(foo.val).toEqual("Foo Mixin2 Bar1 Bar Component");
    Mixin2Ext.reapply();
    foo = FooDef.create();
    expect(foo.val).toEqual("Foo Mixin2Ext Mixin2 Bar1 Bar Component");
  });

  test("module definitions cache should also be invalidated", () => {
    /**
     * Module 🠖 Maths 🠖 Utils
     *    🠗
     * Helper
     */
    const Helper = defclass(() => {
      return class {
        magic(x) {
          return x + 42;
        }
      };
    });
    const Utils = defclass(() => {
      return class {
        subOne(n) {
          return n - 1;
        }
        addOne(n) {
          return n + 1;
        }
      };
    });
    const Maths = defclass(() => {
      return class extends Utils.compile() {
        mul(a, b) {
          return a * b;
        }
      };
    });
    const Module = defmodule(() => {
      const maths = Maths.create();
      const helper = Helper.create();
      return { maths, helper };
    });

    let module = Module.compile();
    // after Module compile, all the definitions should be in cache
    expect(isInCache(Helper)).toEqual(true);
    expect(isInCache(Utils)).toEqual(true);
    expect(isInCache(Maths)).toEqual(true);
    expect(isInCache(Module)).toEqual(true);

    expect(module.helper.magic(10)).toEqual(52);

    const HelperExt = extend(Helper, (Helper) => {
      return class extends Helper {
        magic(x) {
          return super.magic(x) - 42;
        }
      };
    });
    // after extending Helper, cache should be invalidated
    // for Helper and Module.
    expect(isInCache(Helper)).toEqual(false);
    expect(isInCache(Utils)).toEqual(true);
    expect(isInCache(Maths)).toEqual(true);
    expect(isInCache(Module)).toEqual(false);

    // compile module an check the changes in Helper.magic
    module = Module.compile();
    expect(module.helper.magic(10)).toEqual(10);

    // compile back to original, no Helper extension
    HelperExt.remove();
    module = Module.compile();

    extend(Maths, (Maths) => {
      return class extends Maths {
        fact(n) {
          return n === 0 ? 1 : n * this.fact(n - 1);
        }
      };
    });
    // after extending Maths, cache should be invalidated
    // for Maths and Module.
    expect(isInCache(Helper)).toEqual(true);
    expect(isInCache(Utils)).toEqual(true);
    expect(isInCache(Maths)).toEqual(false);
    expect(isInCache(Module)).toEqual(false);
    module = Module.compile();
    expect(module.maths.fact(4)).toEqual(24);
  });
});
