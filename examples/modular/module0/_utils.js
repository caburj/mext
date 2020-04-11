import { defmodule } from "../../../mext.js";
import Utils from "./Utils.js";

export default defmodule(async () => {
  const CompiledUtils = await Utils.compile();
  return new CompiledUtils();
});
