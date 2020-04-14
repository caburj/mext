import { defclass, whenReady, mix, defmixin } from "../../mext.js";

export const Mixin = defmixin((toExtend) => {
  return class extends toExtend {
    mixinMethod() {
      console.log("Mixin Method");
    }
  };
});

export const Main = defclass(() => {
  const CompiledFoo = Foo.compile();
  const CompiledMixin = Mixin.compile();
  return mix(
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

export const Foo = defclass(() => {
  return class {
    foo() {
      console.log("foo 0");
    }
  };
});

whenReady().then(() => {
  const CompiledMain = Main.compile();
  const main = new CompiledMain();
  main.start();
});
