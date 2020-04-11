import { extend } from "../../../mext.js";
import UtilsDef from "../module2/Utils.js";

export default extend(UtilsDef, async (CompiledUtils) => {
  return class extends CompiledUtils {
    add(a, b) {
      return super.add(a, b) * 10000;
    }
  };
});
