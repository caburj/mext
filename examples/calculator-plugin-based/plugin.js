import { MainDef } from "./core.js";
import { defclass, extend } from "../../mext.js";

export const AddDef = defclass(() => {
  return class {
    name = "add";
    apply(...args) {
      return args.reduce((acc, a) => acc + a, 0);
    }
  };
});

export const MultiplyDef = defclass(() => {
  return class {
    name = "mul";
    apply(...args) {
      return args.reduce((acc, a) => acc * a, 1);
    }
  };
});

extend(MainDef, (Main) => {
  const Add = AddDef.compile();
  const Multiply = MultiplyDef.compile();
  return class extends Main {
    registerOperations() {
      super.registerOperations();
      this.registerOperation(new Add());
      this.registerOperation(new Multiply());
      console.log("Plugin: done registering operations.");
    }
    start() {
      super.start();
      console.log("10 + 10 =", this.apply("add", 10, 10));
      console.log("5 + 15 =", this.apply("mul", 5, 15));
      console.log("Done with Plugin.");
    }
  };
});
