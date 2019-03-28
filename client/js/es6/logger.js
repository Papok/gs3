let level = 4;
let custom = new Set([]);

const custom_level = 0; //  the logger funciton logs if it is in the custom set
const error_level = 1;
const warn_level = 2;
const info_level = 3;
const log_level = 4; //log during development (ex. initialization progress) 
const debug_level = 5;


let error = (function() {
  let local_level = error_level;
  let local_tag = "error";
  let level_ok = level >= local_level;
  let custom_ok = level == custom_level && custom.has(local_tag);
  if (level_ok || custom_ok) {
    return Function.prototype.bind.call(console.error, console);
  } else {
    return function() {};
  }
})();

let warn = (function() {
  let local_level = warn_level;
  let local_tag = "warn";
  let level_ok = level >= local_level;
  let custom_ok = level == custom_level && custom.has(local_tag);
  if (level_ok || custom_ok) {
    return Function.prototype.bind.call(console.warn, console);
  } else {
    return function() {};
  }
})();

let info = (function() {
  let local_level = info_level;
  let local_tag = "info";
  let level_ok = level >= local_level;
  let custom_ok = level == custom_level && custom.has(local_tag);
  if (level_ok || custom_ok) {
    return Function.prototype.bind.call(console.info, console);
  } else {
    return function() {};
  }
})();

let log = (function() {
  let local_level = log_level;
  let local_tag = "log";
  let level_ok = level >= local_level;
  let custom_ok = level == custom_level && custom.has(local_tag);
  if (level_ok || custom_ok) {
    return Function.prototype.bind.call(console.log, console);
  } else {
    return function() {};
  }
})();

let debug = (function() {
  let local_level = debug_level;
  let local_tag = "debug";
  let level_ok = level >= local_level;
  let custom_ok = level == custom_level && custom.has(local_tag);
  if (level_ok || custom_ok) {
    return Function.prototype.bind.call(console.debug, console);
  } else {
    return function() {};
  }
})();

export { error, warn, info, log, debug };
