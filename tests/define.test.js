import { define, extend, require, reset } from "../mext.js";

beforeEach(() => reset());

describe("define", () => {
  test("define simple class", async () => {
    let x = 0;
    define("Main", async () => {
      return class {
        constructor() {
          x += 1;
        }
      };
    });
    const Main = await require("Main");
    new Main();
    expect(x).toEqual(1);
  });

  test("extend class in-place", async () => {
    define("Main", async () => {
      return class {
        foo() {
          return "foo";
        }
      };
    });
    extend("Main", async (_, Main) => {
      return class extends Main {
        foo() {
          return super.foo() + " extended";
        }
      };
    });
    const Main = await require("Main");
    const main = new Main();
    expect(main.foo()).toEqual("foo extended");
  });

  test("define by extending other class", async () => {
    define("M", async () => {
      return class {
        get value() {
          return 10;
        }
      };
    });
    define("Main", async ({ require }) => {
      const M = await require("M");
      return class extends M {
        start() {
          return "start";
        }
      };
    });
    const Main = await require("Main");
    const main = new Main();
    expect(main.value).toEqual(10);
    expect(main.start()).toEqual("start");

    const M = await require("M");
    const m = new M();
    expect(m.value).toEqual(10);
    expect(m.start).toEqual(undefined);
  });

  test("define class based on other class that is extended in-place", async () => {
    // |B| => B -> |A|
    // |A| => A2 -> A1 -> A
    define("A", async () => {
      return class {
        get name() {
          return "A";
        }
      };
    });
    define("B", async ({ require }) => {
      const A = await require("A");
      return class extends A {
        get name() {
          return "B -> " + super.name;
        }
      };
    });
    extend("A", async (_, A) => {
      return class extends A {
        get name() {
          return "A1 -> " + super.name;
        }
      };
    });
    extend("A", async (_, A) => {
      return class extends A {
        get name() {
          return "A2 -> " + super.name;
        }
      };
    });
    const B = await require("B");
    const b = new B();
    expect(b.name).toEqual("B -> A2 -> A1 -> A");
  });

  test("define helper module", async () => {
    define("utils", async () => {
      return {
        add(a, b) {
          return a + b;
        },
        mul(a, b) {
          return a * b;
        },
      };
    });
    define("stupidUtils", async ({ require }) => {
      const { add, mul } = await require("utils");
      return {
        add(a, b) {
          return add(a, b) + 1;
        },
        mul(a, b) {
          return mul(a, b) * 10;
        },
      };
    });
    define("WrongMain", async ({ require }) => {
      const { add, mul } = await require("stupidUtils");
      expect(add(1, 1)).toEqual(3);
      expect(mul(1, 2)).toEqual(20);
    });
    define("CorrectMain", async ({ require }) => {
      const { add, mul } = await require("utils");
      expect(add(1, 1)).toEqual(2);
      expect(mul(3, 2)).toEqual(6);
    });

    // call only for their side-effects
    await require("WrongMain");
    await require("CorrectMain");
  });

  test("extend multiple times", async () => {
    // definitions
    define("A", async () => {
      return class {
        foo() {
          return "A0";
        }
      };
    });
    define("B", async ({ require }) => {
      const A = await require("A");
      return class extends A {
        foo() {
          return super.foo() + "B0";
        }
      };
    });
    define("C", async ({ require }) => {
      const B = await require("B");
      return class extends B {
        foo() {
          return super.foo() + "C0";
        }
      };
    });
    define("D", async ({ require }) => {
      const A = await require("A");
      return class extends A {
        foo() {
          return super.foo() + "D0";
        }
      };
    });
    // extensions
    extend("A", async (_, A) => {
      return class extends A {
        foo() {
          return super.foo() + "A1";
        }
      };
    });
    extend("A", async (_, A) => {
      return class extends A {
        foo() {
          return super.foo() + "A2";
        }
      };
    });
    extend("C", async (_, C) => {
      return class extends C {
        foo() {
          return super.foo() + "C1";
        }
      };
    });
    extend("B", async (_, B) => {
      return class extends B {
        foo() {
          return super.foo() + "B1";
        }
      };
    });
    const a = new (await require("A"))();
    const b = new (await require("B"))();
    const c = new (await require("C"))();
    const d = new (await require("D"))();
    expect(a.foo()).toEqual("A0A1A2");
    expect(b.foo()).toEqual("A0A1A2B0B1");
    expect(c.foo()).toEqual("A0A1A2B0B1C0C1");
    expect(d.foo()).toEqual("A0A1A2D0");
  });
});
