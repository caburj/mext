import { defclass } from "../../../mext.js";

export default defclass(() => {
  return class {
    add(a, b) {
      return a + b;
    }
  };
});
