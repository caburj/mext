let cache = Object.create(null);
let definitionCBmap = Object.create(null);
let mixinCBmap = Object.create(null);

export function require(name) {
  return new Promise(async (resolve, reject) => {
    if (name in cache) {
      resolve(cache[name]);
    } else {
      try {
        if (name in definitionCBmap) {
          const [firstCB, ...restCBs] = definitionCBmap[name];
          const compiled = await restCBs.reduce(
            async (acc, cb) => await cb({ require, mixWith }, await acc),
            await firstCB({ require, mixWith })
          );
          cache[name] = compiled;
          resolve(compiled);
        } else if (name in mixinCBmap) {
          const callbacks = mixinCBmap[name];
          const compiledMixinCB = function (toExtend) {
            return callbacks.reduce(
              async (acc, cb) => await cb({ require, mixWith }, await acc),
              toExtend
            );
          };
          cache[name] = compiledMixinCB;
          resolve(compiledMixinCB);
        }
      } catch (error) {
        reject(error);
      }
    }
  });
}

function mixWith(toExtend, mixins) {
  return mixins.reduce(async (acc, cb) => await cb(acc), toExtend);
}

export function define(name, callback) {
  definitionCBmap[name] = [callback];
}

export function mixin(name, callback) {
  mixinCBmap[name] = [callback];
}

export function extend(name, callback) {
  if (name in definitionCBmap) {
    definitionCBmap[name].push(callback);
  } else if (name in mixinCBmap) {
    mixinCBmap[name].push(callback);
  } else {
    throw new Error(`'${name}' is not yet defined.`);
  }
}

export function whenReady() {
  return new Promise((resolve) => {
    window.addEventListener("DOMContentLoaded", async () => {
      resolve(await require("Main"));
    });
  });
}

export function reset() {
  cache = Object.create(null);
  definitionCBmap = Object.create(null);
  mixinCBmap = Object.create(null);
}
