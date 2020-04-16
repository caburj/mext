import { extend } from "../../../mext.js";
import { Foo } from "../module0/index.js";

export default extend(Foo, (x) => {
  return class extends x {
    constructor() {
      super();
      console.log("Module1Foo");
    }
  };
});
