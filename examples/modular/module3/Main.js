import { extend } from "../../../mext.js";
import MainDef from "../module0/Main.js";
import BarDef from "./Bar.js";

export default extend(MainDef, (Main) => {
  const Bar = BarDef.compile();
  return class extends Main {
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
