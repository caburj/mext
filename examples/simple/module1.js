import { extend, defclass, defmodule, defmixin, mix } from "../../mext.js";
import { Main, Foo } from "./module0.js";

export const Mixin2 = defmixin(async (toExtend) => {
  return class extends toExtend {
    mixin2Method() {
      console.log("Mixin 2");
    }
  };
});

export const M1Main = extend(Main, async (Main) => {
  return class extends Main {
    constructor() {
      super();
      console.log("M1Main");
    }
  };
});

export const M1Foo = extend(Foo, async (Foo) => {
  const { add } = await helper.compile();
  const CompiledMixin2 = await Mixin2.compile();
  return class extends (await mix(Foo).with(CompiledMixin2)) {
    foo() {
      super.foo();
      console.log(`foo 1, then [1+1=${add(1, 1)}]`);
      this.mixin2Method();
    }
  };
});

export const Helper = defclass(async () => {
  return class {
    add(a, b) {
      return a + b;
    }
  };
});

export const helper = defmodule(async () => {
  const CompiledHelper = await Helper.compile();
  return new CompiledHelper();
});
