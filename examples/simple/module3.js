import { extend } from "../../mext.js";
import { M1Main, M1Foo, Helper, helper } from "./module1.js";
import { M2Main } from "./module2.js";

export const M3Main = extend([M1Main, M2Main], async (Main) => {
  return class extends Main {
    constructor() {
      super();
      console.log("M3Main");
    }
  };
});

export const M3Foo = extend(M1Foo, async (Foo) => {
  const { add, mul } = await helper.compile();
  return class extends Foo {
    foo() {
      super.foo();
      console.log(`foo 3, [1+1=${add(1, 1)}], [10*10=${mul(10, 10)}]`);
    }
  };
});

export const M3Helper = extend(Helper, async (Helper) => {
  return class extends Helper {
    add(a, b) {
      return super.add(a, b) * 1000;
    }
    mul(a, b) {
      return a * b;
    }
  };
});
