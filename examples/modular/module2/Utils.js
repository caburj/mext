import { extend } from "../../../mext.js";
import { Utils } from "../module0/index.js";

export default extend(Utils, (x) => {
  return class extends x {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  };
});
