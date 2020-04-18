const classCache = new Map();
const moduleCache = new Map();
const mixinCache = new Map();
const classExtCBsMap = new Map();
const mixinExtCBsMap = new Map();

function invalidateCache(def) {
  mixinCache.delete(def.originalCB);
  classCache.delete(def.originalCB);
  def._compiled = null;
  for (let parent of def.compilationParents) {
    invalidateCache(parent);
  }
  def.compilationParents.clear();
}

const compileStack = [];

class Extension {
  constructor(originDef, extensionCBArray, loc, callback) {
    this.originDef = originDef;
    this.extensionCBArray = extensionCBArray;
    this.loc = loc;
    this.callback = callback;
    invalidateCache(this.originDef);
  }
  remove() {
    this.extensionCBArray[this.loc] = false;
    invalidateCache(this.originDef);
  }
  reapply() {
    this.extensionCBArray[this.loc] = this.callback;
    invalidateCache(this.originDef);
  }
}

class Definition {
  constructor(originalCB) {
    this.originalCB = originalCB;
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
    let top;
    if (compileStack.length !== 0) {
      top = compileStack[compileStack.length - 1];
    }
    compileStack.push(this);
    if (top) {
      this.compilationParents.add(top);
    }
  }
}

class ClassDefinition extends Definition {
  compile() {
    this._updateParents();
    if (classCache.has(this.originalCB)) {
      compileStack.pop();
      return classCache.get(this.originalCB);
    } else {
      const extensionCBs = classExtCBsMap.get(this.originalCB);
      const compiled = extensionCBs
        .filter(Boolean)
        .reduce((acc, cb) => cb(acc), this.originalCB());
      classCache.set(this.originalCB, compiled);
      compileStack.pop();
      this._compiled = compiled;
      return compiled;
    }
  }
  create() {
    if (!this._compiled) {
      // this._compiled is nullified when invalidating the cache;
      this._compiled = this.compile();
    }
    return new this._compiled(...arguments);
  }
}

class MixinDefinition extends Definition {
  compile() {
    this._updateParents();
    if (mixinCache.has(this.originalCB)) {
      compileStack.pop();
      return mixinCache.get(this.originalCB);
    } else {
      const extensionCBs = mixinExtCBsMap.get(this.originalCB);
      const compiled = function (toExtend) {
        return extensionCBs
          .filter(Boolean)
          .reduce((acc, cb) => cb(acc), toExtend);
      };
      mixinCache.set(this.originalCB, compiled);
      compileStack.pop();
      this._compiled = compiled; // cache it
      return compiled;
    }
  }
}

export function extend(onTopOf, callback) {
  if (!(onTopOf instanceof Array)) {
    onTopOf = [onTopOf];
  }
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
  let extensionCBArray;
  if (
    rest.length === 0 ||
    (rest.length &&
      rest.every((item) => {
        if (item instanceof Definition) {
          return item.originalCB === originDef.originalCB;
        } else if (item instanceof Extension) {
          return item.originDef.originalCB === originDef.originalCB;
        }
      }))
  ) {
    if (classExtCBsMap.get(originDef.originalCB)) {
      extensionCBArray = classExtCBsMap.get(originDef.originalCB);
    } else if (mixinExtCBsMap.get(originDef.originalCB)) {
      extensionCBArray = mixinExtCBsMap.get(originDef.originalCB);
    }
  } else {
    throw new Error(
      "If extending multiple extensions, they should all have the same 'originDef'."
    );
  }
  // we just push on top of the callback array. The import mechanism of
  // javascript takes care of the order of these callbacks.
  // The ones that are added first are applied first in the inheritance
  // chain, the last one is at the very top of the chain.
  extensionCBArray.push(callback);
  return new Extension(
    originDef,
    extensionCBArray,
    extensionCBArray.length - 1,
    callback
  );
}

export function defclass(callback) {
  classExtCBsMap.set(callback, [callback]);
  return new ClassDefinition(callback);
}

export function defmixin(callback) {
  mixinExtCBsMap.set(callback, [callback]);
  return new MixinDefinition(callback);
}

export function defmodule(callback) {
  return {
    compile() {
      if (moduleCache.has(callback)) {
        return moduleCache.get(callback);
      } else {
        const compiled = callback();
        moduleCache.set(callback, compiled);
        return compiled;
      }
    },
  };
}

export function mix(compiledClass) {
  return {
    with(compiledMixins) {
      if (!(compiledMixins instanceof Array)) {
        compiledMixins = [compiledMixins];
      }
      return compiledMixins.reduce((acc, cb) => cb(acc), compiledClass);
    },
  };
}

// misc methods

export function isInCache(def) {
  return (
    classCache.has(def.originalCB) ||
    mixinCache.has(def.originalCB) ||
    moduleCache.has(def.originalCB)
  );
}

export function whenReady() {
  return new Promise((resolve) => {
    window.addEventListener("DOMContentLoaded", () => {
      resolve();
    });
  });
}

export function reset() {
  classCache.clear();
  moduleCache.clear();
  mixinCache.clear();
  classExtCBsMap.clear();
  mixinExtCBsMap.clear();
}
