import { defclass } from "../../../mext.js";
import Foo from "./Foo.js";

export default defclass(() => {
  const CompiledFoo = Foo.compile();
  return class {
    constructor() {
      console.log("Main");
      this.foo = new CompiledFoo();
    }
    async start() {}
  };
});
