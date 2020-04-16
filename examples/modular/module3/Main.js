import { extend } from "../../../mext.js";
import { Main } from "../module0/index.js";
import BarDef from "./Bar.js";

export default extend(Main, (x) => {
  const Bar = BarDef.compile();
  return class extends x {
    constructor() {
      super();
      this.bar = new Bar();
    }
    async start() {
      super.start();
      let i = 0;
      setInterval(() => {
        console.log(`${this.bar.bar()} ${i++}`);
      }, 2000);
    }
  };
});
