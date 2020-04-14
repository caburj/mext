import { defclass } from "../../../mext.js";
import utils from "./_utils.js";

export default defclass(() => {
  const { add } = utils.compile();
  return class {
    constructor() {
      console.log(`Foo [1+1=${add(1, 1)}]`);
    }
  };
});
