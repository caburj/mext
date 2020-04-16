import { whenReady } from "../../../mext.js";
import Main from "./Main.js";

whenReady().then(() => {
  const CompiledMain = Main.compile();
  const main = new CompiledMain();
  main.start();
});

export { Main };
export { default as Foo } from "./Foo.js";
export { default as Utils } from "./Utils.js";
export { default as utils } from "./_utils.js";
