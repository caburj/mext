import { extend } from "../../mext.js";
import { Main } from "./module0.js";

export const M2Main = extend(Main, async (Main) => {
  return class extends Main {
    constructor() {
      super();
      console.log("M2Main");
    }
  };
});
