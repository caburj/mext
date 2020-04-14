import { extend } from "../../../mext.js";
import FooDef from "../module0/Foo.js";

export default extend(FooDef, (compiledFoo) => {
  return class extends compiledFoo {
    constructor() {
      super();
      console.log("Module1Foo");
    }
  };
});
