import { extend } from "./mext.js";

// `extend` only makes sense for class definitions and mixins.
// It will not work for example with utils defined in app.js.

// When extending, we assume the existence of the defined
// class and the placeholder is the second argument of the
// callback. In this example, we named the 2nd argument A
// because it is the name of the class being extended.
extend("A", async (_, A) => {
  return class extends A {
    constructor() {
      super();
      console.log("A1");
    }
  };
});

// We again extend A. The name of the 2nd argument be anything.
// It is just but a placeholder.
// At this point, the inheritance chain for A is:
// |A| => A2 -> A1 -> A
extend("A", async ({ require }, AnyNameButStillClassA) => {
  const Z = await require("Z");
  return class extends AnyNameButStillClassA {
    constructor() {
      super();
      console.log("A2");
      this.z = new Z();
      this.z.foo();
    }
  };
});

// We extend B. Inheritance chain:
// |B| => B1 -> B -> |A|
// |B| => B1 -> B -> A2 -> A1 -> A
extend("B", async (_, B) => {
  return class extends B {
    constructor() {
      super();
      console.log("B1");
    }
  };
});

// We extend C. Inheritance chain:
// |C| => C1 -> C -> |SimpleMixin| -> |B|
// We put SimpleMixin in a box because it is extended below.
extend("C", async (_, C) => {
  return class extends C {
    constructor() {
      super();
      console.log("C1");
    }
  };
});

// Extend SimpleMixin
// |SimpleMixin| => SimpleMixin1 -> SimpleMixin
extend("SimpleMixin", async ({ require }, SimpleMixin) => {
  await require("helper");
  return class extends SimpleMixin {
    simpleMixinMethod() {
      super.simpleMixinMethod();
      console.log("SimpleMixin extension 1");
    }
  };
});

// Extend again SimpleMixin
// |SimpleMixin| => SimpleMixin2 -> SimpleMixin1 -> SimpleMixin
extend("SimpleMixin", async (_, SimpleMixin) => {
  return class extends SimpleMixin {
    simpleMixinMethod() {
      super.simpleMixinMethod();
      console.log("SimpleMixin extension 2");
    }
  };
});

// Main can also be extended.
extend("Main", async ({ require }, Main) => {
  await require("helper");
  return class extends Main {
    constructor() {
      super();
      console.log("Main is extended!");
    }
  };
});
