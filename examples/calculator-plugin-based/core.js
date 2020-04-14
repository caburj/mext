import { defclass, whenReady } from "../../mext.js";

export const MainDef = defclass(async () => {
  return class {
    operations = {};
    registerOperation(operation) {
      this.operations[operation.name] = operation;
    }
    apply(name, ...args) {
      return this.operations[name].apply(...args);
    }
    registerOperations() {
      console.log("Registering operations...");
    }
    start() {
      console.log("Starting app...");
    }
  };
});

whenReady().then(async () => {
  const Main = await MainDef.compile();
  const main = new Main();
  main.registerOperations();
  main.start();
});
