import { defclass, defmodule, extend, reset } from "../mext.js";

beforeEach(() => reset());

describe("define", () => {
  test("define simple class", async () => {
    let x = 0;
    const Main = await defclass(async () => {
      return class {
        constructor() {
          x += 1;
        }
      };
    }).compile();
    new Main();
    expect(x).toEqual(1);
  });

  test("extend class in-place", async () => {
    let MainDef = defclass(async () => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    extend(MainDef, async (Main) => {
      return class extends Main {
        foo() {
          return super.foo() + " extended";
        }
      };
    });
    const Main = await MainDef.compile();
    const main = new Main();
    expect(main.foo()).toEqual("foo extended");
  });

  test("define by extending other class", async () => {
    const MDef = defclass(async () => {
      return class {
        get value() {
          return 10;
        }
      };
    });
    const MainDef = defclass(async () => {
      const M = await MDef.compile();
      return class extends M {
        start() {
          return "start";
        }
      };
    });
    const Main = await MainDef.compile();
    const main = new Main();
    expect(main.value).toEqual(10);
    expect(main.start()).toEqual("start");

    const M = await MDef.compile();
    const m = new M();
    expect(m.value).toEqual(10);
    expect(m.start).toEqual(undefined);
  });

  test("define class based on other class that is extended in-place", async () => {
    // |B| => B -> |A|
    // |A| => A2 -> A1 -> A
    const ADef = defclass(async () => {
      return class {
        get name() {
          return "A";
        }
      };
    });
    const BDef = defclass(async () => {
      const A = await ADef.compile();
      return class extends A {
        get name() {
          return "B -> " + super.name;
        }
      };
    });
    extend(ADef, async (A) => {
      return class extends A {
        get name() {
          return "A1 -> " + super.name;
        }
      };
    });
    extend(ADef, async (A) => {
      return class extends A {
        get name() {
          return "A2 -> " + super.name;
        }
      };
    });
    const B = await BDef.compile();
    const b = new B();
    expect(b.name).toEqual("B -> A2 -> A1 -> A");
  });

  test("define helper module", async () => {
    const utilsDef = defmodule(async () => {
      return {
        add(a, b) {
          return a + b;
        },
        mul(a, b) {
          return a * b;
        },
      };
    });
    const stupidUtilsDef = defmodule(async () => {
      const { add, mul } = await utilsDef.compile();
      return {
        add(a, b) {
          return add(a, b) + 1;
        },
        mul(a, b) {
          return mul(a, b) * 10;
        },
      };
    });
    const WrongMainDef = defclass(async () => {
      const { add, mul } = await stupidUtilsDef.compile();
      expect(add(1, 1)).toEqual(3);
      expect(mul(1, 2)).toEqual(20);
    });
    const CorrectMainDef = defclass(async () => {
      const { add, mul } = await utilsDef.compile();
      expect(add(1, 1)).toEqual(2);
      expect(mul(3, 2)).toEqual(6);
    });

    // call only for their side-effects
    await WrongMainDef.compile();
    await CorrectMainDef.compile();
  });

  test("extend multiple times", async () => {
    // definitions
    const ADef = defclass(async () => {
      return class {
        foo() {
          return "A0";
        }
      };
    });
    const BDef = defclass(async () => {
      const A = await ADef.compile();
      return class extends A {
        foo() {
          return super.foo() + "B0";
        }
      };
    });
    const CDef = defclass(async () => {
      const B = await BDef.compile();
      return class extends B {
        foo() {
          return super.foo() + "C0";
        }
      };
    });
    const DDef = defclass(async () => {
      const A = await ADef.compile();
      return class extends A {
        foo() {
          return super.foo() + "D0";
        }
      };
    });
    // extensions
    extend(ADef, async (compiledA) => {
      return class extends compiledA {
        foo() {
          return super.foo() + "A1";
        }
      };
    });
    extend(ADef, async (compiledA) => {
      return class extends compiledA {
        foo() {
          return super.foo() + "A2";
        }
      };
    });
    extend(CDef, async (compileC) => {
      return class extends compileC {
        foo() {
          return super.foo() + "C1";
        }
      };
    });
    extend(BDef, async (compiledB) => {
      return class extends compiledB {
        foo() {
          return super.foo() + "B1";
        }
      };
    });
    const a = new (await ADef.compile())();
    const b = new (await BDef.compile())();
    const c = new (await CDef.compile())();
    const d = new (await DDef.compile())();
    expect(a.foo()).toEqual("A0A1A2");
    expect(b.foo()).toEqual("A0A1A2B0B1");
    expect(c.foo()).toEqual("A0A1A2B0B1C0C1");
    expect(d.foo()).toEqual("A0A1A2D0");
  });

  test("return a function that returns a class and make the class patchable", async () => {
    const RegistryDef = defmodule(async () => {
      return function (name) {
        if (name === "Field")
          return class {
            foo() {
              return "foo";
            }
          };
      };
    });
    const MainDef = defclass(async () => {
      const Registry = await RegistryDef.compile();
      // extract the class from registry and make it extensible
      const FieldDef = defclass(async () => {
        return Registry("Field");
      });
      // extend the newly defined class Field
      extend(FieldDef, async (CompiledField) => {
        return class extends CompiledField {
          foo() {
            return super.foo() + "extended";
          }
        };
      });
      // get the promised class Field
      const Field = await FieldDef.compile();
      expect("fooextended").toEqual(new Field().foo());
    });
    await MainDef.compile();
  });
});
