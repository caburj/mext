const classCache = new Map();
const moduleCache = new Map();
const mixinCache = new Map();
const classExtCBsMap = new Map();
const mixinExtCBsMap = new Map();

function invalidateCache(def) {
  mixinCache.delete(def.__originCB__);
  classCache.delete(def.__originCB__);
  def._compiled = null;
  for (let parent of def.__parents__) {
    invalidateCache(parent);
  }
  def.__parents__.clear();
}

export function extend(onTopOf, callback) {
  if (!(onTopOf instanceof Array)) {
    onTopOf = [onTopOf];
  }
  const [origin, ...rest] = onTopOf;
  const __originCB__ = origin.__originCB__;
  let cbArray;
  if (
    rest.length === 0 ||
    (rest.length && rest.every((def) => def.__originCB__ === __originCB__))
  ) {
    // we just push on top of the callback array. The import mechanism of
    // javascript takes care of the order of these callbacks.
    // The ones that are added first are applied first in the inheritance
    // chain, the last one is at the very top of the chain.
    if (classExtCBsMap.get(__originCB__)) {
      cbArray = classExtCBsMap.get(__originCB__);
    } else if (mixinExtCBsMap.get(__originCB__)) {
      cbArray = mixinExtCBsMap.get(__originCB__);
    }
    invalidateCache.call(this, origin.def);
  } else {
    throw new Error(
      "All dependencies should be extending the same class definition."
    );
  }
  const loc = cbArray.length;
  cbArray.push(callback);
  return {
    remove() {
      cbArray[loc] = false;
      invalidateCache.call(this, this.def);
    },
    reapply() {
      cbArray[loc] = callback;
      invalidateCache.call(this, this.def);
    },
    get def() {
      return origin.def;
    },
    get __originCB__() {
      return __originCB__;
    },
  };
}

const compileStack = [];

export function defclass(callback) {
  const originalCB = callback;
  classExtCBsMap.set(originalCB, [callback]);
  // Parents are for class compilation.
  // They are the `definitions (class or mixin)` that when
  // compiled, calls compile to this definition.
  // It is used to generate the tree of dependency so
  // that we can smartly invalidate only those that are
  // affected when extending/removing extensions/reapplying
  // extension of fully compiled inheritance tree - meaning
  // all nodes (which are the defined classes and mixins)
  // are compiled.
  const __parents__ = new Set([]);
  return {
    compile() {
      this._updateParents();
      if (classCache.has(originalCB)) {
        compileStack.pop();
        return classCache.get(originalCB);
      } else {
        const extensionCBs = classExtCBsMap.get(originalCB);
        const compiled = extensionCBs
          .filter(Boolean)
          .reduce((acc, cb) => cb(acc), originalCB());
        classCache.set(originalCB, compiled);
        compileStack.pop();
        this._compiled = compiled;
        return compiled;
      }
    },
    create() {
      if (!this._compiled) {
        // this._compiled is nullified when invalidating the cache;
        this._compiled = this.compile();
      }
      return new this._compiled(...arguments);
    },
    get __originCB__() {
      return originalCB;
    },
    get def() {
      return this;
    },
    get __parents__() {
      return __parents__;
    },
    _updateParents() {
      let top;
      if (compileStack.length !== 0) {
        top = compileStack[compileStack.length - 1];
      }
      compileStack.push(this);
      if (top) {
        this.__parents__.add(top);
      }
    },
  };
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

export function defmixin(callback) {
  const originalMixin = callback;
  mixinExtCBsMap.set(originalMixin, [callback]);
  const __parents__ = new Set([]);
  return {
    compile() {
      this._updateParents();
      if (mixinCache.has(originalMixin)) {
        compileStack.pop();
        return mixinCache.get(originalMixin);
      } else {
        const extensionCBs = mixinExtCBsMap.get(originalMixin);
        const compiled = function (toExtend) {
          return extensionCBs
            .filter(Boolean)
            .reduce((acc, cb) => cb(acc), toExtend);
        };
        mixinCache.set(originalMixin, compiled);
        compileStack.pop();
        this._compiled = compiled; // cache it
        return compiled;
      }
    },
    get __originCB__() {
      return originalMixin;
    },
    get def() {
      return this;
    },
    get __parents__() {
      return __parents__;
    },
    _updateParents() {
      let top;
      if (compileStack.length !== 0) {
        top = compileStack[compileStack.length - 1];
      }
      compileStack.push(this);
      if (top) {
        this.__parents__.add(top);
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
    classCache.has(def.__originCB__) ||
    mixinCache.has(def.__originCB__) ||
    moduleCache.has(def.__originCB__)
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
