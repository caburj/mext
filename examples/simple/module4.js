import { extend } from "../../mext.js";
import { M2Main } from "./module2.js";
import { M3Foo, M3Helper } from "./module3.js";
import { helper } from "./module1.js";
import { Mixin } from "./module0.js";

export const M4Main = extend(M2Main, async (Main) => {
  return class extends Main {
    constructor() {
      super();
      console.log("M4Main");
    }
  };
});

export const M4Foo = extend(M3Foo, async (Foo) => {
  const { add } = await helper.compile();
  return class extends Foo {
    foo() {
      super.foo();
      console.log("foo 4 " + `[42+42=${add(42, 42)}]`);
    }
  };
});

export const M4Helper = extend(M3Helper, async (Helper) => {
  return class extends Helper {
    add(a, b) {
      return a + b;
    }
  };
});

export const M4Mixn = extend(Mixin, async (Mixin) => {
  return class extends Mixin {
    mixinMethod() {
      super.mixinMethod();
      console.log("M4 Mixin Method");
    }
  };
});
