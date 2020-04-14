import { whenReady } from "../../../mext.js";
import Main from "./Main.js";

whenReady().then(() => {
  const CompiledMain = Main.compile();
  const main = new CompiledMain();
  main.start();
});
