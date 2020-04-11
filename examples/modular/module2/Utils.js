import { extend } from "../../../mext.js";
import UtilsDef from "../module0/Utils.js";

export default extend(UtilsDef, async (compiledUtils) => {
  return class extends compiledUtils {
    add(a, b) {
      return super.add(a, b) + 1;
    }
  };
});
