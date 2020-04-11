import { defclass } from "../../../mext.js";
import utils from "./_utils.js";

export default defclass(async () => {
  const { add } = await utils.compile();
  return class {
    constructor() {
      console.log(`Foo [1+1=${add(1, 1)}]`);
    }
  };
});
