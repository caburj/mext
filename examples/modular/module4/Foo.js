import { extend } from "../../../mext.js";
import FooDef from "../module1/Foo.js";

export default extend(FooDef, async (CompiledFoo) => {
  return class extends CompiledFoo {
    constructor() {
      super();
      console.log("Module4Foo");
    }
  };
});