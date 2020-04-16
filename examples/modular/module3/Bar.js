import { defclass } from "../../../mext.js";
import { Foo } from "../module1/index.js";

export default defclass(() => {
  return class extends Foo.compile() {
    constructor() {
      super();
      console.log("Bar");
    }
    bar() {
      return "bar";
    }
  };
});
