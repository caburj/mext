import { defclass } from "../../../mext.js";
import FooDef from "../module1/Foo.js";

export default defclass(() => {
  const CompiledFoo = FooDef.compile();
  return class extends CompiledFoo {
    constructor() {
      super();
      console.log("Bar");
    }
    bar() {
      return "bar";
    }
  };
});
