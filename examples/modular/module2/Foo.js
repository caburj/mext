import { extend } from "../../../mext.js";
import { Foo } from "../module1/index.js";

export default extend(Foo, (x) => {
  return class extends x {
    constructor() {
      super();
      console.log("Module2Foo");
    }
  };
});
