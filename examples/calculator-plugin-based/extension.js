import { MainDef } from "./core.js";
import { defclass, extend } from "../../mext.js";
import { AddDef } from "./plugin.js";

/**
 * We added new operations in this extension, just like in plugin.js,
 * however, we extended the behaviour of add operation, such that it
 * doesn't allow 1 as the first input of adding.
 */

export const SubtractDef = defclass(async () => {
  return class {
    name = "sub";
    apply(a, b) {
      if (arguments.length !== 2) throw new Error("Can only subtract 2 numbers");
      return a - b;
    }
  };
});

export const DivideDef = defclass(async () => {
  return class {
    name = "div";
    apply(a, b) {
      if (arguments.length !== 2) throw new Error("Can only subtract 2 numbers");
      if (b === 0) throw new Error("Unable to divide by 0");
      return a / b;
    }
  };
});

// Extend Main to register the newly created operations.
extend(MainDef, async (Main) => {
  const Subtract = await SubtractDef.compile();
  const Divide = await DivideDef.compile();
  return class extends Main {
    registerOperations() {
      super.registerOperations();
      this.registerOperation(new Subtract());
      this.registerOperation(new Divide());
      console.log("Extension: Done registering operations.");
    }
    start() {
      super.start();
      console.log("100 - 10 =", this.apply("sub", 100, 10));
      console.log("50 / 15 =", this.apply("div", 50, 15));
      try {
        this.apply("add", 1, 1);
      } catch (error) {
        console.log("1 + 1 =", error.message);
      }
      try {
        this.apply("div", 1, 0);
      } catch (error) {
        console.log("1 / 0 =", error.message);
      }
      console.log("Done with Extension.");
    }
  };
});

// Extend Add such that if 1 is given as first argument, throw an error.
extend(AddDef, async (Add) => {
  return class extends Add {
    apply(a) {
      if (a === 1) {
        throw new Error(`Can't add 1 if extension.js is installed.`);
      } else {
        return super.apply(...arguments);
      }
    }
  };
});
