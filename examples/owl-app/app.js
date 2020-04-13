import { defclass, whenReady } from "../../mext.js";

export const AppDef = defclass(async () => {
  return class extends owl.Component {
    static template = owl.tags.xml/* html */ `
      <div t-on-click="onClick">
        <span>Hello </span>
        <span t-esc="state.name"></span>
        <span>!</span>
      </div>
    `;
    constructor() {
      super(...arguments);
      this.state = owl.useState({ name: "World" });
    }
    onClick() {
      this.state.name = this.state.name === "World" ? "Joseph" : "World";
    }
  };
});

whenReady().then(async () => {
  const App = await AppDef.compile();
  const app = new App();
  app.mount(main);
});
