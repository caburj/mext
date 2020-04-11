import { whenReady } from "../../../mext.js";
import Main from "./Main.js";

whenReady().then(async () => {
  const CompiledMain = await Main.compile();
  const main = new CompiledMain();
  main.start();
});
