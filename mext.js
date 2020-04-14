const classCache = new Map();
const moduleCache = new Map();
const mixinCache = new Map();
const classExtCBsMap = new Map();
const mixinExtCBsMap = new Map();

export function extend(onTopOf, callback) {
  if (!(onTopOf instanceof Array)) {
    onTopOf = [onTopOf];
  }
  const [origin, ...rest] = onTopOf;
  if (
    rest.length === 0 ||
    (rest.length && rest.every((def) => def.__original__ === origin.__original__))
  ) {
    // we just push on top of the callback array. The import mechanism of
    // javascript takes care of the order of these callbacks.
    // The ones that are added first are applied first in the inheritance
    // chain, the last one is at the very top of the chain.
    if (classExtCBsMap.get(origin.__original__)) {
      classExtCBsMap.get(origin.__original__).push(callback);
    } else if (mixinExtCBsMap.get(origin.__original__)) {
      mixinExtCBsMap.get(origin.__original__).push(callback);
    }
  } else {
    throw new Error("All dependencies should be extending the same class definition.");
  }
  return origin;
}

export function defclass(callback) {
  const originalCB = callback;
  classExtCBsMap.set(originalCB, [callback]);
  return {
    compile() {
      if (classCache.has(originalCB)) {
        return classCache.get(originalCB);
      } else {
        const extensionCBs = classExtCBsMap.get(originalCB);
        const compiled = extensionCBs.reduce((acc, cb) => cb(acc), originalCB());
        classCache.set(originalCB, compiled);
        return compiled;
      }
    },
    get __original__() {
      return originalCB;
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
  return {
    compile() {
      if (mixinCache.has(originalMixin)) {
        return mixinCache.get(originalMixin);
      } else {
        const extensionCBs = mixinExtCBsMap.get(originalMixin);
        const compiled = function (toExtend) {
          return extensionCBs.reduce((acc, cb) => cb(acc), toExtend);
        };
        mixinCache.set(originalMixin, compiled);
        return compiled;
      }
    },
    get __original__() {
      return originalMixin;
    },
  };
}

export function mix(compiledClass) {
  return {
    with(mixins) {
      if (!(mixins instanceof Array)) {
        mixins = [mixins];
      }
      return mixins.reduce((acc, cb) => cb(acc), compiledClass);
    },
  };
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
