import { AppDef } from "./app.js";
import { extend } from "../../mext.js";

export const Ext1AppDef = extend(AppDef, (App) => {
  return class extends App {
    static template = owl.tags.xml/* html */ `
      <div>
        <div t-on-click="onClick">
          <span>Noice </span>
          <span t-esc="state.name"></span>
          <span>!</span>
        </div>
        <input type="text" t-model="state.name" />
      </div>
    `;
  };
});
