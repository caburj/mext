import { extend, defclass, defmodule, defmixin, mixWith } from "../../mext.js";
import { Main, Foo } from "./module0.js";

export const Mixin2 = defmixin((toExtend) => {
  return class extends toExtend {
    mixin2Method() {
      console.log("Mixin 2");
    }
  };
});

export const M1Main = extend(Main, (Main) => {
  return class extends Main {
    constructor() {
      super();
      console.log("M1Main");
    }
  };
});

export const M1Foo = extend(Foo, (Foo) => {
  const { add } = helper.compile();
  const CompiledMixin2 = Mixin2.compile();
  return class extends mixWith(Foo, CompiledMixin2) {
    foo() {
      super.foo();
      console.log(`foo 1, then [1+1=${add(1, 1)}]`);
      this.mixin2Method();
    }
  };
});

export const Helper = defclass(() => {
  return class {
    add(a, b) {
      return a + b;
    }
  };
});

export const helper = defmodule(() => {
  const CompiledHelper = Helper.compile();
  return new CompiledHelper();
});
