const cache = Object.create(null);
const definitionCBmap = Object.create(null);
const mixinCBmap = Object.create(null);

function require(name) {
  return new Promise(async (resolve) => {
    if (name in cache) {
      resolve(cache[name]);
    } else {
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
  }
}

export function getMain() {
  return new Promise((resolve) => {
    window.addEventListener("DOMContentLoaded", async () => {
      resolve(await require("Main"));
    });
  });
}
