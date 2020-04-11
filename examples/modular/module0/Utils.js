import { defclass } from "../../../mext.js";

export default defclass(async () => {
  return class {
    add(a, b) {
      return a + b;
    }
  };
});
