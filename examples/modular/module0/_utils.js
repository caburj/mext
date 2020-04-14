import { defmodule } from "../../../mext.js";
import Utils from "./Utils.js";

export default defmodule(() => {
  const CompiledUtils = Utils.compile();
  return new CompiledUtils();
});
