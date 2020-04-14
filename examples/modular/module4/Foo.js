import { extend } from "../../../mext.js";
import FooDef from "../module1/Foo.js";

export default extend(FooDef, (CompiledFoo) => {
  return class extends CompiledFoo {
    constructor() {
      super();
      console.log("Module4Foo");
    }
  };
});
