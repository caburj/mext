import { defclass, whenReady, mix, defmixin } from "../../mext.js";

export const Mixin = defmixin(
  async (toExtend) =>
    class extends toExtend {
      mixinMethod() {
        console.log("Mixin Method");
      }
    }
);

export const Main = defclass(async () => {
  const CompiledFoo = await Foo.compile();
  const CompiledMixin = await Mixin.compile();
  return await mix(
    class {
      constructor() {
        console.log("Main");
      }
      start() {
        this.foo = new CompiledFoo();
        this.foo.foo();
        this.mixinMethod();
      }
    }
  ).with(CompiledMixin);
});

export const Foo = defclass(async () => {
  return class {
    foo() {
      console.log("foo 0");
    }
  };
});

whenReady().then(async () => {
  const CompiledMain = await Main.compile();
  const main = new CompiledMain();
  main.start();
});
