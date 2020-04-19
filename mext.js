class Extension {
  constructor(originDef, extensionCB) {
    this.originDef = originDef;
    this.extensionIndex = this.extensionCBArray.length;
    this.extensionCB = extensionCB;
    this.originDef.invalidateCache();
    // Add the new extension callback to the extension array of the original definition
    // we just push on top of the callback array. The import mechanism of
    // javascript takes care of the order of these callbacks.
    // The ones that are added first are applied first in the inheritance
    // chain, the last one is at the very top of the chain.
    this.extensionCBArray.push(extensionCB);
  }
  remove() {
    this.extensionCBArray[this.extensionIndex] = false;
    this.originDef.invalidateCache();
  }
  reapply() {
    this.extensionCBArray[this.extensionIndex] = this.extensionCB;
    this.originDef.invalidateCache();
  }
  get extensionCBArray() {
    return this.originDef.extensionCBArray;
  }
}

class Definition {
  constructor(callback) {
    this.extensionCBArray = [callback];
    // Parents are for class compilation.
    // They are the `definitions (class or mixin)` that when
    // compiled, calls compile to this definition.
    // It is used to generate the tree of dependency so
    // that we can smartly invalidate only those that are
    // affected when extending/removing extensions/reapplying
    // extension of fully compiled inheritance tree - meaning
    // all nodes (which are the defined classes and mixins)
    // are compiled.
    this.compilationParents = new Set([]);
  }
  _updateParents() {
    const compileStack = this.constructor.compileStack;
    let top;
    if (compileStack.length !== 0) {
      top = compileStack[compileStack.length - 1];
    }
    compileStack.push(this);
    if (top) {
      this.compilationParents.add(top);
    }
  }
  invalidateCache() {
    this.constructor.cache.delete(this);
    for (let def of this.compilationParents) {
      def.invalidateCache();
    }
    this.compilationParents.clear();
  }
  isInCache() {
    return this.constructor.cache.has(this);
  }
  compile() {
    const compileStack = this.constructor.compileStack;
    const cache = this.constructor.cache;
    this._updateParents();
    if (cache.has(this)) {
      compileStack.pop();
      return cache.get(this);
    } else {
      const compiled = this._compile();
      cache.set(this, compiled);
      compileStack.pop();
      return compiled;
    }
  }
  // This method is specific to the concrete class
  // that subclasses this class.
  _compile() {}
}
Definition.compileStack = [];

class ClassDefinition extends Definition {
  _compile() {
    const [originalCB, ...extensionCBs] = this.extensionCBArray;
    return extensionCBs
      .filter(Boolean)
      .reduce((acc, cb) => cb(acc), originalCB());
  }
  compile() {
    const res = super.compile();
    this._compiled = res;
    return res;
  }
  invalidateCache() {
    super.invalidateCache();
    this._compiled = undefined;
  }
  create() {
    if (!this._compiled) {
      // this._compiled is nullified when invalidating the cache;
      this._compiled = this.compile();
    }
    return new this._compiled(...arguments);
  }
}
ClassDefinition.cache = new Map();

class MixinDefinition extends Definition {
  _compile() {
    const extensionCBs = this.extensionCBArray;
    return function (toExtend) {
      return extensionCBs
        .filter(Boolean)
        .reduce((acc, cb) => cb(acc), toExtend);
    };
  }
}
MixinDefinition.cache = new Map();

class ModuleDefinition extends Definition {
  constructor(callback) {
    super(callback);
    this.originalCB = callback;
  }
  _compile() {
    return this.originalCB();
  }
}
ModuleDefinition.cache = new Map();

export function extend(onTopOf, extensionCB) {
  if (!(onTopOf instanceof Array)) {
    onTopOf = [onTopOf];
  }

  // Determine the original definition.
  const [first, ...rest] = onTopOf;
  let originDef;
  if (first instanceof Definition) {
    originDef = first;
  } else if (first instanceof Extension) {
    originDef = first.originDef;
  } else {
    throw new Error(
      "Only instances of 'Definition' or 'Extension' can be extended."
    );
  }

  // All items in rest of onTopOf should have the same definition
  // to the original definition (originDef).
  if (
    rest.length &&
    rest.some((item) => {
      if (item instanceof Definition) {
        return item !== originDef;
      } else if (item instanceof Extension) {
        return item.originDef !== originDef;
      }
    })
  ) {
    throw new Error(
      "If extending multiple extensions, they should all have the same 'originDef'."
    );
  }

  return new Extension(originDef, extensionCB);
}

export function defclass(callback) {
  return new ClassDefinition(callback);
}

export function defmixin(callback) {
  return new MixinDefinition(callback);
}

export function defmodule(callback) {
  return new ModuleDefinition(callback);
}

export function mixWith(toExtend, compiledMixins) {
  if (!(compiledMixins instanceof Array)) {
    compiledMixins = [compiledMixins];
  }
  return compiledMixins.reduce((acc, cb) => cb(acc), toExtend);
}

// misc methods

export function whenReady() {
  return new Promise((resolve) => {
    window.addEventListener("DOMContentLoaded", () => {
      resolve();
    });
  });
}

export function reset() {
  ClassDefinition.cache.clear();
  MixinDefinition.cache.clear();
  ModuleDefinition.cache.clear();
}
