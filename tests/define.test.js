import { defclass, defmodule, extend, reset } from "../mext.js";

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
});
