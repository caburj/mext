import { extend } from "../../../mext.js";
import MainDef from "../module0/Main.js";
import BarDef from "./Bar.js";

export default extend(MainDef, async (Main) => {
  const Bar = await BarDef.compile();
  return class extends Main {
    constructor() {
      super();
      this.bar = new Bar();
    }
    async start() {
      await super.start();
      let i = 0;
      setInterval(() => {
        console.log(`${this.bar.bar()} ${i++}`);
      }, 2000);
    }
  };
});
