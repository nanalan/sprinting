(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("pBGvAp"))
},{"pBGvAp":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
(function (process,global){
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  function setupGlobals(global) {
    global.Reflect = global.Reflect || {};
    global.Reflect.global = global.Reflect.global || global;
  }
  setupGlobals(global);
  var typeOf = function(x) {
    return typeof x;
  };
  global.$traceurRuntime = {
    options: {},
    setupGlobals: setupGlobals,
    typeof: typeOf
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
  'use strict';
  var $__3 = $traceurRuntime,
      canonicalizeUrl = $__3.canonicalizeUrl,
      resolveUrl = $__3.resolveUrl,
      isAbsolute = $__3.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  }
  function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  }
  ModuleEvaluationError.prototype = Object.create(Error.prototype);
  ModuleEvaluationError.prototype.constructor = ModuleEvaluationError;
  ModuleEvaluationError.prototype.stripError = function(message) {
    return message.replace(/.*Error:/, this.constructor.name + ':');
  };
  ModuleEvaluationError.prototype.stripCause = function(cause) {
    if (!cause)
      return '';
    if (!cause.message)
      return cause + '';
    return this.stripError(cause.message);
  };
  ModuleEvaluationError.prototype.loadedBy = function(moduleName) {
    this.stack += '\n loaded by ' + moduleName;
  };
  ModuleEvaluationError.prototype.stripStack = function(causeStack) {
    var stack = [];
    causeStack.split('\n').some(function(frame) {
      if (/UncoatedModuleInstantiator/.test(frame))
        return true;
      stack.push(frame);
    });
    stack[0] = this.stripError(stack[0]);
    return stack.join('\n');
  };
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  function UncoatedModuleInstantiator(url, func) {
    UncoatedModuleEntry.call(this, url, null);
    this.func = func;
  }
  UncoatedModuleInstantiator.prototype = Object.create(UncoatedModuleEntry.prototype);
  UncoatedModuleInstantiator.prototype.getUncoatedModule = function() {
    var $__2 = this;
    if (this.value_)
      return this.value_;
    try {
      var relativeRequire;
      if (typeof $traceurRuntime !== undefined && $traceurRuntime.require) {
        relativeRequire = $traceurRuntime.require.bind(null, this.url);
      }
      return this.value_ = this.func.call(global, relativeRequire);
    } catch (ex) {
      if (ex instanceof ModuleEvaluationError) {
        ex.loadedBy(this.url);
        throw ex;
      }
      if (ex.stack) {
        var lines = this.func.toString().split('\n');
        var evaled = [];
        ex.stack.split('\n').some(function(frame, index) {
          if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
            return true;
          var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
          if (m) {
            var line = parseInt(m[2], 10);
            evaled = evaled.concat(beforeLines(lines, line));
            if (index === 1) {
              evaled.push(columnSpacing(m[3]) + '^ ' + $__2.url);
            } else {
              evaled.push(columnSpacing(m[3]) + '^');
            }
            evaled = evaled.concat(afterLines(lines, line));
            evaled.push('= = = = = = = = =');
          } else {
            evaled.push(frame);
          }
        });
        ex.stack = evaled.join('\n');
      }
      throw new ModuleEvaluationError(this.url, ex);
    }
  };
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach(function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    });
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, function() {
        return module;
      });
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__2 = arguments;
            var depMap = {};
            deps.forEach(function(dep, index) {
              return depMap[dep] = $__2[index];
            });
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func(), liveModuleSentinel);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  $traceurRuntime.registerModule = ModuleStore.registerModule.bind(ModuleStore);
  $traceurRuntime.getModule = ModuleStore.get;
  $traceurRuntime.setModule = ModuleStore.set;
  $traceurRuntime.normalizeModuleName = ModuleStore.normalize;
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/new-unique-string.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/new-unique-string.js";
  var random = Math.random;
  var counter = Date.now() % 1e9;
  function newUniqueString() {
    return '__$' + (random() * 1e9 >>> 1) + '$' + ++counter + '$__';
  }
  return {get default() {
      return newUniqueString;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/has-native-symbols.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/has-native-symbols.js";
  var v = !!Object.getOwnPropertySymbols && typeof Symbol === 'function';
  function hasNativeSymbol() {
    return v;
  }
  return {get default() {
      return hasNativeSymbol;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/symbols.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/symbols.js";
  var newUniqueString = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../new-unique-string.js", "traceur-runtime@0.0.111/src/runtime/modules/symbols.js")).default;
  var hasNativeSymbol = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../has-native-symbols.js", "traceur-runtime@0.0.111/src/runtime/modules/symbols.js")).default;
  var $create = Object.create;
  var $defineProperty = Object.defineProperty;
  var $freeze = Object.freeze;
  var $getOwnPropertyNames = Object.getOwnPropertyNames;
  var $keys = Object.keys;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var symbolInternalProperty = newUniqueString();
  var symbolDescriptionProperty = newUniqueString();
  var symbolDataProperty = newUniqueString();
  var symbolValues = $create(null);
  var SymbolImpl = function Symbol(description) {
    var value = new SymbolValue(description);
    if (!(this instanceof SymbolImpl))
      return value;
    throw new $TypeError('Symbol cannot be new\'ed');
  };
  $defineProperty(SymbolImpl.prototype, 'constructor', nonEnum(SymbolImpl));
  $defineProperty(SymbolImpl.prototype, 'toString', nonEnum(function() {
    var symbolValue = this[symbolDataProperty];
    return symbolValue[symbolInternalProperty];
  }));
  $defineProperty(SymbolImpl.prototype, 'valueOf', nonEnum(function() {
    var symbolValue = this[symbolDataProperty];
    if (!symbolValue)
      throw $TypeError('Conversion from symbol to string');
    return symbolValue[symbolInternalProperty];
  }));
  function SymbolValue(description) {
    var key = newUniqueString();
    $defineProperty(this, symbolDataProperty, {value: this});
    $defineProperty(this, symbolInternalProperty, {value: key});
    $defineProperty(this, symbolDescriptionProperty, {value: description});
    $freeze(this);
    symbolValues[key] = this;
  }
  $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(SymbolImpl));
  $defineProperty(SymbolValue.prototype, 'toString', {
    value: SymbolImpl.prototype.toString,
    enumerable: false
  });
  $defineProperty(SymbolValue.prototype, 'valueOf', {
    value: SymbolImpl.prototype.valueOf,
    enumerable: false
  });
  $freeze(SymbolValue.prototype);
  function isSymbolString(s) {
    return symbolValues[s];
  }
  function removeSymbolKeys(array) {
    var rv = [];
    for (var i = 0; i < array.length; i++) {
      if (!isSymbolString(array[i])) {
        rv.push(array[i]);
      }
    }
    return rv;
  }
  function getOwnPropertyNames(object) {
    return removeSymbolKeys($getOwnPropertyNames(object));
  }
  function keys(object) {
    return removeSymbolKeys($keys(object));
  }
  function getOwnPropertySymbols(object) {
    var rv = [];
    var names = $getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var symbol = symbolValues[names[i]];
      if (symbol) {
        rv.push(symbol);
      }
    }
    return rv;
  }
  function polyfillSymbol(global) {
    var Object = global.Object;
    if (!hasNativeSymbol()) {
      global.Symbol = SymbolImpl;
      Object.getOwnPropertyNames = getOwnPropertyNames;
      Object.keys = keys;
      $defineProperty(Object, 'getOwnPropertySymbols', nonEnum(getOwnPropertySymbols));
    }
    if (!global.Symbol.iterator) {
      global.Symbol.iterator = global.Symbol('Symbol.iterator');
    }
    if (!global.Symbol.observer) {
      global.Symbol.observer = global.Symbol('Symbol.observer');
    }
  }
  var g = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : (void 0);
  polyfillSymbol(g);
  var typeOf = hasNativeSymbol() ? function(x) {
    return typeof x;
  } : function(x) {
    return x instanceof SymbolValue ? 'symbol' : typeof x;
  };
  return {get typeof() {
      return typeOf;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/typeof.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/typeof.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_symbols_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./symbols.js", "traceur-runtime@0.0.111/src/runtime/modules/typeof.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_symbols_46_js__.typeof;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/symbols.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/symbols.js";
  var t = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/typeof.js", "traceur-runtime@0.0.111/src/runtime/symbols.js")).default;
  $traceurRuntime.typeof = t;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/createClass.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/createClass.js";
  var $Object = Object;
  var $TypeError = TypeError;
  var $__1 = Object,
      create = $__1.create,
      defineProperties = $__1.defineProperties,
      defineProperty = $__1.defineProperty,
      getOwnPropertyDescriptor = $__1.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      getOwnPropertySymbols = $__1.getOwnPropertySymbols;
  function forEachPropertyKey(object, f) {
    getOwnPropertyNames(object).forEach(f);
    if (getOwnPropertySymbols) {
      getOwnPropertySymbols(object).forEach(f);
    }
  }
  function getDescriptors(object) {
    var descriptors = {};
    forEachPropertyKey(object, function(key) {
      descriptors[key] = getOwnPropertyDescriptor(object, key);
      descriptors[key].enumerable = false;
    });
    return descriptors;
  }
  var nonEnum = {enumerable: false};
  function makePropertiesNonEnumerable(object) {
    forEachPropertyKey(object, function(key) {
      defineProperty(object, key, nonEnum);
    });
  }
  function createClass(ctor, object, staticObject, superClass) {
    defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = create(getProtoParent(superClass), getDescriptors(object));
    } else {
      makePropertiesNonEnumerable(object);
      ctor.prototype = object;
    }
    defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  return {get default() {
      return createClass;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/superConstructor.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/superConstructor.js";
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  return {get default() {
      return superConstructor;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/superDescriptor.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/superDescriptor.js";
  var $__0 = Object,
      getOwnPropertyDescriptor = $__0.getOwnPropertyDescriptor,
      getPrototypeOf = $__0.getPrototypeOf;
  function superDescriptor(homeObject, name) {
    var proto = getPrototypeOf(homeObject);
    do {
      var result = getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  return {get default() {
      return superDescriptor;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/superGet.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/superGet.js";
  var superDescriptor = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./superDescriptor.js", "traceur-runtime@0.0.111/src/runtime/modules/superGet.js")).default;
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      var value = descriptor.value;
      if (value)
        return value;
      if (!descriptor.get)
        return value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  return {get default() {
      return superGet;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/superSet.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/superSet.js";
  var superDescriptor = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./superDescriptor.js", "traceur-runtime@0.0.111/src/runtime/modules/superSet.js")).default;
  var $TypeError = TypeError;
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  return {get default() {
      return superSet;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/classes.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/classes.js";
  var createClass = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/createClass.js", "traceur-runtime@0.0.111/src/runtime/classes.js")).default;
  var superConstructor = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/superConstructor.js", "traceur-runtime@0.0.111/src/runtime/classes.js")).default;
  var superGet = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/superGet.js", "traceur-runtime@0.0.111/src/runtime/classes.js")).default;
  var superSet = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/superSet.js", "traceur-runtime@0.0.111/src/runtime/classes.js")).default;
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/exportStar.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/exportStar.js";
  var $__1 = Object,
      defineProperty = $__1.defineProperty,
      getOwnPropertyNames = $__1.getOwnPropertyNames;
  function exportStar(object) {
    var $__2 = arguments,
        $__3 = function(i) {
          var mod = $__2[i];
          var names = getOwnPropertyNames(mod);
          var $__5 = function(j) {
            var name = names[j];
            if (name === '__esModule' || name === 'default') {
              return 0;
            }
            defineProperty(object, name, {
              get: function() {
                return mod[name];
              },
              enumerable: true
            });
          },
              $__6;
          $__4: for (var j = 0; j < names.length; j++) {
            $__6 = $__5(j);
            switch ($__6) {
              case 0:
                continue $__4;
            }
          }
        };
    for (var i = 1; i < arguments.length; i++) {
      $__3(i);
    }
    return object;
  }
  return {get default() {
      return exportStar;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/exportStar.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/exportStar.js";
  var exportStar = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/exportStar.js", "traceur-runtime@0.0.111/src/runtime/exportStar.js")).default;
  $traceurRuntime.exportStar = exportStar;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/private-symbol.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/private-symbol.js";
  var newUniqueString = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./new-unique-string.js", "traceur-runtime@0.0.111/src/runtime/private-symbol.js")).default;
  var $Symbol = typeof Symbol === 'function' ? Symbol : undefined;
  var $getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var $create = Object.create;
  var privateNames = $create(null);
  function isPrivateSymbol(s) {
    return privateNames[s];
  }
  ;
  function createPrivateSymbol() {
    var s = ($Symbol || newUniqueString)();
    privateNames[s] = true;
    return s;
  }
  ;
  function hasPrivate(obj, sym) {
    return hasOwnProperty.call(obj, sym);
  }
  ;
  function deletePrivate(obj, sym) {
    if (!hasPrivate(obj, sym)) {
      return false;
    }
    delete obj[sym];
    return true;
  }
  ;
  function setPrivate(obj, sym, val) {
    obj[sym] = val;
  }
  ;
  function getPrivate(obj, sym) {
    var val = obj[sym];
    if (val === undefined)
      return undefined;
    return hasOwnProperty.call(obj, sym) ? val : undefined;
  }
  ;
  function init() {
    if ($getOwnPropertySymbols) {
      Object.getOwnPropertySymbols = function getOwnPropertySymbols(object) {
        var rv = [];
        var symbols = $getOwnPropertySymbols(object);
        for (var i = 0; i < symbols.length; i++) {
          var symbol = symbols[i];
          if (!isPrivateSymbol(symbol)) {
            rv.push(symbol);
          }
        }
        return rv;
      };
    }
  }
  return {
    get isPrivateSymbol() {
      return isPrivateSymbol;
    },
    get createPrivateSymbol() {
      return createPrivateSymbol;
    },
    get hasPrivate() {
      return hasPrivate;
    },
    get deletePrivate() {
      return deletePrivate;
    },
    get setPrivate() {
      return setPrivate;
    },
    get getPrivate() {
      return getPrivate;
    },
    get init() {
      return init;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/private-weak-map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/private-weak-map.js";
  var $WeakMap = typeof WeakMap === 'function' ? WeakMap : undefined;
  function isPrivateSymbol(s) {
    return false;
  }
  function createPrivateSymbol() {
    return new $WeakMap();
  }
  function hasPrivate(obj, sym) {
    return sym.has(obj);
  }
  function deletePrivate(obj, sym) {
    return sym.delete(obj);
  }
  function setPrivate(obj, sym, val) {
    sym.set(obj, val);
  }
  function getPrivate(obj, sym) {
    return sym.get(obj);
  }
  function init() {}
  return {
    get isPrivateSymbol() {
      return isPrivateSymbol;
    },
    get createPrivateSymbol() {
      return createPrivateSymbol;
    },
    get hasPrivate() {
      return hasPrivate;
    },
    get deletePrivate() {
      return deletePrivate;
    },
    get setPrivate() {
      return setPrivate;
    },
    get getPrivate() {
      return getPrivate;
    },
    get init() {
      return init;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/private.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/private.js";
  var sym = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./private-symbol.js", "traceur-runtime@0.0.111/src/runtime/private.js"));
  var weak = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./private-weak-map.js", "traceur-runtime@0.0.111/src/runtime/private.js"));
  var hasWeakMap = typeof WeakMap === 'function';
  var m = hasWeakMap ? weak : sym;
  var isPrivateSymbol = m.isPrivateSymbol;
  var createPrivateSymbol = m.createPrivateSymbol;
  var hasPrivate = m.hasPrivate;
  var deletePrivate = m.deletePrivate;
  var setPrivate = m.setPrivate;
  var getPrivate = m.getPrivate;
  m.init();
  return {
    get isPrivateSymbol() {
      return isPrivateSymbol;
    },
    get createPrivateSymbol() {
      return createPrivateSymbol;
    },
    get hasPrivate() {
      return hasPrivate;
    },
    get deletePrivate() {
      return deletePrivate;
    },
    get setPrivate() {
      return setPrivate;
    },
    get getPrivate() {
      return getPrivate;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/properTailCalls.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/properTailCalls.js";
  var $__0 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/modules/properTailCalls.js")),
      getPrivate = $__0.getPrivate,
      setPrivate = $__0.setPrivate,
      createPrivateSymbol = $__0.createPrivateSymbol;
  var $apply = Function.prototype.call.bind(Function.prototype.apply);
  var CONTINUATION_TYPE = Object.create(null);
  var isTailRecursiveName = null;
  function createContinuation(operand, thisArg, argsArray) {
    return [CONTINUATION_TYPE, operand, thisArg, argsArray];
  }
  function isContinuation(object) {
    return object && object[0] === CONTINUATION_TYPE;
  }
  function $bind(operand, thisArg, args) {
    var argArray = [thisArg];
    for (var i = 0; i < args.length; i++) {
      argArray[i + 1] = args[i];
    }
    var func = $apply(Function.prototype.bind, operand, argArray);
    return func;
  }
  function $construct(func, argArray) {
    var object = new ($bind(func, null, argArray));
    return object;
  }
  function isTailRecursive(func) {
    return !!getPrivate(func, isTailRecursiveName);
  }
  function tailCall(func, thisArg, argArray) {
    var continuation = argArray[0];
    if (isContinuation(continuation)) {
      continuation = $apply(func, thisArg, continuation[3]);
      return continuation;
    }
    continuation = createContinuation(func, thisArg, argArray);
    while (true) {
      if (isTailRecursive(func)) {
        continuation = $apply(func, continuation[2], [continuation]);
      } else {
        continuation = $apply(func, continuation[2], continuation[3]);
      }
      if (!isContinuation(continuation)) {
        return continuation;
      }
      func = continuation[1];
    }
  }
  function construct() {
    var object;
    if (isTailRecursive(this)) {
      object = $construct(this, [createContinuation(null, null, arguments)]);
    } else {
      object = $construct(this, arguments);
    }
    return object;
  }
  function setupProperTailCalls() {
    isTailRecursiveName = createPrivateSymbol();
    Function.prototype.call = initTailRecursiveFunction(function call(thisArg) {
      var result = tailCall(function(thisArg) {
        var argArray = [];
        for (var i = 1; i < arguments.length; ++i) {
          argArray[i - 1] = arguments[i];
        }
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
    Function.prototype.apply = initTailRecursiveFunction(function apply(thisArg, argArray) {
      var result = tailCall(function(thisArg, argArray) {
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
  }
  function initTailRecursiveFunction(func) {
    if (isTailRecursiveName === null) {
      setupProperTailCalls();
    }
    setPrivate(func, isTailRecursiveName, true);
    return func;
  }
  return {
    get createContinuation() {
      return createContinuation;
    },
    get tailCall() {
      return tailCall;
    },
    get construct() {
      return construct;
    },
    get initTailRecursiveFunction() {
      return initTailRecursiveFunction;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/initTailRecursiveFunction.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/initTailRecursiveFunction.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./properTailCalls.js", "traceur-runtime@0.0.111/src/runtime/modules/initTailRecursiveFunction.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__.initTailRecursiveFunction;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/call.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/call.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./properTailCalls.js", "traceur-runtime@0.0.111/src/runtime/modules/call.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__.tailCall;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/continuation.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/continuation.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./properTailCalls.js", "traceur-runtime@0.0.111/src/runtime/modules/continuation.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__.createContinuation;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/construct.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/construct.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./properTailCalls.js", "traceur-runtime@0.0.111/src/runtime/modules/construct.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_properTailCalls_46_js__.construct;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/properTailCalls.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/properTailCalls.js";
  var initTailRecursiveFunction = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/initTailRecursiveFunction.js", "traceur-runtime@0.0.111/src/runtime/properTailCalls.js")).default;
  var call = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/call.js", "traceur-runtime@0.0.111/src/runtime/properTailCalls.js")).default;
  var continuation = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/continuation.js", "traceur-runtime@0.0.111/src/runtime/properTailCalls.js")).default;
  var construct = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/construct.js", "traceur-runtime@0.0.111/src/runtime/properTailCalls.js")).default;
  $traceurRuntime.initTailRecursiveFunction = initTailRecursiveFunction;
  $traceurRuntime.call = call;
  $traceurRuntime.continuation = continuation;
  $traceurRuntime.construct = construct;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/relativeRequire.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/relativeRequire.js";
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/checkObjectCoercible.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/checkObjectCoercible.js";
  var $TypeError = TypeError;
  function checkObjectCoercible(v) {
    if (v === null || v === undefined) {
      throw new $TypeError('Value cannot be converted to an Object');
    }
    return v;
  }
  return {get default() {
      return checkObjectCoercible;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/spread.js";
  var checkObjectCoercible = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../checkObjectCoercible.js", "traceur-runtime@0.0.111/src/runtime/modules/spread.js")).default;
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[Symbol.iterator] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[Symbol.iterator]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  return {get default() {
      return spread;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/spread.js";
  var spread = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/spread.js", "traceur-runtime@0.0.111/src/runtime/spread.js")).default;
  $traceurRuntime.spread = spread;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/iteratorToArray.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/iteratorToArray.js";
  function iteratorToArray(iter) {
    var rv = [];
    var i = 0;
    var tmp;
    while (!(tmp = iter.next()).done) {
      rv[i++] = tmp.value;
    }
    return rv;
  }
  return {get default() {
      return iteratorToArray;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/destructuring.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/destructuring.js";
  var iteratorToArray = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/iteratorToArray.js", "traceur-runtime@0.0.111/src/runtime/destructuring.js")).default;
  $traceurRuntime.iteratorToArray = iteratorToArray;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/async.js";
  var $__12 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/modules/async.js")),
      createPrivateSymbol = $__12.createPrivateSymbol,
      getPrivate = $__12.getPrivate,
      setPrivate = $__12.setPrivate;
  var $__11 = Object,
      create = $__11.create,
      defineProperty = $__11.defineProperty;
  var observeName = createPrivateSymbol();
  function AsyncGeneratorFunction() {}
  function AsyncGeneratorFunctionPrototype() {}
  AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
  AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
  defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
  var AsyncGeneratorContext = function() {
    function AsyncGeneratorContext(observer) {
      var $__2 = this;
      this.decoratedObserver = createDecoratedGenerator(observer, function() {
        $__2.done = true;
      });
      this.done = false;
      this.inReturn = false;
    }
    return ($traceurRuntime.createClass)(AsyncGeneratorContext, {
      throw: function(error) {
        if (!this.inReturn) {
          throw error;
        }
      },
      yield: function(value) {
        if (this.done) {
          this.inReturn = true;
          throw undefined;
        }
        var result;
        try {
          result = this.decoratedObserver.next(value);
        } catch (e) {
          this.done = true;
          throw e;
        }
        if (result === undefined) {
          return;
        }
        if (result.done) {
          this.done = true;
          this.inReturn = true;
          throw undefined;
        }
        return result.value;
      },
      yieldFor: function(observable) {
        var ctx = this;
        return observeForEach(observable[Symbol.observer].bind(observable), function(value) {
          if (ctx.done) {
            this.return();
            return;
          }
          var result;
          try {
            result = ctx.decoratedObserver.next(value);
          } catch (e) {
            ctx.done = true;
            throw e;
          }
          if (result === undefined) {
            return;
          }
          if (result.done) {
            ctx.done = true;
          }
          return result;
        });
      }
    }, {});
  }();
  AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
    var observe = getPrivate(this, observeName);
    var ctx = new AsyncGeneratorContext(observer);
    schedule(function() {
      return observe(ctx);
    }).then(function(value) {
      if (!ctx.done) {
        ctx.decoratedObserver.return(value);
      }
    }).catch(function(error) {
      if (!ctx.done) {
        ctx.decoratedObserver.throw(error);
      }
    });
    return ctx.decoratedObserver;
  };
  defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
  function initAsyncGeneratorFunction(functionObject) {
    functionObject.prototype = create(AsyncGeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
    return functionObject;
  }
  function createAsyncGeneratorInstance(observe, functionObject) {
    for (var args = [],
        $__10 = 2; $__10 < arguments.length; $__10++)
      args[$__10 - 2] = arguments[$__10];
    var object = create(functionObject.prototype);
    setPrivate(object, observeName, observe);
    return object;
  }
  function observeForEach(observe, next) {
    return new Promise(function(resolve, reject) {
      var generator = observe({
        next: function(value) {
          return next.call(generator, value);
        },
        throw: function(error) {
          reject(error);
        },
        return: function(value) {
          resolve(value);
        }
      });
    });
  }
  function schedule(asyncF) {
    return Promise.resolve().then(asyncF);
  }
  var generator = Symbol();
  var onDone = Symbol();
  var DecoratedGenerator = function() {
    function DecoratedGenerator(_generator, _onDone) {
      this[generator] = _generator;
      this[onDone] = _onDone;
    }
    return ($traceurRuntime.createClass)(DecoratedGenerator, {
      next: function(value) {
        var result = this[generator].next(value);
        if (result !== undefined && result.done) {
          this[onDone].call(this);
        }
        return result;
      },
      throw: function(error) {
        this[onDone].call(this);
        return this[generator].throw(error);
      },
      return: function(value) {
        this[onDone].call(this);
        return this[generator].return(value);
      }
    }, {});
  }();
  function createDecoratedGenerator(generator, onDone) {
    return new DecoratedGenerator(generator, onDone);
  }
  Array.prototype[Symbol.observer] = function(observer) {
    var done = false;
    var decoratedObserver = createDecoratedGenerator(observer, function() {
      return done = true;
    });
    var $__6 = true;
    var $__7 = false;
    var $__8 = undefined;
    try {
      for (var $__4 = void 0,
          $__3 = (this)[Symbol.iterator](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
        var value = $__4.value;
        {
          decoratedObserver.next(value);
          if (done) {
            return;
          }
        }
      }
    } catch ($__9) {
      $__7 = true;
      $__8 = $__9;
    } finally {
      try {
        if (!$__6 && $__3.return != null) {
          $__3.return();
        }
      } finally {
        if ($__7) {
          throw $__8;
        }
      }
    }
    decoratedObserver.return();
    return decoratedObserver;
  };
  defineProperty(Array.prototype, Symbol.observer, {enumerable: false});
  return {
    get initAsyncGeneratorFunction() {
      return initAsyncGeneratorFunction;
    },
    get createAsyncGeneratorInstance() {
      return createAsyncGeneratorInstance;
    },
    get observeForEach() {
      return observeForEach;
    },
    get schedule() {
      return schedule;
    },
    get createDecoratedGenerator() {
      return createDecoratedGenerator;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/initAsyncGeneratorFunction.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/initAsyncGeneratorFunction.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/modules/initAsyncGeneratorFunction.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__.initAsyncGeneratorFunction;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/createAsyncGeneratorInstance.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/createAsyncGeneratorInstance.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/modules/createAsyncGeneratorInstance.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__.createAsyncGeneratorInstance;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/observeForEach.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/observeForEach.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/modules/observeForEach.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__.observeForEach;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/schedule.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/schedule.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/modules/schedule.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__.schedule;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/createDecoratedGenerator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/createDecoratedGenerator.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/modules/createDecoratedGenerator.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_async_46_js__.createDecoratedGenerator;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/async.js";
  var initAsyncGeneratorFunction = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/initAsyncGeneratorFunction.js", "traceur-runtime@0.0.111/src/runtime/async.js")).default;
  var createAsyncGeneratorInstance = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/createAsyncGeneratorInstance.js", "traceur-runtime@0.0.111/src/runtime/async.js")).default;
  var observeForEach = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/observeForEach.js", "traceur-runtime@0.0.111/src/runtime/async.js")).default;
  var schedule = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/schedule.js", "traceur-runtime@0.0.111/src/runtime/async.js")).default;
  var createDecoratedGenerator = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/createDecoratedGenerator.js", "traceur-runtime@0.0.111/src/runtime/async.js")).default;
  $traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
  $traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
  $traceurRuntime.observeForEach = observeForEach;
  $traceurRuntime.schedule = schedule;
  $traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/generators.js";
  var $__2 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/modules/generators.js")),
      createPrivateSymbol = $__2.createPrivateSymbol,
      getPrivate = $__2.getPrivate,
      setPrivate = $__2.setPrivate;
  var $TypeError = TypeError;
  var $__1 = Object,
      create = $__1.create,
      defineProperties = $__1.defineProperties,
      defineProperty = $__1.defineProperty;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  var RETURN_SENTINEL = {};
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.oldReturnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    maybeUncatchable: function() {
      if (this.storedException === RETURN_SENTINEL) {
        throw RETURN_SENTINEL;
      }
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    },
    wrapYieldStar: function(iterator) {
      var ctx = this;
      return {
        next: function(v) {
          return iterator.next(v);
        },
        throw: function(e) {
          var result;
          if (e === RETURN_SENTINEL) {
            if (iterator.return) {
              result = iterator.return(ctx.returnValue);
              if (!result.done) {
                ctx.returnValue = ctx.oldReturnValue;
                return result;
              }
              ctx.returnValue = result.value;
            }
            throw e;
          }
          if (iterator.throw) {
            return iterator.throw(e);
          }
          iterator.return && iterator.return();
          throw $TypeError('Inner iterator does not have a throw method');
        }
      };
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        if (x === RETURN_SENTINEL) {
          return {
            value: ctx.returnValue,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          if (x === RETURN_SENTINEL) {
            return {
              value: ctx.returnValue,
              done: true
            };
          }
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value;
        try {
          value = moveNext(ctx);
        } catch (ex) {
          if (ex === RETURN_SENTINEL) {
            value = ctx;
          } else {
            throw ex;
          }
        }
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateSymbol();
  var moveNextName = createPrivateSymbol();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(getPrivate(this, ctxName), getPrivate(this, moveNextName), 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(getPrivate(this, ctxName), getPrivate(this, moveNextName), 'throw', v);
    },
    return: function(v) {
      var ctx = getPrivate(this, ctxName);
      ctx.oldReturnValue = ctx.returnValue;
      ctx.returnValue = v;
      return nextOrThrow(ctx, getPrivate(this, moveNextName), 'throw', RETURN_SENTINEL);
    }
  };
  defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false},
    return: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = create(functionObject.prototype);
    setPrivate(object, ctxName, ctx);
    setPrivate(object, moveNextName, moveNext);
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  return {
    get createGeneratorInstance() {
      return createGeneratorInstance;
    },
    get initGeneratorFunction() {
      return initGeneratorFunction;
    },
    get asyncWrap() {
      return asyncWrap;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/asyncWrap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/asyncWrap.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./generators.js", "traceur-runtime@0.0.111/src/runtime/modules/asyncWrap.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__.asyncWrap;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/initGeneratorFunction.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/initGeneratorFunction.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./generators.js", "traceur-runtime@0.0.111/src/runtime/modules/initGeneratorFunction.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__.initGeneratorFunction;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/createGeneratorInstance.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/createGeneratorInstance.js";
  var $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__ = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./generators.js", "traceur-runtime@0.0.111/src/runtime/modules/createGeneratorInstance.js"));
  return {get default() {
      return $__traceur_45_runtime_64_0_46_0_46_111_47_src_47_runtime_47_modules_47_generators_46_js__.createGeneratorInstance;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/generators.js";
  var asyncWrap = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/asyncWrap.js", "traceur-runtime@0.0.111/src/runtime/generators.js")).default;
  var initGeneratorFunction = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/initGeneratorFunction.js", "traceur-runtime@0.0.111/src/runtime/generators.js")).default;
  var createGeneratorInstance = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/createGeneratorInstance.js", "traceur-runtime@0.0.111/src/runtime/generators.js")).default;
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/spawn.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/spawn.js";
  function spawn(self, args, gen) {
    return new Promise(function(resolve, reject) {
      function fulfill(v) {
        try {
          step(gen.next(v));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(v) {
        try {
          step(gen.throw(v));
        } catch (e) {
          reject(e);
        }
      }
      function step(res) {
        if (res.done) {
          resolve(res.value);
        } else {
          Promise.resolve(res.value).then(fulfill, rejected);
        }
      }
      step((gen = gen.apply(self, args)).next());
    });
  }
  return {get default() {
      return spawn;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/spawn.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/spawn.js";
  var spawn = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/spawn.js", "traceur-runtime@0.0.111/src/runtime/spawn.js")).default;
  $traceurRuntime.spawn = spawn;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/getTemplateObject.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/getTemplateObject.js";
  var $__1 = Object,
      defineProperty = $__1.defineProperty,
      freeze = $__1.freeze;
  var slice = Array.prototype.slice;
  var map = Object.create(null);
  function getTemplateObject(raw) {
    var cooked = arguments[1];
    var key = raw.join('${}');
    var templateObject = map[key];
    if (templateObject)
      return templateObject;
    if (!cooked) {
      cooked = slice.call(raw);
    }
    return map[key] = freeze(defineProperty(cooked, 'raw', {value: freeze(raw)}));
  }
  return {get default() {
      return getTemplateObject;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/template.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/template.js";
  var getTemplateObject = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/getTemplateObject.js", "traceur-runtime@0.0.111/src/runtime/template.js")).default;
  $traceurRuntime.getTemplateObject = getTemplateObject;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/modules/spreadProperties.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/modules/spreadProperties.js";
  var $__1 = Object,
      defineProperty = $__1.defineProperty,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      getOwnPropertySymbols = $__1.getOwnPropertySymbols,
      propertyIsEnumerable = $__1.propertyIsEnumerable;
  function createDataProperty(o, p, v) {
    defineProperty(o, p, {
      configurable: true,
      enumerable: true,
      value: v,
      writable: true
    });
  }
  function copyDataProperties(target, source) {
    if (source == null) {
      return;
    }
    var copy = function(keys) {
      for (var i = 0; i < keys.length; i++) {
        var nextKey = keys[i];
        if (propertyIsEnumerable.call(source, nextKey)) {
          var propValue = source[nextKey];
          createDataProperty(target, nextKey, propValue);
        }
      }
    };
    copy(getOwnPropertyNames(source));
    copy(getOwnPropertySymbols(source));
  }
  var $__default = function() {
    var target = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      copyDataProperties(target, arguments[i]);
    }
    return target;
  };
  return {get default() {
      return $__default;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/jsx.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/jsx.js";
  var spreadProperties = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./modules/spreadProperties.js", "traceur-runtime@0.0.111/src/runtime/jsx.js")).default;
  $traceurRuntime.spreadProperties = spreadProperties;
  return {};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/runtime-modules.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/runtime-modules.js";
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./symbols.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./classes.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./exportStar.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./properTailCalls.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./relativeRequire.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./spread.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./destructuring.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./async.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./generators.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./spawn.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./template.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./jsx.js", "traceur-runtime@0.0.111/src/runtime/runtime-modules.js"));
  return {};
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/runtime-modules.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/frozen-data.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/frozen-data.js";
  function findIndex(arr, key) {
    for (var i = 0; i < arr.length; i += 2) {
      if (arr[i] === key) {
        return i;
      }
    }
    return -1;
  }
  function setFrozen(arr, key, val) {
    var i = findIndex(arr, key);
    if (i === -1) {
      arr.push(key, val);
    }
  }
  function getFrozen(arr, key) {
    var i = findIndex(arr, key);
    if (i !== -1) {
      return arr[i + 1];
    }
    return undefined;
  }
  function hasFrozen(arr, key) {
    return findIndex(arr, key) !== -1;
  }
  function deleteFrozen(arr, key) {
    var i = findIndex(arr, key);
    if (i !== -1) {
      arr.splice(i, 2);
      return true;
    }
    return false;
  }
  return {
    get setFrozen() {
      return setFrozen;
    },
    get getFrozen() {
      return getFrozen;
    },
    get hasFrozen() {
      return hasFrozen;
    },
    get deleteFrozen() {
      return deleteFrozen;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var $TypeError = TypeError;
  var $Object = Object;
  function toObject(x) {
    if (x == null) {
      throw $TypeError();
    }
    return $Object(x);
  }
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach(function(f) {
      return f(global);
    });
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Map.js";
  var $__16 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Map.js")),
      createPrivateSymbol = $__16.createPrivateSymbol,
      getPrivate = $__16.getPrivate,
      setPrivate = $__16.setPrivate;
  var $__17 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../frozen-data.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Map.js")),
      deleteFrozen = $__17.deleteFrozen,
      getFrozen = $__17.getFrozen,
      setFrozen = $__17.setFrozen;
  var $__18 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Map.js")),
      isObject = $__18.isObject,
      registerPolyfill = $__18.registerPolyfill;
  var hasNativeSymbol = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../has-native-symbols.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Map.js")).default;
  var $__9 = Object,
      defineProperty = $__9.defineProperty,
      getOwnPropertyDescriptor = $__9.getOwnPropertyDescriptor,
      hasOwnProperty = $__9.hasOwnProperty,
      isExtensible = $__9.isExtensible;
  var deletedSentinel = {};
  var counter = 1;
  var hashCodeName = createPrivateSymbol();
  function getHashCodeForObject(obj) {
    return getPrivate(obj, hashCodeName);
  }
  function getOrSetHashCodeForObject(obj) {
    var hash = getHashCodeForObject(obj);
    if (!hash) {
      hash = counter++;
      setPrivate(obj, hashCodeName, hash);
    }
    return hash;
  }
  function lookupIndex(map, key) {
    if (typeof key === 'string') {
      return map.stringIndex_[key];
    }
    if (isObject(key)) {
      if (!isExtensible(key)) {
        return getFrozen(map.frozenData_, key);
      }
      var hc = getHashCodeForObject(key);
      if (hc === undefined) {
        return undefined;
      }
      return map.objectIndex_[hc];
    }
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.frozenData_ = [];
    map.deletedCount_ = 0;
  }
  var Map = function() {
    function Map() {
      var $__11,
          $__12;
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Map called on incompatible type');
      if (hasOwnProperty.call(this, 'entries_')) {
        throw new TypeError('Map can not be reentrantly initialised');
      }
      initMap(this);
      if (iterable !== null && iterable !== undefined) {
        var $__5 = true;
        var $__6 = false;
        var $__7 = undefined;
        try {
          for (var $__3 = void 0,
              $__2 = (iterable)[Symbol.iterator](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
            var $__10 = $__3.value,
                key = ($__11 = $__10[Symbol.iterator](), ($__12 = $__11.next()).done ? void 0 : $__12.value),
                value = ($__12 = $__11.next()).done ? void 0 : $__12.value;
            {
              this.set(key, value);
            }
          }
        } catch ($__8) {
          $__6 = true;
          $__7 = $__8;
        } finally {
          try {
            if (!$__5 && $__2.return != null) {
              $__2.return();
            }
          } finally {
            if ($__6) {
              throw $__7;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Map, {
      get size() {
        return this.entries_.length / 2 - this.deletedCount_;
      },
      get: function(key) {
        var index = lookupIndex(this, key);
        if (index !== undefined) {
          return this.entries_[index + 1];
        }
      },
      set: function(key, value) {
        var index = lookupIndex(this, key);
        if (index !== undefined) {
          this.entries_[index + 1] = value;
        } else {
          index = this.entries_.length;
          this.entries_[index] = key;
          this.entries_[index + 1] = value;
          if (isObject(key)) {
            if (!isExtensible(key)) {
              setFrozen(this.frozenData_, key, index);
            } else {
              var hash = getOrSetHashCodeForObject(key);
              this.objectIndex_[hash] = index;
            }
          } else if (typeof key === 'string') {
            this.stringIndex_[key] = index;
          } else {
            this.primitiveIndex_[key] = index;
          }
        }
        return this;
      },
      has: function(key) {
        return lookupIndex(this, key) !== undefined;
      },
      delete: function(key) {
        var index = lookupIndex(this, key);
        if (index === undefined) {
          return false;
        }
        this.entries_[index] = deletedSentinel;
        this.entries_[index + 1] = undefined;
        this.deletedCount_++;
        if (isObject(key)) {
          if (!isExtensible(key)) {
            deleteFrozen(this.frozenData_, key);
          } else {
            var hash = getHashCodeForObject(key);
            delete this.objectIndex_[hash];
          }
        } else if (typeof key === 'string') {
          delete this.stringIndex_[key];
        } else {
          delete this.primitiveIndex_[key];
        }
        return true;
      },
      clear: function() {
        initMap(this);
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        for (var i = 0; i < this.entries_.length; i += 2) {
          var key = this.entries_[i];
          var value = this.entries_[i + 1];
          if (key === deletedSentinel)
            continue;
          callbackFn.call(thisArg, value, key, this);
        }
      },
      entries: $traceurRuntime.initGeneratorFunction(function $__13() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return [key, value];
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__13, this);
      }),
      keys: $traceurRuntime.initGeneratorFunction(function $__14() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return key;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__14, this);
      }),
      values: $traceurRuntime.initGeneratorFunction(function $__15() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return value;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function needsPolyfill(global) {
    var $__10 = global,
        Map = $__10.Map,
        Symbol = $__10.Symbol;
    if (!Map || !hasNativeSymbol() || !Map.prototype[Symbol.iterator] || !Map.prototype.entries) {
      return true;
    }
    try {
      return new Map([[]]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillMap(global) {
    if (needsPolyfill(global)) {
      global.Map = Map;
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Map.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Set.js";
  var $__18 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Set.js")),
      isObject = $__18.isObject,
      registerPolyfill = $__18.registerPolyfill;
  var Map = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./Map.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Set.js")).Map;
  var hasNativeSymbol = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../has-native-symbols.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Set.js")).default;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var Set = function() {
    function Set() {
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Set called on incompatible type');
      if (hasOwnProperty.call(this, 'map_')) {
        throw new TypeError('Set can not be reentrantly initialised');
      }
      this.map_ = new Map();
      if (iterable !== null && iterable !== undefined) {
        var $__6 = true;
        var $__7 = false;
        var $__8 = undefined;
        try {
          for (var $__4 = void 0,
              $__3 = (iterable)[Symbol.iterator](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
            var item = $__4.value;
            {
              this.add(item);
            }
          }
        } catch ($__9) {
          $__7 = true;
          $__8 = $__9;
        } finally {
          try {
            if (!$__6 && $__3.return != null) {
              $__3.return();
            }
          } finally {
            if ($__7) {
              throw $__8;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Set, {
      get size() {
        return this.map_.size;
      },
      has: function(key) {
        return this.map_.has(key);
      },
      add: function(key) {
        this.map_.set(key, key);
        return this;
      },
      delete: function(key) {
        return this.map_.delete(key);
      },
      clear: function() {
        return this.map_.clear();
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        var $__2 = this;
        return this.map_.forEach(function(value, key) {
          callbackFn.call(thisArg, key, key, $__2);
        });
      },
      values: $traceurRuntime.initGeneratorFunction(function $__12() {
        var $__13,
            $__14;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__13 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__14.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__14.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__14.value;
              default:
                return $ctx.end();
            }
        }, $__12, this);
      }),
      entries: $traceurRuntime.initGeneratorFunction(function $__15() {
        var $__16,
            $__17;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__16 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__17 = $__16[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__17.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__17.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__17.value;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function needsPolyfill(global) {
    var $__11 = global,
        Set = $__11.Set,
        Symbol = $__11.Symbol;
    if (!Set || !hasNativeSymbol() || !Set.prototype[Symbol.iterator] || !Set.prototype.values) {
      return true;
    }
    try {
      return new Set([1]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillSet(global) {
    if (needsPolyfill(global)) {
      global.Set = Set;
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Set.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  var toString = {}.toString;
  var vertxNext;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var browserWindow = (typeof window !== 'undefined') ? window : undefined;
  var browserGlobal = browserWindow || {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    var nextTick = process.nextTick;
    var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
    if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
      nextTick = setImmediate;
    }
    return function() {
      nextTick(flush);
    };
  }
  function useVertxTimer() {
    return function() {
      vertxNext(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  function attemptVertex() {
    try {
      var r = require;
      var vertx = r('vertx');
      vertxNext = vertx.runOnLoop || vertx.runOnContext;
      return useVertxTimer();
    } catch (e) {
      return useSetTimeout();
    }
  }
  var scheduleFlush;
  if (isNode) {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else if (browserWindow === undefined && typeof require === 'function') {
    scheduleFlush = attemptVertex();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return asap;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js";
  var async = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../../../node_modules/rsvp/lib/rsvp/asap.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js")).default;
  var $__9 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js")),
      isObject = $__9.isObject,
      registerPolyfill = $__9.registerPolyfill;
  var $__10 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js")),
      createPrivateSymbol = $__10.createPrivateSymbol,
      getPrivate = $__10.getPrivate,
      setPrivate = $__10.setPrivate;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: function(x) {
          promiseResolve(promise, x);
        },
        reject: function(r) {
          promiseReject(promise, r);
        }
      };
    } else {
      var result = {};
      result.promise = new C(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      });
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function() {
    function Promise(resolver) {
      if (resolver === promiseRaw)
        return;
      if (typeof resolver !== 'function')
        throw new TypeError;
      var promise = promiseInit(this);
      try {
        resolver(function(x) {
          promiseResolve(promise, x);
        }, function(r) {
          promiseReject(promise, r);
        });
      } catch (e) {
        promiseReject(promise, e);
      }
    }
    return ($traceurRuntime.createClass)(Promise, {
      catch: function(onReject) {
        return this.then(undefined, onReject);
      },
      then: function(onResolve, onReject) {
        if (typeof onResolve !== 'function')
          onResolve = idResolveHandler;
        if (typeof onReject !== 'function')
          onReject = idRejectHandler;
        var that = this;
        var constructor = this.constructor;
        return chain(this, function(x) {
          x = promiseCoerce(constructor, x);
          return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
        }, onReject);
      }
    }, {
      resolve: function(x) {
        if (this === $Promise) {
          if (isPromise(x)) {
            return x;
          }
          return promiseSet(new $Promise(promiseRaw), +1, x);
        } else {
          return new this(function(resolve, reject) {
            resolve(x);
          });
        }
      },
      reject: function(r) {
        if (this === $Promise) {
          return promiseSet(new $Promise(promiseRaw), -1, r);
        } else {
          return new this(function(resolve, reject) {
            reject(r);
          });
        }
      },
      all: function(values) {
        var deferred = getDeferred(this);
        var resolutions = [];
        try {
          var makeCountdownFunction = function(i) {
            return function(x) {
              resolutions[i] = x;
              if (--count === 0)
                deferred.resolve(resolutions);
            };
          };
          var count = 0;
          var i = 0;
          var $__4 = true;
          var $__5 = false;
          var $__6 = undefined;
          try {
            for (var $__2 = void 0,
                $__1 = (values)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
              var value = $__2.value;
              {
                var countdownFunction = makeCountdownFunction(i);
                this.resolve(value).then(countdownFunction, function(r) {
                  deferred.reject(r);
                });
                ++i;
                ++count;
              }
            }
          } catch ($__7) {
            $__5 = true;
            $__6 = $__7;
          } finally {
            try {
              if (!$__4 && $__1.return != null) {
                $__1.return();
              }
            } finally {
              if ($__5) {
                throw $__6;
              }
            }
          }
          if (count === 0) {
            deferred.resolve(resolutions);
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      },
      race: function(values) {
        var deferred = getDeferred(this);
        try {
          for (var i = 0; i < values.length; i++) {
            this.resolve(values[i]).then(function(x) {
              deferred.resolve(x);
            }, function(r) {
              deferred.reject(r);
            });
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      }
    });
  }();
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async(function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    });
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = createPrivateSymbol();
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        setPrivate(x, thenableSymbol, promise);
        return promise;
      }
      if (typeof then === 'function') {
        var p = getPrivate(x, thenableSymbol);
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          setPrivate(x, thenableSymbol, deferred.promise);
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Promise.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/StringIterator.js";
  var $__3 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/StringIterator.js")),
      createIteratorResultObject = $__3.createIteratorResultObject,
      isObject = $__3.isObject;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function() {
    var $__1;
    function StringIterator() {}
    return ($traceurRuntime.createClass)(StringIterator, ($__1 = {}, Object.defineProperty($__1, "next", {
      value: function() {
        var o = this;
        if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
          throw new TypeError('this must be a StringIterator object');
        }
        var s = o[iteratedString];
        if (s === undefined) {
          return createIteratorResultObject(undefined, true);
        }
        var position = o[stringIteratorNextIndex];
        var len = s.length;
        if (position >= len) {
          o[iteratedString] = undefined;
          return createIteratorResultObject(undefined, true);
        }
        var first = s.charCodeAt(position);
        var resultString;
        if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
          resultString = String.fromCharCode(first);
        } else {
          var second = s.charCodeAt(position + 1);
          if (second < 0xDC00 || second > 0xDFFF) {
            resultString = String.fromCharCode(first);
          } else {
            resultString = String.fromCharCode(first) + String.fromCharCode(second);
          }
        }
        o[stringIteratorNextIndex] = position + resultString.length;
        return createIteratorResultObject(resultString, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__1, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__1), {});
  }();
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[iteratedString] = s;
    iterator[stringIteratorNextIndex] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/String.js";
  var checkObjectCoercible = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../checkObjectCoercible.js", "traceur-runtime@0.0.111/src/runtime/polyfills/String.js")).default;
  var createStringIterator = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./StringIterator.js", "traceur-runtime@0.0.111/src/runtime/polyfills/String.js")).createStringIterator;
  var $__3 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/String.js")),
      maybeAddFunctions = $__3.maybeAddFunctions,
      maybeAddIterator = $__3.maybeAddIterator,
      registerPolyfill = $__3.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint(_) {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/String.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/ArrayIterator.js";
  var $__2 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/ArrayIterator.js")),
      toObject = $__2.toObject,
      toUint32 = $__2.toUint32,
      createIteratorResultObject = $__2.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function() {
    var $__1;
    function ArrayIterator() {}
    return ($traceurRuntime.createClass)(ArrayIterator, ($__1 = {}, Object.defineProperty($__1, "next", {
      value: function() {
        var iterator = toObject(this);
        var array = iterator.iteratorObject_;
        if (!array) {
          throw new TypeError('Object is not an ArrayIterator');
        }
        var index = iterator.arrayIteratorNextIndex_;
        var itemKind = iterator.arrayIterationKind_;
        var length = toUint32(array.length);
        if (index >= length) {
          iterator.arrayIteratorNextIndex_ = Infinity;
          return createIteratorResultObject(undefined, true);
        }
        iterator.arrayIteratorNextIndex_ = index + 1;
        if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
          return createIteratorResultObject(array[index], false);
        if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
          return createIteratorResultObject([index, array[index]], false);
        return createIteratorResultObject(index, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__1, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__1), {});
  }();
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Array.js";
  var $__9 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./ArrayIterator.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Array.js")),
      entries = $__9.entries,
      keys = $__9.keys,
      jsValues = $__9.values;
  var $__10 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Array.js")),
      checkIterable = $__10.checkIterable,
      isCallable = $__10.isCallable,
      isConstructor = $__10.isConstructor,
      maybeAddFunctions = $__10.maybeAddFunctions,
      maybeAddIterator = $__10.maybeAddIterator,
      registerPolyfill = $__10.registerPolyfill,
      toInteger = $__10.toInteger,
      toLength = $__10.toLength,
      toObject = $__10.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      var $__3 = true;
      var $__4 = false;
      var $__5 = undefined;
      try {
        for (var $__1 = void 0,
            $__0 = (items)[Symbol.iterator](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
          var item = $__1.value;
          {
            if (mapping) {
              arr[k] = mapFn.call(thisArg, item, k);
            } else {
              arr[k] = item;
            }
            k++;
          }
        }
      } catch ($__6) {
        $__4 = true;
        $__5 = $__6;
      } finally {
        try {
          if (!$__3 && $__0.return != null) {
            $__0.return();
          }
        } finally {
          if ($__4) {
            throw $__5;
          }
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__7 = 0; $__7 < arguments.length; $__7++)
      items[$__7] = arguments[$__7];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__8 = global,
        Array = $__8.Array,
        Object = $__8.Object,
        Symbol = $__8.Symbol;
    var values = jsValues;
    if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
      values = Array.prototype[Symbol.iterator];
    }
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Array.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/assign.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/assign.js";
  var keys = Object.keys;
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p = void 0,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        target[name] = source[name];
      }
    }
    return target;
  }
  return {get default() {
      return assign;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Object.js";
  var $__2 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Object.js")),
      maybeAddFunctions = $__2.maybeAddFunctions,
      registerPolyfill = $__2.registerPolyfill;
  var assign = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./assign.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Object.js")).default;
  var $__0 = Object,
      defineProperty = $__0.defineProperty,
      getOwnPropertyDescriptor = $__0.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__0.getOwnPropertyNames;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get assign() {
      return assign;
    },
    get is() {
      return is;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Object.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Number.js";
  var $__1 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Number.js")),
      isNumber = $__1.isNumber,
      maybeAddConsts = $__1.maybeAddConsts,
      maybeAddFunctions = $__1.maybeAddFunctions,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Number.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/fround.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/fround.js";
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__0 = Math,
      LN2 = $__0.LN2,
      abs = $__0.abs,
      floor = $__0.floor,
      log = $__0.log,
      min = $__0.min,
      pow = $__0.pow;
  function packIEEE754(v, ebits, fbits) {
    var bias = (1 << (ebits - 1)) - 1,
        s,
        e,
        f,
        ln,
        i,
        bits,
        str,
        bytes;
    function roundToEven(n) {
      var w = floor(n),
          f = n - w;
      if (f < 0.5)
        return w;
      if (f > 0.5)
        return w + 1;
      return w % 2 ? w + 1 : w;
    }
    if (v !== v) {
      e = (1 << ebits) - 1;
      f = pow(2, fbits - 1);
      s = 0;
    } else if (v === Infinity || v === -Infinity) {
      e = (1 << ebits) - 1;
      f = 0;
      s = (v < 0) ? 1 : 0;
    } else if (v === 0) {
      e = 0;
      f = 0;
      s = (1 / v === -Infinity) ? 1 : 0;
    } else {
      s = v < 0;
      v = abs(v);
      if (v >= pow(2, 1 - bias)) {
        e = min(floor(log(v) / LN2), 1023);
        f = roundToEven(v / pow(2, e) * pow(2, fbits));
        if (f / pow(2, fbits) >= 2) {
          e = e + 1;
          f = 1;
        }
        if (e > bias) {
          e = (1 << ebits) - 1;
          f = 0;
        } else {
          e = e + bias;
          f = f - pow(2, fbits);
        }
      } else {
        e = 0;
        f = roundToEven(v / pow(2, 1 - bias - fbits));
      }
    }
    bits = [];
    for (i = fbits; i; i -= 1) {
      bits.push(f % 2 ? 1 : 0);
      f = floor(f / 2);
    }
    for (i = ebits; i; i -= 1) {
      bits.push(e % 2 ? 1 : 0);
      e = floor(e / 2);
    }
    bits.push(s ? 1 : 0);
    bits.reverse();
    str = bits.join('');
    bytes = [];
    while (str.length) {
      bytes.push(parseInt(str.substring(0, 8), 2));
      str = str.substring(8);
    }
    return bytes;
  }
  function unpackIEEE754(bytes, ebits, fbits) {
    var bits = [],
        i,
        j,
        b,
        str,
        bias,
        s,
        e,
        f;
    for (i = bytes.length; i; i -= 1) {
      b = bytes[i - 1];
      for (j = 8; j; j -= 1) {
        bits.push(b % 2 ? 1 : 0);
        b = b >> 1;
      }
    }
    bits.reverse();
    str = bits.join('');
    bias = (1 << (ebits - 1)) - 1;
    s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    e = parseInt(str.substring(1, 1 + ebits), 2);
    f = parseInt(str.substring(1 + ebits), 2);
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    } else if (e > 0) {
      return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
    } else if (f !== 0) {
      return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
    } else {
      return s < 0 ? -0 : 0;
    }
  }
  function unpackF32(b) {
    return unpackIEEE754(b, 8, 23);
  }
  function packF32(v) {
    return packIEEE754(v, 8, 23);
  }
  function fround(x) {
    if (x === 0 || !$isFinite(x) || $isNaN(x)) {
      return x;
    }
    return unpackF32(packF32(Number(x)));
  }
  return {get fround() {
      return fround;
    }};
});
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/Math.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/Math.js";
  var jsFround = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./fround.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Math.js")).fround;
  var $__3 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/Math.js")),
      maybeAddFunctions = $__3.maybeAddFunctions,
      registerPolyfill = $__3.registerPolyfill,
      toUint32 = $__3.toUint32;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__0 = Math,
      abs = $__0.abs,
      ceil = $__0.ceil,
      exp = $__0.exp,
      floor = $__0.floor,
      log = $__0.log,
      pow = $__0.pow,
      sqrt = $__0.sqrt;
  function clz32(x) {
    x = toUint32(+x);
    if (x == 0)
      return 32;
    var result = 0;
    if ((x & 0xFFFF0000) === 0) {
      x <<= 16;
      result += 16;
    }
    ;
    if ((x & 0xFF000000) === 0) {
      x <<= 8;
      result += 8;
    }
    ;
    if ((x & 0xF0000000) === 0) {
      x <<= 4;
      result += 4;
    }
    ;
    if ((x & 0xC0000000) === 0) {
      x <<= 2;
      result += 2;
    }
    ;
    if ((x & 0x80000000) === 0) {
      x <<= 1;
      result += 1;
    }
    ;
    return result;
  }
  function imul(x, y) {
    x = toUint32(+x);
    y = toUint32(+y);
    var xh = (x >>> 16) & 0xffff;
    var xl = x & 0xffff;
    var yh = (y >>> 16) & 0xffff;
    var yl = y & 0xffff;
    return xl * yl + (((xh * yl + xl * yh) << 16) >>> 0) | 0;
  }
  function sign(x) {
    x = +x;
    if (x > 0)
      return 1;
    if (x < 0)
      return -1;
    return x;
  }
  function log10(x) {
    return log(x) * 0.434294481903251828;
  }
  function log2(x) {
    return log(x) * 1.442695040888963407;
  }
  function log1p(x) {
    x = +x;
    if (x < -1 || $isNaN(x)) {
      return NaN;
    }
    if (x === 0 || x === Infinity) {
      return x;
    }
    if (x === -1) {
      return -Infinity;
    }
    var result = 0;
    var n = 50;
    if (x < 0 || x > 1) {
      return log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        result -= pow(x, i) / i;
      } else {
        result += pow(x, i) / i;
      }
    }
    return result;
  }
  function expm1(x) {
    x = +x;
    if (x === -Infinity) {
      return -1;
    }
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return exp(x) - 1;
  }
  function cosh(x) {
    x = +x;
    if (x === 0) {
      return 1;
    }
    if ($isNaN(x)) {
      return NaN;
    }
    if (!$isFinite(x)) {
      return Infinity;
    }
    if (x < 0) {
      x = -x;
    }
    if (x > 21) {
      return exp(x) / 2;
    }
    return (exp(x) + exp(-x)) / 2;
  }
  function sinh(x) {
    x = +x;
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  }
  function tanh(x) {
    x = +x;
    if (x === 0)
      return x;
    if (!$isFinite(x))
      return sign(x);
    var exp1 = exp(x);
    var exp2 = exp(-x);
    return (exp1 - exp2) / (exp1 + exp2);
  }
  function acosh(x) {
    x = +x;
    if (x < 1)
      return NaN;
    if (!$isFinite(x))
      return x;
    return log(x + sqrt(x + 1) * sqrt(x - 1));
  }
  function asinh(x) {
    x = +x;
    if (x === 0 || !$isFinite(x))
      return x;
    if (x > 0)
      return log(x + sqrt(x * x + 1));
    return -log(-x + sqrt(x * x + 1));
  }
  function atanh(x) {
    x = +x;
    if (x === -1) {
      return -Infinity;
    }
    if (x === 1) {
      return Infinity;
    }
    if (x === 0) {
      return x;
    }
    if ($isNaN(x) || x < -1 || x > 1) {
      return NaN;
    }
    return 0.5 * log((1 + x) / (1 - x));
  }
  function hypot(x, y) {
    var length = arguments.length;
    var args = new Array(length);
    var max = 0;
    for (var i = 0; i < length; i++) {
      var n = arguments[i];
      n = +n;
      if (n === Infinity || n === -Infinity)
        return Infinity;
      n = abs(n);
      if (n > max)
        max = n;
      args[i] = n;
    }
    if (max === 0)
      max = 1;
    var sum = 0;
    var compensation = 0;
    for (var i = 0; i < length; i++) {
      var n = args[i] / max;
      var summand = n * n - compensation;
      var preliminary = sum + summand;
      compensation = (preliminary - sum) - summand;
      sum = preliminary;
    }
    return sqrt(sum) * max;
  }
  function trunc(x) {
    x = +x;
    if (x > 0)
      return floor(x);
    if (x < 0)
      return ceil(x);
    return x;
  }
  var fround,
      f32;
  if (typeof Float32Array === 'function') {
    f32 = new Float32Array(1);
    fround = function(x) {
      f32[0] = Number(x);
      return f32[0];
    };
  } else {
    fround = jsFround;
  }
  function cbrt(x) {
    x = +x;
    if (x === 0)
      return x;
    var negate = x < 0;
    if (negate)
      x = -x;
    var result = pow(x, 1 / 3);
    return negate ? -result : result;
  }
  function polyfillMath(global) {
    var Math = global.Math;
    maybeAddFunctions(Math, ['acosh', acosh, 'asinh', asinh, 'atanh', atanh, 'cbrt', cbrt, 'clz32', clz32, 'cosh', cosh, 'expm1', expm1, 'fround', fround, 'hypot', hypot, 'imul', imul, 'log10', log10, 'log1p', log1p, 'log2', log2, 'sign', sign, 'sinh', sinh, 'tanh', tanh, 'trunc', trunc]);
  }
  registerPolyfill(polyfillMath);
  return {
    get clz32() {
      return clz32;
    },
    get imul() {
      return imul;
    },
    get sign() {
      return sign;
    },
    get log10() {
      return log10;
    },
    get log2() {
      return log2;
    },
    get log1p() {
      return log1p;
    },
    get expm1() {
      return expm1;
    },
    get cosh() {
      return cosh;
    },
    get sinh() {
      return sinh;
    },
    get tanh() {
      return tanh;
    },
    get acosh() {
      return acosh;
    },
    get asinh() {
      return asinh;
    },
    get atanh() {
      return atanh;
    },
    get hypot() {
      return hypot;
    },
    get trunc() {
      return trunc;
    },
    get fround() {
      return fround;
    },
    get cbrt() {
      return cbrt;
    },
    get polyfillMath() {
      return polyfillMath;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/Math.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js";
  var $__5 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js")),
      createPrivateSymbol = $__5.createPrivateSymbol,
      deletePrivate = $__5.deletePrivate,
      getPrivate = $__5.getPrivate,
      hasPrivate = $__5.hasPrivate,
      setPrivate = $__5.setPrivate;
  var $__6 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../frozen-data.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js")),
      deleteFrozen = $__6.deleteFrozen,
      getFrozen = $__6.getFrozen,
      hasFrozen = $__6.hasFrozen,
      setFrozen = $__6.setFrozen;
  var $__7 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js")),
      isObject = $__7.isObject,
      registerPolyfill = $__7.registerPolyfill;
  var hasNativeSymbol = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../has-native-symbols.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js")).default;
  var $__2 = Object,
      defineProperty = $__2.defineProperty,
      getOwnPropertyDescriptor = $__2.getOwnPropertyDescriptor,
      isExtensible = $__2.isExtensible;
  var $TypeError = TypeError;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var sentinel = {};
  var WeakMap = function() {
    function WeakMap() {
      this.name_ = createPrivateSymbol();
      this.frozenData_ = [];
    }
    return ($traceurRuntime.createClass)(WeakMap, {
      set: function(key, value) {
        if (!isObject(key))
          throw new $TypeError('key must be an object');
        if (!isExtensible(key)) {
          setFrozen(this.frozenData_, key, value);
        } else {
          setPrivate(key, this.name_, value);
        }
        return this;
      },
      get: function(key) {
        if (!isObject(key))
          return undefined;
        if (!isExtensible(key)) {
          return getFrozen(this.frozenData_, key);
        }
        return getPrivate(key, this.name_);
      },
      delete: function(key) {
        if (!isObject(key))
          return false;
        if (!isExtensible(key)) {
          return deleteFrozen(this.frozenData_, key);
        }
        return deletePrivate(key, this.name_);
      },
      has: function(key) {
        if (!isObject(key))
          return false;
        if (!isExtensible(key)) {
          return hasFrozen(this.frozenData_, key);
        }
        return hasPrivate(key, this.name_);
      }
    }, {});
  }();
  function needsPolyfill(global) {
    var $__4 = global,
        WeakMap = $__4.WeakMap,
        Symbol = $__4.Symbol;
    if (!WeakMap || !hasNativeSymbol()) {
      return true;
    }
    try {
      var o = {};
      var wm = new WeakMap([[o, false]]);
      return wm.get(o);
    } catch (e) {
      return false;
    }
  }
  function polyfillWeakMap(global) {
    if (needsPolyfill(global)) {
      global.WeakMap = WeakMap;
    }
  }
  registerPolyfill(polyfillWeakMap);
  return {
    get WeakMap() {
      return WeakMap;
    },
    get polyfillWeakMap() {
      return polyfillWeakMap;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/WeakMap.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js";
  var $__5 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../private.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js")),
      createPrivateSymbol = $__5.createPrivateSymbol,
      deletePrivate = $__5.deletePrivate,
      getPrivate = $__5.getPrivate,
      hasPrivate = $__5.hasPrivate,
      setPrivate = $__5.setPrivate;
  var $__6 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../frozen-data.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js")),
      deleteFrozen = $__6.deleteFrozen,
      getFrozen = $__6.getFrozen,
      setFrozen = $__6.setFrozen;
  var $__7 = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js")),
      isObject = $__7.isObject,
      registerPolyfill = $__7.registerPolyfill;
  var hasNativeSymbol = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("../has-native-symbols.js", "traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js")).default;
  var $__2 = Object,
      defineProperty = $__2.defineProperty,
      isExtensible = $__2.isExtensible;
  var $TypeError = TypeError;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var WeakSet = function() {
    function WeakSet() {
      this.name_ = createPrivateSymbol();
      this.frozenData_ = [];
    }
    return ($traceurRuntime.createClass)(WeakSet, {
      add: function(value) {
        if (!isObject(value))
          throw new $TypeError('value must be an object');
        if (!isExtensible(value)) {
          setFrozen(this.frozenData_, value, value);
        } else {
          setPrivate(value, this.name_, true);
        }
        return this;
      },
      delete: function(value) {
        if (!isObject(value))
          return false;
        if (!isExtensible(value)) {
          return deleteFrozen(this.frozenData_, value);
        }
        return deletePrivate(value, this.name_);
      },
      has: function(value) {
        if (!isObject(value))
          return false;
        if (!isExtensible(value)) {
          return getFrozen(this.frozenData_, value) === value;
        }
        return hasPrivate(value, this.name_);
      }
    }, {});
  }();
  function needsPolyfill(global) {
    var $__4 = global,
        WeakSet = $__4.WeakSet,
        Symbol = $__4.Symbol;
    if (!WeakSet || !hasNativeSymbol()) {
      return true;
    }
    try {
      var o = {};
      var wm = new WeakSet([[o]]);
      return !wm.has(o);
    } catch (e) {
      return false;
    }
  }
  function polyfillWeakSet(global) {
    if (needsPolyfill(global)) {
      global.WeakSet = WeakSet;
    }
  }
  registerPolyfill(polyfillWeakSet);
  return {
    get WeakSet() {
      return WeakSet;
    },
    get polyfillWeakSet() {
      return polyfillWeakSet;
    }
  };
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/WeakSet.js" + '');
$traceurRuntime.registerModule("traceur-runtime@0.0.111/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.111/src/runtime/polyfills/polyfills.js";
  var polyfillAll = $traceurRuntime.getModule($traceurRuntime.normalizeModuleName("./utils.js", "traceur-runtime@0.0.111/src/runtime/polyfills/polyfills.js")).polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
$traceurRuntime.getModule("traceur-runtime@0.0.111/src/runtime/polyfills/polyfills.js" + '');

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"pBGvAp":2,"path":1}],4:[function(require,module,exports){
module.exports = function(sprinting) {
  function Color() {
    // TODO
  }
  
  sprinting.Color = Color
  return sprinting
}
},{}],5:[function(require,module,exports){
module.exports = function(sprinting) {
  /**
   * ## Constants
  */

  /*!
   * Internal key used to unlock & run internal methods.
   *
   * @name INTERNAL_KEY
  */
  Object.defineProperty(sprinting, 'INTERNAL_KEY', {
    configurable: false,
    enumerable: false,
    value: Symbol('InternalAPI'),
    writable: false
  })

  /*!
   * Internal method for validating a given `key`
   *
   * @function VALIDATE_KEY
   * @param key
   * @returns {Boolean}
  */
  Object.defineProperty(sprinting, 'VALIDATE_KEY', {
    configurable: false,
    enumerable: false,
    value: function(symbol, err) {
      if(symbol !== sprinting.INTERNAL_KEY)
        throw new Error(err)
    },
    writable: false
  })

  /*
   * @name version
  */
  Object.defineProperty(sprinting, 'version', {
    configurable: false,
    enumerable: false,
    value: '0.0.1',
    writable: false
  })

  return sprinting
}
},{}],6:[function(require,module,exports){
"use strict";
!function() {
  require('traceur/bin/traceur-runtime');
  var sprinting = {};
  sprinting = require('./constants')(sprinting);
  sprinting = require('./world')(sprinting);
  sprinting = require('./color')(sprinting);
  sprinting = require('./things')(sprinting);
  sprinting = require('./things.shapes')(sprinting);
  sprinting = require('./things.shapes.rectangles')(sprinting);
  Square.prototype = new sprinting.Rectangle;
  Square.prototype.constructor = Square;
  Square.prototype.uber = sprinting.Rectangle.prototype;
  Object.defineProperty(window, 'Sprinting', {
    configurable: false,
    enumerable: true,
    value: sprinting,
    writable: false
  });
}();

},{"./color":4,"./constants":5,"./things":7,"./things.shapes":8,"./things.shapes.rectangles":9,"./world":10,"traceur/bin/traceur-runtime":3}],7:[function(require,module,exports){
module.exports = function(sprinting) {
  /**
   * ## Things
   */

  /**
   * Something that is contained within the [World](#the-world).
   *
   * @function Thing
   * @param {Symbol} symbol Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   */
  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }

  sprinting.Thing = Thing
  return sprinting
}
},{}],8:[function(require,module,exports){
module.exports = function(sprinting) {
  /**
   * ## Shapes
   */

  Shape.prototype = new sprinting.Thing(sprinting.INTERNAL_KEY)
  Shape.prototype.constructor = Shape
  Shape.prototype.uber = sprinting.Thing.prototype

  /*!
   * A Shape is a [Thing](#things) with a stroke and fill.
   *
   * @function Shape
   * @see Thing
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   * @param {Color | String} stroke The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**.
   * @param {Color | String} fill   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**.
   */
  function Shape(symbol, stroke = '#000000', fill = '#FFFFFF') {
    sprinting.VALIDATE_KEY(symbol, 'new Shape(): Illegal construction of abstract class Shape.')

    if(!(stroke instanceof sprinting.Color || typeof stroke === 'string'))
      throw new TypeError('new Shape(): arg 2 must be a Sprinting.Color or string')
    if(!(fill instanceof sprinting.Color || typeof fill === 'string'))
      throw new TypeError('new Shape(): arg 3 must be a Sprinting.Color or string')
    this.stroke = stroke, this.fill = fill
  }

  /**
   * Draws this Shape to the screen.
   *
   * @function Shape._draw
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  Shape._draw = function(symbol) {
    if(!x instanceof Number)
      throw new TypeError('Shape.draw(): arg 2 must be a Number.')
    if(!y instanceof Number)
      throw new TypeError('Shape.draw(): arg 3 must be a Number.')

    sprinting.VALIDATE_KEY(symbol, 'Shape.draw is private and should not be called.')
  }

  sprinting.Shape = Shape
  return sprinting
}
},{}],9:[function(require,module,exports){
module.exports = function(sprinting) { 
  /**
   * ## Rectangles and Squares
   */

  Rectangle.prototype = new sprinting.Shape(sprinting.INTERNAL_KEY)
  Rectangle.prototype.constructor = Rectangle
  Rectangle.prototype.uber = sprinting.Shape.prototype

  /**
   * A Rectangle is a [Shape](#shapes) with a width and a height.
   *
   * ```
   * let rect = new Sprinting.Rectangle(100, 100)
   * world.add(rect, 25, 25))
   * ```
   *
   * @param {Number} width  **Default**: `50`.
   * @param {Number} height **Default**: `50`.
   * @param {Color}  stroke  The outline color of t-he Shape. **Default**: `"#000000"`
   * @param {Color}  fill    The inside  color of the Shape. **Default**: `"#FFFFFF"`
   */
  function Rectangle(width = 50, height = 50, stroke, fill) {
    this.uber.constructor(sprinting.INTERNAL_KEY, stroke, fill)
    Object.assign(this, this.uber) // Update our properties to be the same as our uber

    if(!width instanceof Number)
      throw new TypeError('new Rectangle(): arg 1 must be a Number.')
    if(!height instanceof Number)
      throw new TypeError('new Rectangle(): arg 2 must be a Number.')
    this.width = width, this.height = height
  }

  Rectangle.prototype._draw = function(key) {
    uber._draw(key)

    // @TODO
  }

  sprinting.Rectangle = Rectangle

  /**
  * A Square is a Rectangle but with side length (rather than width and height).
  *
  * ```
  * let mySquare = new Sprinting.Square(100)
  * world.add(mySquare)
  * ```
  *
  * @see Rectangle
  * @param {Number} length **Default**: `50`
  * @param {Color}  stroke **Default**: `#000000`
  * @param {Color}  fill   **Default**: `#FFFFFF`
  */
  function Square(length = 50, stroke, fill) {
    this.uber.constructor(length, length, stroke, fill)
    Object.assign(this, this.uber) // Update our properties to be the same as our uber
  }

  Square.prototype._draw = function(symbol, x, y) {
    this.uber._draw(symbol, x, y)
  }

  sprinting.Square = Square

  return sprinting
}
},{}],10:[function(require,module,exports){
module.exports = function(sprinting) {
  /**
   * ## The World
  */

  /**
   * The World contains all the Things.
   *
   * ```js
   * let world = new Sprinting.World(document.getElementById('world'))
   * ```
   *
   * @function World
   * @param {HTMLElement} element DOM element to draw to. **Required**.
   */
  function World(element) {
    console.log(typeof element)

    if(!(element instanceof HTMLElement || typeof element === 'string'))
      throw new TypeError('new World(): arg 1 must be an HTMLElement or string.')

    this.element = typeof element === 'string' ? document.querySelector(element) : element
    this.things  = []
  }

  /**
   * Adds a [Thing](#things) to the [World](#the-world).
   *
   * ```js
   * world.add(new Sprinting.Square(100), 20, 30)
   * ```
   *
   * @function World.add
   * @param {Thing} something The [thing](#things) to add to [World](#the-world). **Required**.
   * @param {Number} x x-position of Thing. **Default**: `0`.
   * @param {Number} y y-position of Thing. **Default**: `0`.
   */
  World.prototype.add = function(something, x = 0, y = 0) {
    if(!something instanceof sprinting.Thing)
      throw new TypeError('World.add(): arg 1 must be a Sprinting.Thing.')
    if(!x instanceof Number)
      throw new TypeError('World.add(): arg 2 must be a Number.')
    if(!y instanceof Number)
      throw new TypeError('World.add(): arg 3 must be a Number.')

    this.things.push({inst: something, x, y})
  }

  /*!
   * Draws every [Thing](#things) in the [World](#the-world).
   *
   * @function World._draw
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  World.prototype._draw = function(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'World._draw(): World._draw() is private and should not be called.')

    this.things.forEach(function(thing) {
      thing.inst.draw(thing.x, thing.y)
    })
  }

  sprinting.World = World
  return sprinting
}
},{}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2FsZXgvc3ByaW50aW5nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiL2hvbWUvYWxleC9zcHJpbnRpbmcvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2FsZXgvc3ByaW50aW5nL25vZGVfbW9kdWxlcy90cmFjZXVyL2Jpbi90cmFjZXVyLXJ1bnRpbWUuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9zcmMvY29sb3IuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9zcmMvY29uc3RhbnRzLmpzIiwiL2hvbWUvYWxleC9zcHJpbnRpbmcvc3JjL2Zha2VfZjJiODVkNi5qcyIsIi9ob21lL2FsZXgvc3ByaW50aW5nL3NyYy90aGluZ3MuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9zcmMvdGhpbmdzLnNoYXBlcy5qcyIsIi9ob21lL2FsZXgvc3ByaW50aW5nL3NyYy90aGluZ3Muc2hhcGVzLnJlY3RhbmdsZXMuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9zcmMvd29ybGQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2huSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwicEJHdkFwXCIpKSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgaWYgKGdsb2JhbC4kdHJhY2V1clJ1bnRpbWUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZnVuY3Rpb24gc2V0dXBHbG9iYWxzKGdsb2JhbCkge1xuICAgIGdsb2JhbC5SZWZsZWN0ID0gZ2xvYmFsLlJlZmxlY3QgfHwge307XG4gICAgZ2xvYmFsLlJlZmxlY3QuZ2xvYmFsID0gZ2xvYmFsLlJlZmxlY3QuZ2xvYmFsIHx8IGdsb2JhbDtcbiAgfVxuICBzZXR1cEdsb2JhbHMoZ2xvYmFsKTtcbiAgdmFyIHR5cGVPZiA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gdHlwZW9mIHg7XG4gIH07XG4gIGdsb2JhbC4kdHJhY2V1clJ1bnRpbWUgPSB7XG4gICAgb3B0aW9uczoge30sXG4gICAgc2V0dXBHbG9iYWxzOiBzZXR1cEdsb2JhbHMsXG4gICAgdHlwZW9mOiB0eXBlT2ZcbiAgfTtcbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcyk7XG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGJ1aWxkRnJvbUVuY29kZWRQYXJ0cyhvcHRfc2NoZW1lLCBvcHRfdXNlckluZm8sIG9wdF9kb21haW4sIG9wdF9wb3J0LCBvcHRfcGF0aCwgb3B0X3F1ZXJ5RGF0YSwgb3B0X2ZyYWdtZW50KSB7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIGlmIChvcHRfc2NoZW1lKSB7XG4gICAgICBvdXQucHVzaChvcHRfc2NoZW1lLCAnOicpO1xuICAgIH1cbiAgICBpZiAob3B0X2RvbWFpbikge1xuICAgICAgb3V0LnB1c2goJy8vJyk7XG4gICAgICBpZiAob3B0X3VzZXJJbmZvKSB7XG4gICAgICAgIG91dC5wdXNoKG9wdF91c2VySW5mbywgJ0AnKTtcbiAgICAgIH1cbiAgICAgIG91dC5wdXNoKG9wdF9kb21haW4pO1xuICAgICAgaWYgKG9wdF9wb3J0KSB7XG4gICAgICAgIG91dC5wdXNoKCc6Jywgb3B0X3BvcnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0X3BhdGgpIHtcbiAgICAgIG91dC5wdXNoKG9wdF9wYXRoKTtcbiAgICB9XG4gICAgaWYgKG9wdF9xdWVyeURhdGEpIHtcbiAgICAgIG91dC5wdXNoKCc/Jywgb3B0X3F1ZXJ5RGF0YSk7XG4gICAgfVxuICAgIGlmIChvcHRfZnJhZ21lbnQpIHtcbiAgICAgIG91dC5wdXNoKCcjJywgb3B0X2ZyYWdtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dC5qb2luKCcnKTtcbiAgfVxuICB2YXIgc3BsaXRSZSA9IG5ldyBSZWdFeHAoJ14nICsgJyg/OicgKyAnKFteOi8/Iy5dKyknICsgJzopPycgKyAnKD86Ly8nICsgJyg/OihbXi8/I10qKUApPycgKyAnKFtcXFxcd1xcXFxkXFxcXC1cXFxcdTAxMDAtXFxcXHVmZmZmLiVdKiknICsgJyg/OjooWzAtOV0rKSk/JyArICcpPycgKyAnKFtePyNdKyk/JyArICcoPzpcXFxcPyhbXiNdKikpPycgKyAnKD86IyguKikpPycgKyAnJCcpO1xuICB2YXIgQ29tcG9uZW50SW5kZXggPSB7XG4gICAgU0NIRU1FOiAxLFxuICAgIFVTRVJfSU5GTzogMixcbiAgICBET01BSU46IDMsXG4gICAgUE9SVDogNCxcbiAgICBQQVRIOiA1LFxuICAgIFFVRVJZX0RBVEE6IDYsXG4gICAgRlJBR01FTlQ6IDdcbiAgfTtcbiAgZnVuY3Rpb24gc3BsaXQodXJpKSB7XG4gICAgcmV0dXJuICh1cmkubWF0Y2goc3BsaXRSZSkpO1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZURvdFNlZ21lbnRzKHBhdGgpIHtcbiAgICBpZiAocGF0aCA9PT0gJy8nKVxuICAgICAgcmV0dXJuICcvJztcbiAgICB2YXIgbGVhZGluZ1NsYXNoID0gcGF0aFswXSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgdmFyIHRyYWlsaW5nU2xhc2ggPSBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgdmFyIHNlZ21lbnRzID0gcGF0aC5zcGxpdCgnLycpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICB2YXIgdXAgPSAwO1xuICAgIGZvciAodmFyIHBvcyA9IDA7IHBvcyA8IHNlZ21lbnRzLmxlbmd0aDsgcG9zKyspIHtcbiAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbcG9zXTtcbiAgICAgIHN3aXRjaCAoc2VnbWVudCkge1xuICAgICAgICBjYXNlICcnOlxuICAgICAgICBjYXNlICcuJzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLi4nOlxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoKVxuICAgICAgICAgICAgb3V0LnBvcCgpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHVwKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgb3V0LnB1c2goc2VnbWVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbGVhZGluZ1NsYXNoKSB7XG4gICAgICB3aGlsZSAodXAtLSA+IDApIHtcbiAgICAgICAgb3V0LnVuc2hpZnQoJy4uJyk7XG4gICAgICB9XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMClcbiAgICAgICAgb3V0LnB1c2goJy4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGxlYWRpbmdTbGFzaCArIG91dC5qb2luKCcvJykgKyB0cmFpbGluZ1NsYXNoO1xuICB9XG4gIGZ1bmN0aW9uIGpvaW5BbmRDYW5vbmljYWxpemVQYXRoKHBhcnRzKSB7XG4gICAgdmFyIHBhdGggPSBwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXSB8fCAnJztcbiAgICBwYXRoID0gcmVtb3ZlRG90U2VnbWVudHMocGF0aCk7XG4gICAgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF0gPSBwYXRoO1xuICAgIHJldHVybiBidWlsZEZyb21FbmNvZGVkUGFydHMocGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSwgcGFydHNbQ29tcG9uZW50SW5kZXguVVNFUl9JTkZPXSwgcGFydHNbQ29tcG9uZW50SW5kZXguRE9NQUlOXSwgcGFydHNbQ29tcG9uZW50SW5kZXguUE9SVF0sIHBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdLCBwYXJ0c1tDb21wb25lbnRJbmRleC5RVUVSWV9EQVRBXSwgcGFydHNbQ29tcG9uZW50SW5kZXguRlJBR01FTlRdKTtcbiAgfVxuICBmdW5jdGlvbiBjYW5vbmljYWxpemVVcmwodXJsKSB7XG4gICAgdmFyIHBhcnRzID0gc3BsaXQodXJsKTtcbiAgICByZXR1cm4gam9pbkFuZENhbm9uaWNhbGl6ZVBhdGgocGFydHMpO1xuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVVcmwoYmFzZSwgdXJsKSB7XG4gICAgdmFyIHBhcnRzID0gc3BsaXQodXJsKTtcbiAgICB2YXIgYmFzZVBhcnRzID0gc3BsaXQoYmFzZSk7XG4gICAgaWYgKHBhcnRzW0NvbXBvbmVudEluZGV4LlNDSEVNRV0pIHtcbiAgICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzW0NvbXBvbmVudEluZGV4LlNDSEVNRV0gPSBiYXNlUGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IENvbXBvbmVudEluZGV4LlNDSEVNRTsgaSA8PSBDb21wb25lbnRJbmRleC5QT1JUOyBpKyspIHtcbiAgICAgIGlmICghcGFydHNbaV0pIHtcbiAgICAgICAgcGFydHNbaV0gPSBiYXNlUGFydHNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXVswXSA9PSAnLycpIHtcbiAgICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gICAgfVxuICAgIHZhciBwYXRoID0gYmFzZVBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdO1xuICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcbiAgICBwYXRoID0gcGF0aC5zbGljZSgwLCBpbmRleCArIDEpICsgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF07XG4gICAgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF0gPSBwYXRoO1xuICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gIH1cbiAgZnVuY3Rpb24gaXNBYnNvbHV0ZShuYW1lKSB7XG4gICAgaWYgKCFuYW1lKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYW1lWzBdID09PSAnLycpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgcGFydHMgPSBzcGxpdChuYW1lKTtcbiAgICBpZiAocGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSlcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAkdHJhY2V1clJ1bnRpbWUuY2Fub25pY2FsaXplVXJsID0gY2Fub25pY2FsaXplVXJsO1xuICAkdHJhY2V1clJ1bnRpbWUuaXNBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XG4gICR0cmFjZXVyUnVudGltZS5yZW1vdmVEb3RTZWdtZW50cyA9IHJlbW92ZURvdFNlZ21lbnRzO1xuICAkdHJhY2V1clJ1bnRpbWUucmVzb2x2ZVVybCA9IHJlc29sdmVVcmw7XG59KSgpO1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciAkX18zID0gJHRyYWNldXJSdW50aW1lLFxuICAgICAgY2Fub25pY2FsaXplVXJsID0gJF9fMy5jYW5vbmljYWxpemVVcmwsXG4gICAgICByZXNvbHZlVXJsID0gJF9fMy5yZXNvbHZlVXJsLFxuICAgICAgaXNBYnNvbHV0ZSA9ICRfXzMuaXNBYnNvbHV0ZTtcbiAgdmFyIG1vZHVsZUluc3RhbnRpYXRvcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2YXIgYmFzZVVSTDtcbiAgaWYgKGdsb2JhbC5sb2NhdGlvbiAmJiBnbG9iYWwubG9jYXRpb24uaHJlZilcbiAgICBiYXNlVVJMID0gcmVzb2x2ZVVybChnbG9iYWwubG9jYXRpb24uaHJlZiwgJy4vJyk7XG4gIGVsc2VcbiAgICBiYXNlVVJMID0gJyc7XG4gIGZ1bmN0aW9uIFVuY29hdGVkTW9kdWxlRW50cnkodXJsLCB1bmNvYXRlZE1vZHVsZSkge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMudmFsdWVfID0gdW5jb2F0ZWRNb2R1bGU7XG4gIH1cbiAgZnVuY3Rpb24gTW9kdWxlRXZhbHVhdGlvbkVycm9yKGVycm9uZW91c01vZHVsZU5hbWUsIGNhdXNlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgJzogJyArIHRoaXMuc3RyaXBDYXVzZShjYXVzZSkgKyAnIGluICcgKyBlcnJvbmVvdXNNb2R1bGVOYW1lO1xuICAgIGlmICghKGNhdXNlIGluc3RhbmNlb2YgTW9kdWxlRXZhbHVhdGlvbkVycm9yKSAmJiBjYXVzZS5zdGFjaylcbiAgICAgIHRoaXMuc3RhY2sgPSB0aGlzLnN0cmlwU3RhY2soY2F1c2Uuc3RhY2spO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuc3RhY2sgPSAnJztcbiAgfVxuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW9kdWxlRXZhbHVhdGlvbkVycm9yO1xuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlLnN0cmlwRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbGFjZSgvLipFcnJvcjovLCB0aGlzLmNvbnN0cnVjdG9yLm5hbWUgKyAnOicpO1xuICB9O1xuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlLnN0cmlwQ2F1c2UgPSBmdW5jdGlvbihjYXVzZSkge1xuICAgIGlmICghY2F1c2UpXG4gICAgICByZXR1cm4gJyc7XG4gICAgaWYgKCFjYXVzZS5tZXNzYWdlKVxuICAgICAgcmV0dXJuIGNhdXNlICsgJyc7XG4gICAgcmV0dXJuIHRoaXMuc3RyaXBFcnJvcihjYXVzZS5tZXNzYWdlKTtcbiAgfTtcbiAgTW9kdWxlRXZhbHVhdGlvbkVycm9yLnByb3RvdHlwZS5sb2FkZWRCeSA9IGZ1bmN0aW9uKG1vZHVsZU5hbWUpIHtcbiAgICB0aGlzLnN0YWNrICs9ICdcXG4gbG9hZGVkIGJ5ICcgKyBtb2R1bGVOYW1lO1xuICB9O1xuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlLnN0cmlwU3RhY2sgPSBmdW5jdGlvbihjYXVzZVN0YWNrKSB7XG4gICAgdmFyIHN0YWNrID0gW107XG4gICAgY2F1c2VTdGFjay5zcGxpdCgnXFxuJykuc29tZShmdW5jdGlvbihmcmFtZSkge1xuICAgICAgaWYgKC9VbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvci8udGVzdChmcmFtZSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgc3RhY2sucHVzaChmcmFtZSk7XG4gICAgfSk7XG4gICAgc3RhY2tbMF0gPSB0aGlzLnN0cmlwRXJyb3Ioc3RhY2tbMF0pO1xuICAgIHJldHVybiBzdGFjay5qb2luKCdcXG4nKTtcbiAgfTtcbiAgZnVuY3Rpb24gYmVmb3JlTGluZXMobGluZXMsIG51bWJlcikge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgZmlyc3QgPSBudW1iZXIgLSAzO1xuICAgIGlmIChmaXJzdCA8IDApXG4gICAgICBmaXJzdCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbnVtYmVyOyBpKyspIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxpbmVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBhZnRlckxpbmVzKGxpbmVzLCBudW1iZXIpIHtcbiAgICB2YXIgbGFzdCA9IG51bWJlciArIDE7XG4gICAgaWYgKGxhc3QgPiBsaW5lcy5sZW5ndGggLSAxKVxuICAgICAgbGFzdCA9IGxpbmVzLmxlbmd0aCAtIDE7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSBudW1iZXI7IGkgPD0gbGFzdDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChsaW5lc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gY29sdW1uU3BhY2luZyhjb2x1bW5zKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sdW1ucyAtIDE7IGkrKykge1xuICAgICAgcmVzdWx0ICs9ICctJztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcih1cmwsIGZ1bmMpIHtcbiAgICBVbmNvYXRlZE1vZHVsZUVudHJ5LmNhbGwodGhpcywgdXJsLCBudWxsKTtcbiAgICB0aGlzLmZ1bmMgPSBmdW5jO1xuICB9XG4gIFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVW5jb2F0ZWRNb2R1bGVFbnRyeS5wcm90b3R5cGUpO1xuICBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvci5wcm90b3R5cGUuZ2V0VW5jb2F0ZWRNb2R1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJF9fMiA9IHRoaXM7XG4gICAgaWYgKHRoaXMudmFsdWVfKVxuICAgICAgcmV0dXJuIHRoaXMudmFsdWVfO1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVsYXRpdmVSZXF1aXJlO1xuICAgICAgaWYgKHR5cGVvZiAkdHJhY2V1clJ1bnRpbWUgIT09IHVuZGVmaW5lZCAmJiAkdHJhY2V1clJ1bnRpbWUucmVxdWlyZSkge1xuICAgICAgICByZWxhdGl2ZVJlcXVpcmUgPSAkdHJhY2V1clJ1bnRpbWUucmVxdWlyZS5iaW5kKG51bGwsIHRoaXMudXJsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnZhbHVlXyA9IHRoaXMuZnVuYy5jYWxsKGdsb2JhbCwgcmVsYXRpdmVSZXF1aXJlKTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGV4IGluc3RhbmNlb2YgTW9kdWxlRXZhbHVhdGlvbkVycm9yKSB7XG4gICAgICAgIGV4LmxvYWRlZEJ5KHRoaXMudXJsKTtcbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgICBpZiAoZXguc3RhY2spIHtcbiAgICAgICAgdmFyIGxpbmVzID0gdGhpcy5mdW5jLnRvU3RyaW5nKCkuc3BsaXQoJ1xcbicpO1xuICAgICAgICB2YXIgZXZhbGVkID0gW107XG4gICAgICAgIGV4LnN0YWNrLnNwbGl0KCdcXG4nKS5zb21lKGZ1bmN0aW9uKGZyYW1lLCBpbmRleCkge1xuICAgICAgICAgIGlmIChmcmFtZS5pbmRleE9mKCdVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvci5nZXRVbmNvYXRlZE1vZHVsZScpID4gMClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIHZhciBtID0gLyhhdFxcc1teXFxzXSpcXHMpLio+OihcXGQqKTooXFxkKilcXCkvLmV4ZWMoZnJhbWUpO1xuICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHBhcnNlSW50KG1bMl0sIDEwKTtcbiAgICAgICAgICAgIGV2YWxlZCA9IGV2YWxlZC5jb25jYXQoYmVmb3JlTGluZXMobGluZXMsIGxpbmUpKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMSkge1xuICAgICAgICAgICAgICBldmFsZWQucHVzaChjb2x1bW5TcGFjaW5nKG1bM10pICsgJ14gJyArICRfXzIudXJsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV2YWxlZC5wdXNoKGNvbHVtblNwYWNpbmcobVszXSkgKyAnXicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZhbGVkID0gZXZhbGVkLmNvbmNhdChhZnRlckxpbmVzKGxpbmVzLCBsaW5lKSk7XG4gICAgICAgICAgICBldmFsZWQucHVzaCgnPSA9ID0gPSA9ID0gPSA9ID0nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZhbGVkLnB1c2goZnJhbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGV4LnN0YWNrID0gZXZhbGVkLmpvaW4oJ1xcbicpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IE1vZHVsZUV2YWx1YXRpb25FcnJvcih0aGlzLnVybCwgZXgpO1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gZ2V0VW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3IobmFtZSkge1xuICAgIGlmICghbmFtZSlcbiAgICAgIHJldHVybjtcbiAgICB2YXIgdXJsID0gTW9kdWxlU3RvcmUubm9ybWFsaXplKG5hbWUpO1xuICAgIHJldHVybiBtb2R1bGVJbnN0YW50aWF0b3JzW3VybF07XG4gIH1cbiAgO1xuICB2YXIgbW9kdWxlSW5zdGFuY2VzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdmFyIGxpdmVNb2R1bGVTZW50aW5lbCA9IHt9O1xuICBmdW5jdGlvbiBNb2R1bGUodW5jb2F0ZWRNb2R1bGUpIHtcbiAgICB2YXIgaXNMaXZlID0gYXJndW1lbnRzWzFdO1xuICAgIHZhciBjb2F0ZWRNb2R1bGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHVuY29hdGVkTW9kdWxlKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBnZXR0ZXIsXG4gICAgICAgICAgdmFsdWU7XG4gICAgICBpZiAoaXNMaXZlID09PSBsaXZlTW9kdWxlU2VudGluZWwpIHtcbiAgICAgICAgdmFyIGRlc2NyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih1bmNvYXRlZE1vZHVsZSwgbmFtZSk7XG4gICAgICAgIGlmIChkZXNjci5nZXQpXG4gICAgICAgICAgZ2V0dGVyID0gZGVzY3IuZ2V0O1xuICAgICAgfVxuICAgICAgaWYgKCFnZXR0ZXIpIHtcbiAgICAgICAgdmFsdWUgPSB1bmNvYXRlZE1vZHVsZVtuYW1lXTtcbiAgICAgICAgZ2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvYXRlZE1vZHVsZSwgbmFtZSwge1xuICAgICAgICBnZXQ6IGdldHRlcixcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgT2JqZWN0LnByZXZlbnRFeHRlbnNpb25zKGNvYXRlZE1vZHVsZSk7XG4gICAgcmV0dXJuIGNvYXRlZE1vZHVsZTtcbiAgfVxuICB2YXIgTW9kdWxlU3RvcmUgPSB7XG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbihuYW1lLCByZWZlcmVyTmFtZSwgcmVmZXJlckFkZHJlc3MpIHtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ21vZHVsZSBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIG5vdCAnICsgdHlwZW9mIG5hbWUpO1xuICAgICAgaWYgKGlzQWJzb2x1dGUobmFtZSkpXG4gICAgICAgIHJldHVybiBjYW5vbmljYWxpemVVcmwobmFtZSk7XG4gICAgICBpZiAoL1teXFwuXVxcL1xcLlxcLlxcLy8udGVzdChuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBuYW1lIGVtYmVkcyAvLi4vOiAnICsgbmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAobmFtZVswXSA9PT0gJy4nICYmIHJlZmVyZXJOYW1lKVxuICAgICAgICByZXR1cm4gcmVzb2x2ZVVybChyZWZlcmVyTmFtZSwgbmFtZSk7XG4gICAgICByZXR1cm4gY2Fub25pY2FsaXplVXJsKG5hbWUpO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbihub3JtYWxpemVkTmFtZSkge1xuICAgICAgdmFyIG0gPSBnZXRVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSk7XG4gICAgICBpZiAoIW0pXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB2YXIgbW9kdWxlSW5zdGFuY2UgPSBtb2R1bGVJbnN0YW5jZXNbbS51cmxdO1xuICAgICAgaWYgKG1vZHVsZUluc3RhbmNlKVxuICAgICAgICByZXR1cm4gbW9kdWxlSW5zdGFuY2U7XG4gICAgICBtb2R1bGVJbnN0YW5jZSA9IE1vZHVsZShtLmdldFVuY29hdGVkTW9kdWxlKCksIGxpdmVNb2R1bGVTZW50aW5lbCk7XG4gICAgICByZXR1cm4gbW9kdWxlSW5zdGFuY2VzW20udXJsXSA9IG1vZHVsZUluc3RhbmNlO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihub3JtYWxpemVkTmFtZSwgbW9kdWxlKSB7XG4gICAgICBub3JtYWxpemVkTmFtZSA9IFN0cmluZyhub3JtYWxpemVkTmFtZSk7XG4gICAgICBtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSA9IG5ldyBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgICB9KTtcbiAgICAgIG1vZHVsZUluc3RhbmNlc1tub3JtYWxpemVkTmFtZV0gPSBtb2R1bGU7XG4gICAgfSxcbiAgICBnZXQgYmFzZVVSTCgpIHtcbiAgICAgIHJldHVybiBiYXNlVVJMO1xuICAgIH0sXG4gICAgc2V0IGJhc2VVUkwodikge1xuICAgICAgYmFzZVVSTCA9IFN0cmluZyh2KTtcbiAgICB9LFxuICAgIHJlZ2lzdGVyTW9kdWxlOiBmdW5jdGlvbihuYW1lLCBkZXBzLCBmdW5jKSB7XG4gICAgICB2YXIgbm9ybWFsaXplZE5hbWUgPSBNb2R1bGVTdG9yZS5ub3JtYWxpemUobmFtZSk7XG4gICAgICBpZiAobW9kdWxlSW5zdGFudGlhdG9yc1tub3JtYWxpemVkTmFtZV0pXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZHVwbGljYXRlIG1vZHVsZSBuYW1lZCAnICsgbm9ybWFsaXplZE5hbWUpO1xuICAgICAgbW9kdWxlSW5zdGFudGlhdG9yc1tub3JtYWxpemVkTmFtZV0gPSBuZXcgVW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3Iobm9ybWFsaXplZE5hbWUsIGZ1bmMpO1xuICAgIH0sXG4gICAgYnVuZGxlU3RvcmU6IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKG5hbWUsIGRlcHMsIGZ1bmMpIHtcbiAgICAgIGlmICghZGVwcyB8fCAhZGVwcy5sZW5ndGggJiYgIWZ1bmMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJNb2R1bGUobmFtZSwgZGVwcywgZnVuYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1bmRsZVN0b3JlW25hbWVdID0ge1xuICAgICAgICAgIGRlcHM6IGRlcHMsXG4gICAgICAgICAgZXhlY3V0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJF9fMiA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHZhciBkZXBNYXAgPSB7fTtcbiAgICAgICAgICAgIGRlcHMuZm9yRWFjaChmdW5jdGlvbihkZXAsIGluZGV4KSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZXBNYXBbZGVwXSA9ICRfXzJbaW5kZXhdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcmVnaXN0cnlFbnRyeSA9IGZ1bmMuY2FsbCh0aGlzLCBkZXBNYXApO1xuICAgICAgICAgICAgcmVnaXN0cnlFbnRyeS5leGVjdXRlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVnaXN0cnlFbnRyeS5leHBvcnRzO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGdldEFub255bW91c01vZHVsZTogZnVuY3Rpb24oZnVuYykge1xuICAgICAgcmV0dXJuIG5ldyBNb2R1bGUoZnVuYygpLCBsaXZlTW9kdWxlU2VudGluZWwpO1xuICAgIH1cbiAgfTtcbiAgdmFyIG1vZHVsZVN0b3JlTW9kdWxlID0gbmV3IE1vZHVsZSh7TW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlfSk7XG4gIE1vZHVsZVN0b3JlLnNldCgnQHRyYWNldXIvc3JjL3J1bnRpbWUvTW9kdWxlU3RvcmUuanMnLCBtb2R1bGVTdG9yZU1vZHVsZSk7XG4gIHZhciBzZXR1cEdsb2JhbHMgPSAkdHJhY2V1clJ1bnRpbWUuc2V0dXBHbG9iYWxzO1xuICAkdHJhY2V1clJ1bnRpbWUuc2V0dXBHbG9iYWxzID0gZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG4gIH07XG4gICR0cmFjZXVyUnVudGltZS5Nb2R1bGVTdG9yZSA9IE1vZHVsZVN0b3JlO1xuICAkdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUgPSBNb2R1bGVTdG9yZS5yZWdpc3Rlck1vZHVsZS5iaW5kKE1vZHVsZVN0b3JlKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSA9IE1vZHVsZVN0b3JlLmdldDtcbiAgJHRyYWNldXJSdW50aW1lLnNldE1vZHVsZSA9IE1vZHVsZVN0b3JlLnNldDtcbiAgJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUgPSBNb2R1bGVTdG9yZS5ub3JtYWxpemU7XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbmV3LXVuaXF1ZS1zdHJpbmcuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbmV3LXVuaXF1ZS1zdHJpbmcuanNcIjtcbiAgdmFyIHJhbmRvbSA9IE1hdGgucmFuZG9tO1xuICB2YXIgY291bnRlciA9IERhdGUubm93KCkgJSAxZTk7XG4gIGZ1bmN0aW9uIG5ld1VuaXF1ZVN0cmluZygpIHtcbiAgICByZXR1cm4gJ19fJCcgKyAocmFuZG9tKCkgKiAxZTkgPj4+IDEpICsgJyQnICsgKytjb3VudGVyICsgJyRfXyc7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBuZXdVbmlxdWVTdHJpbmc7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2hhcy1uYXRpdmUtc3ltYm9scy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9oYXMtbmF0aXZlLXN5bWJvbHMuanNcIjtcbiAgdmFyIHYgPSAhIU9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgJiYgdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJztcbiAgZnVuY3Rpb24gaGFzTmF0aXZlU3ltYm9sKCkge1xuICAgIHJldHVybiB2O1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gaGFzTmF0aXZlU3ltYm9sO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N5bWJvbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zeW1ib2xzLmpzXCI7XG4gIHZhciBuZXdVbmlxdWVTdHJpbmcgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vbmV3LXVuaXF1ZS1zdHJpbmcuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N5bWJvbHMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBoYXNOYXRpdmVTeW1ib2wgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zeW1ib2xzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgJGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZnJlZXplID0gT2JqZWN0LmZyZWV6ZTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gIHZhciAka2V5cyA9IE9iamVjdC5rZXlzO1xuICB2YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgZnVuY3Rpb24gbm9uRW51bSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgfVxuICB2YXIgc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eSA9IG5ld1VuaXF1ZVN0cmluZygpO1xuICB2YXIgc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eSA9IG5ld1VuaXF1ZVN0cmluZygpO1xuICB2YXIgc3ltYm9sRGF0YVByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xWYWx1ZXMgPSAkY3JlYXRlKG51bGwpO1xuICB2YXIgU3ltYm9sSW1wbCA9IGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuICAgIHZhciB2YWx1ZSA9IG5ldyBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbik7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN5bWJvbEltcGwpKVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCdTeW1ib2wgY2Fubm90IGJlIG5ld1xcJ2VkJyk7XG4gIH07XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xJbXBsLnByb3RvdHlwZSwgJ2NvbnN0cnVjdG9yJywgbm9uRW51bShTeW1ib2xJbXBsKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xJbXBsLnByb3RvdHlwZSwgJ3RvU3RyaW5nJywgbm9uRW51bShmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ltYm9sVmFsdWUgPSB0aGlzW3N5bWJvbERhdGFQcm9wZXJ0eV07XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICB9KSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xJbXBsLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCBub25FbnVtKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgJFR5cGVFcnJvcignQ29udmVyc2lvbiBmcm9tIHN5bWJvbCB0byBzdHJpbmcnKTtcbiAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gIH0pKTtcbiAgZnVuY3Rpb24gU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pIHtcbiAgICB2YXIga2V5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERhdGFQcm9wZXJ0eSwge3ZhbHVlOiB0aGlzfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbEludGVybmFsUHJvcGVydHksIHt2YWx1ZToga2V5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHksIHt2YWx1ZTogZGVzY3JpcHRpb259KTtcbiAgICAkZnJlZXplKHRoaXMpO1xuICAgIHN5bWJvbFZhbHVlc1trZXldID0gdGhpcztcbiAgfVxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbEltcGwpKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbFZhbHVlLnByb3RvdHlwZSwgJ3RvU3RyaW5nJywge1xuICAgIHZhbHVlOiBTeW1ib2xJbXBsLnByb3RvdHlwZS50b1N0cmluZyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbFZhbHVlLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCB7XG4gICAgdmFsdWU6IFN5bWJvbEltcGwucHJvdG90eXBlLnZhbHVlT2YsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRmcmVlemUoU3ltYm9sVmFsdWUucHJvdG90eXBlKTtcbiAgZnVuY3Rpb24gaXNTeW1ib2xTdHJpbmcocykge1xuICAgIHJldHVybiBzeW1ib2xWYWx1ZXNbc107XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlU3ltYm9sS2V5cyhhcnJheSkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghaXNTeW1ib2xTdHJpbmcoYXJyYXlbaV0pKSB7XG4gICAgICAgIHJ2LnB1c2goYXJyYXlbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpIHtcbiAgICByZXR1cm4gcmVtb3ZlU3ltYm9sS2V5cygkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpKTtcbiAgfVxuICBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuICAgIHJldHVybiByZW1vdmVTeW1ib2xLZXlzKCRrZXlzKG9iamVjdCkpO1xuICB9XG4gIGZ1bmN0aW9uIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xWYWx1ZXNbbmFtZXNbaV1dO1xuICAgICAgaWYgKHN5bWJvbCkge1xuICAgICAgICBydi5wdXNoKHN5bWJvbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFN5bWJvbChnbG9iYWwpIHtcbiAgICB2YXIgT2JqZWN0ID0gZ2xvYmFsLk9iamVjdDtcbiAgICBpZiAoIWhhc05hdGl2ZVN5bWJvbCgpKSB7XG4gICAgICBnbG9iYWwuU3ltYm9sID0gU3ltYm9sSW1wbDtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgICAgIE9iamVjdC5rZXlzID0ga2V5cztcbiAgICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdnZXRPd25Qcm9wZXJ0eVN5bWJvbHMnLCBub25FbnVtKGdldE93blByb3BlcnR5U3ltYm9scykpO1xuICAgIH1cbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wuaXRlcmF0b3IpIHtcbiAgICAgIGdsb2JhbC5TeW1ib2wuaXRlcmF0b3IgPSBnbG9iYWwuU3ltYm9sKCdTeW1ib2wuaXRlcmF0b3InKTtcbiAgICB9XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sLm9ic2VydmVyKSB7XG4gICAgICBnbG9iYWwuU3ltYm9sLm9ic2VydmVyID0gZ2xvYmFsLlN5bWJvbCgnU3ltYm9sLm9ic2VydmVyJyk7XG4gICAgfVxuICB9XG4gIHZhciBnID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiAodm9pZCAwKTtcbiAgcG9seWZpbGxTeW1ib2woZyk7XG4gIHZhciB0eXBlT2YgPSBoYXNOYXRpdmVTeW1ib2woKSA/IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gdHlwZW9mIHg7XG4gIH0gOiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIHggaW5zdGFuY2VvZiBTeW1ib2xWYWx1ZSA/ICdzeW1ib2wnIDogdHlwZW9mIHg7XG4gIH07XG4gIHJldHVybiB7Z2V0IHR5cGVvZigpIHtcbiAgICAgIHJldHVybiB0eXBlT2Y7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvdHlwZW9mLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvdHlwZW9mLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3N5bWJvbHNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3N5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3R5cGVvZi5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19zeW1ib2xzXzQ2X2pzX18udHlwZW9mO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9zeW1ib2xzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3N5bWJvbHMuanNcIjtcbiAgdmFyIHQgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL3R5cGVvZi5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3N5bWJvbHMuanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS50eXBlb2YgPSB0O1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlQ2xhc3MuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVDbGFzcy5qc1wiO1xuICB2YXIgJE9iamVjdCA9IE9iamVjdDtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciAkX18xID0gT2JqZWN0LFxuICAgICAgY3JlYXRlID0gJF9fMS5jcmVhdGUsXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzID0gJF9fMS5kZWZpbmVQcm9wZXJ0aWVzLFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xLmRlZmluZVByb3BlcnR5LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJF9fMS5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgICAgZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG4gIGZ1bmN0aW9uIGZvckVhY2hQcm9wZXJ0eUtleShvYmplY3QsIGYpIHtcbiAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCkuZm9yRWFjaChmKTtcbiAgICBpZiAoZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgICBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KS5mb3JFYWNoKGYpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBnZXREZXNjcmlwdG9ycyhvYmplY3QpIHtcbiAgICB2YXIgZGVzY3JpcHRvcnMgPSB7fTtcbiAgICBmb3JFYWNoUHJvcGVydHlLZXkob2JqZWN0LCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGRlc2NyaXB0b3JzW2tleV0gPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBrZXkpO1xuICAgICAgZGVzY3JpcHRvcnNba2V5XS5lbnVtZXJhYmxlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlc2NyaXB0b3JzO1xuICB9XG4gIHZhciBub25FbnVtID0ge2VudW1lcmFibGU6IGZhbHNlfTtcbiAgZnVuY3Rpb24gbWFrZVByb3BlcnRpZXNOb25FbnVtZXJhYmxlKG9iamVjdCkge1xuICAgIGZvckVhY2hQcm9wZXJ0eUtleShvYmplY3QsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgZGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIG5vbkVudW0pO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUNsYXNzKGN0b3IsIG9iamVjdCwgc3RhdGljT2JqZWN0LCBzdXBlckNsYXNzKSB7XG4gICAgZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY29uc3RydWN0b3InLCB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDMpIHtcbiAgICAgIGlmICh0eXBlb2Ygc3VwZXJDbGFzcyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgY3Rvci5fX3Byb3RvX18gPSBzdXBlckNsYXNzO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBjcmVhdGUoZ2V0UHJvdG9QYXJlbnQoc3VwZXJDbGFzcyksIGdldERlc2NyaXB0b3JzKG9iamVjdCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYWtlUHJvcGVydGllc05vbkVudW1lcmFibGUob2JqZWN0KTtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gb2JqZWN0O1xuICAgIH1cbiAgICBkZWZpbmVQcm9wZXJ0eShjdG9yLCAncHJvdG90eXBlJywge1xuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0aWVzKGN0b3IsIGdldERlc2NyaXB0b3JzKHN0YXRpY09iamVjdCkpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFByb3RvUGFyZW50KHN1cGVyQ2xhc3MpIHtcbiAgICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBwcm90b3R5cGUgPSBzdXBlckNsYXNzLnByb3RvdHlwZTtcbiAgICAgIGlmICgkT2JqZWN0KHByb3RvdHlwZSkgPT09IHByb3RvdHlwZSB8fCBwcm90b3R5cGUgPT09IG51bGwpXG4gICAgICAgIHJldHVybiBzdXBlckNsYXNzLnByb3RvdHlwZTtcbiAgICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCdzdXBlciBwcm90b3R5cGUgbXVzdCBiZSBhbiBPYmplY3Qgb3IgbnVsbCcpO1xuICAgIH1cbiAgICBpZiAoc3VwZXJDbGFzcyA9PT0gbnVsbClcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHRocm93IG5ldyAkVHlwZUVycm9yKChcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyArIFwiLlwiKSk7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVDbGFzcztcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zdXBlckNvbnN0cnVjdG9yLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJDb25zdHJ1Y3Rvci5qc1wiO1xuICBmdW5jdGlvbiBzdXBlckNvbnN0cnVjdG9yKGN0b3IpIHtcbiAgICByZXR1cm4gY3Rvci5fX3Byb3RvX187XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBzdXBlckNvbnN0cnVjdG9yO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyRGVzY3JpcHRvci5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyRGVzY3JpcHRvci5qc1wiO1xuICB2YXIgJF9fMCA9IE9iamVjdCxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9ICRfXzAuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgICAgZ2V0UHJvdG90eXBlT2YgPSAkX18wLmdldFByb3RvdHlwZU9mO1xuICBmdW5jdGlvbiBzdXBlckRlc2NyaXB0b3IoaG9tZU9iamVjdCwgbmFtZSkge1xuICAgIHZhciBwcm90byA9IGdldFByb3RvdHlwZU9mKGhvbWVPYmplY3QpO1xuICAgIGRvIHtcbiAgICAgIHZhciByZXN1bHQgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG8sIG5hbWUpO1xuICAgICAgaWYgKHJlc3VsdClcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHByb3RvID0gZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIH0gd2hpbGUgKHByb3RvKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gc3VwZXJEZXNjcmlwdG9yO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyR2V0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJHZXQuanNcIjtcbiAgdmFyIHN1cGVyRGVzY3JpcHRvciA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3N1cGVyRGVzY3JpcHRvci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJHZXQuanNcIikpLmRlZmF1bHQ7XG4gIGZ1bmN0aW9uIHN1cGVyR2V0KHNlbGYsIGhvbWVPYmplY3QsIG5hbWUpIHtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHN1cGVyRGVzY3JpcHRvcihob21lT2JqZWN0LCBuYW1lKTtcbiAgICBpZiAoZGVzY3JpcHRvcikge1xuICAgICAgdmFyIHZhbHVlID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgaWYgKCFkZXNjcmlwdG9yLmdldClcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgcmV0dXJuIGRlc2NyaXB0b3IuZ2V0LmNhbGwoc2VsZik7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBzdXBlckdldDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zdXBlclNldC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyU2V0LmpzXCI7XG4gIHZhciBzdXBlckRlc2NyaXB0b3IgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9zdXBlckRlc2NyaXB0b3IuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyU2V0LmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgZnVuY3Rpb24gc3VwZXJTZXQoc2VsZiwgaG9tZU9iamVjdCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHN1cGVyRGVzY3JpcHRvcihob21lT2JqZWN0LCBuYW1lKTtcbiAgICBpZiAoZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgZGVzY3JpcHRvci5zZXQuY2FsbChzZWxmLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHRocm93ICRUeXBlRXJyb3IoKFwic3VwZXIgaGFzIG5vIHNldHRlciAnXCIgKyBuYW1lICsgXCInLlwiKSk7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBzdXBlclNldDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvY2xhc3Nlcy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9jbGFzc2VzLmpzXCI7XG4gIHZhciBjcmVhdGVDbGFzcyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvY3JlYXRlQ2xhc3MuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9jbGFzc2VzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgc3VwZXJDb25zdHJ1Y3RvciA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvc3VwZXJDb25zdHJ1Y3Rvci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NsYXNzZXMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBzdXBlckdldCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvc3VwZXJHZXQuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9jbGFzc2VzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgc3VwZXJTZXQgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL3N1cGVyU2V0LmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvY2xhc3Nlcy5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzID0gY3JlYXRlQ2xhc3M7XG4gICR0cmFjZXVyUnVudGltZS5zdXBlckNvbnN0cnVjdG9yID0gc3VwZXJDb25zdHJ1Y3RvcjtcbiAgJHRyYWNldXJSdW50aW1lLnN1cGVyR2V0ID0gc3VwZXJHZXQ7XG4gICR0cmFjZXVyUnVudGltZS5zdXBlclNldCA9IHN1cGVyU2V0O1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZXhwb3J0U3Rhci5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2V4cG9ydFN0YXIuanNcIjtcbiAgdmFyICRfXzEgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzEuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICBmdW5jdGlvbiBleHBvcnRTdGFyKG9iamVjdCkge1xuICAgIHZhciAkX18yID0gYXJndW1lbnRzLFxuICAgICAgICAkX18zID0gZnVuY3Rpb24oaSkge1xuICAgICAgICAgIHZhciBtb2QgPSAkX18yW2ldO1xuICAgICAgICAgIHZhciBuYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXMobW9kKTtcbiAgICAgICAgICB2YXIgJF9fNSA9IGZ1bmN0aW9uKGopIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbal07XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ19fZXNNb2R1bGUnIHx8IG5hbWUgPT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwge1xuICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RbbmFtZV07XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICRfXzY7XG4gICAgICAgICAgJF9fNDogZm9yICh2YXIgaiA9IDA7IGogPCBuYW1lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgJF9fNiA9ICRfXzUoaik7XG4gICAgICAgICAgICBzd2l0Y2ggKCRfXzYpIHtcbiAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlICRfXzQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAkX18zKGkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gZXhwb3J0U3RhcjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZXhwb3J0U3Rhci5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9leHBvcnRTdGFyLmpzXCI7XG4gIHZhciBleHBvcnRTdGFyID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9leHBvcnRTdGFyLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZXhwb3J0U3Rhci5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLmV4cG9ydFN0YXIgPSBleHBvcnRTdGFyO1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUtc3ltYm9sLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUtc3ltYm9sLmpzXCI7XG4gIHZhciBuZXdVbmlxdWVTdHJpbmcgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9uZXctdW5pcXVlLXN0cmluZy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUtc3ltYm9sLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgJFN5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgPyBTeW1ib2wgOiB1bmRlZmluZWQ7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scztcbiAgdmFyICRjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuICB2YXIgcHJpdmF0ZU5hbWVzID0gJGNyZWF0ZShudWxsKTtcbiAgZnVuY3Rpb24gaXNQcml2YXRlU3ltYm9sKHMpIHtcbiAgICByZXR1cm4gcHJpdmF0ZU5hbWVzW3NdO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICB2YXIgcyA9ICgkU3ltYm9sIHx8IG5ld1VuaXF1ZVN0cmluZykoKTtcbiAgICBwcml2YXRlTmFtZXNbc10gPSB0cnVlO1xuICAgIHJldHVybiBzO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gaGFzUHJpdmF0ZShvYmosIHN5bSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgc3ltKTtcbiAgfVxuICA7XG4gIGZ1bmN0aW9uIGRlbGV0ZVByaXZhdGUob2JqLCBzeW0pIHtcbiAgICBpZiAoIWhhc1ByaXZhdGUob2JqLCBzeW0pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRlbGV0ZSBvYmpbc3ltXTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICA7XG4gIGZ1bmN0aW9uIHNldFByaXZhdGUob2JqLCBzeW0sIHZhbCkge1xuICAgIG9ialtzeW1dID0gdmFsO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gZ2V0UHJpdmF0ZShvYmosIHN5bSkge1xuICAgIHZhciB2YWwgPSBvYmpbc3ltXTtcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgc3ltKSA/IHZhbCA6IHVuZGVmaW5lZDtcbiAgfVxuICA7XG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgaWYgKCRnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KSB7XG4gICAgICAgIHZhciBydiA9IFtdO1xuICAgICAgICB2YXIgc3ltYm9scyA9ICRnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHN5bWJvbCA9IHN5bWJvbHNbaV07XG4gICAgICAgICAgaWYgKCFpc1ByaXZhdGVTeW1ib2woc3ltYm9sKSkge1xuICAgICAgICAgICAgcnYucHVzaChzeW1ib2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIGdldCBpc1ByaXZhdGVTeW1ib2woKSB7XG4gICAgICByZXR1cm4gaXNQcml2YXRlU3ltYm9sO1xuICAgIH0sXG4gICAgZ2V0IGNyZWF0ZVByaXZhdGVTeW1ib2woKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUHJpdmF0ZVN5bWJvbDtcbiAgICB9LFxuICAgIGdldCBoYXNQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIGhhc1ByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgZGVsZXRlUHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBkZWxldGVQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IHNldFByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gc2V0UHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBnZXRQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIGdldFByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgaW5pdCgpIHtcbiAgICAgIHJldHVybiBpbml0O1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS13ZWFrLW1hcC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcml2YXRlLXdlYWstbWFwLmpzXCI7XG4gIHZhciAkV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nID8gV2Vha01hcCA6IHVuZGVmaW5lZDtcbiAgZnVuY3Rpb24gaXNQcml2YXRlU3ltYm9sKHMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICByZXR1cm4gbmV3ICRXZWFrTWFwKCk7XG4gIH1cbiAgZnVuY3Rpb24gaGFzUHJpdmF0ZShvYmosIHN5bSkge1xuICAgIHJldHVybiBzeW0uaGFzKG9iaik7XG4gIH1cbiAgZnVuY3Rpb24gZGVsZXRlUHJpdmF0ZShvYmosIHN5bSkge1xuICAgIHJldHVybiBzeW0uZGVsZXRlKG9iaik7XG4gIH1cbiAgZnVuY3Rpb24gc2V0UHJpdmF0ZShvYmosIHN5bSwgdmFsKSB7XG4gICAgc3ltLnNldChvYmosIHZhbCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0UHJpdmF0ZShvYmosIHN5bSkge1xuICAgIHJldHVybiBzeW0uZ2V0KG9iaik7XG4gIH1cbiAgZnVuY3Rpb24gaW5pdCgpIHt9XG4gIHJldHVybiB7XG4gICAgZ2V0IGlzUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBpc1ByaXZhdGVTeW1ib2w7XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVQcml2YXRlU3ltYm9sO1xuICAgIH0sXG4gICAgZ2V0IGhhc1ByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gaGFzUHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBkZWxldGVQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZVByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgc2V0UHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBzZXRQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGdldFByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gZ2V0UHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBpbml0KCkge1xuICAgICAgcmV0dXJuIGluaXQ7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcml2YXRlLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUuanNcIjtcbiAgdmFyIHN5bSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3ByaXZhdGUtc3ltYm9sLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS5qc1wiKSk7XG4gIHZhciB3ZWFrID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vcHJpdmF0ZS13ZWFrLW1hcC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUuanNcIikpO1xuICB2YXIgaGFzV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nO1xuICB2YXIgbSA9IGhhc1dlYWtNYXAgPyB3ZWFrIDogc3ltO1xuICB2YXIgaXNQcml2YXRlU3ltYm9sID0gbS5pc1ByaXZhdGVTeW1ib2w7XG4gIHZhciBjcmVhdGVQcml2YXRlU3ltYm9sID0gbS5jcmVhdGVQcml2YXRlU3ltYm9sO1xuICB2YXIgaGFzUHJpdmF0ZSA9IG0uaGFzUHJpdmF0ZTtcbiAgdmFyIGRlbGV0ZVByaXZhdGUgPSBtLmRlbGV0ZVByaXZhdGU7XG4gIHZhciBzZXRQcml2YXRlID0gbS5zZXRQcml2YXRlO1xuICB2YXIgZ2V0UHJpdmF0ZSA9IG0uZ2V0UHJpdmF0ZTtcbiAgbS5pbml0KCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IGlzUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBpc1ByaXZhdGVTeW1ib2w7XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVQcml2YXRlU3ltYm9sO1xuICAgIH0sXG4gICAgZ2V0IGhhc1ByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gaGFzUHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBkZWxldGVQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZVByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgc2V0UHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBzZXRQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGdldFByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gZ2V0UHJpdmF0ZTtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvcHJvcGVyVGFpbENhbGxzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvcHJvcGVyVGFpbENhbGxzLmpzXCI7XG4gIHZhciAkX18wID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL3ByaXZhdGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3Byb3BlclRhaWxDYWxscy5qc1wiKSksXG4gICAgICBnZXRQcml2YXRlID0gJF9fMC5nZXRQcml2YXRlLFxuICAgICAgc2V0UHJpdmF0ZSA9ICRfXzAuc2V0UHJpdmF0ZSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX18wLmNyZWF0ZVByaXZhdGVTeW1ib2w7XG4gIHZhciAkYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbC5iaW5kKEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSk7XG4gIHZhciBDT05USU5VQVRJT05fVFlQRSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHZhciBpc1RhaWxSZWN1cnNpdmVOYW1lID0gbnVsbDtcbiAgZnVuY3Rpb24gY3JlYXRlQ29udGludWF0aW9uKG9wZXJhbmQsIHRoaXNBcmcsIGFyZ3NBcnJheSkge1xuICAgIHJldHVybiBbQ09OVElOVUFUSU9OX1RZUEUsIG9wZXJhbmQsIHRoaXNBcmcsIGFyZ3NBcnJheV07XG4gIH1cbiAgZnVuY3Rpb24gaXNDb250aW51YXRpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCAmJiBvYmplY3RbMF0gPT09IENPTlRJTlVBVElPTl9UWVBFO1xuICB9XG4gIGZ1bmN0aW9uICRiaW5kKG9wZXJhbmQsIHRoaXNBcmcsIGFyZ3MpIHtcbiAgICB2YXIgYXJnQXJyYXkgPSBbdGhpc0FyZ107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdBcnJheVtpICsgMV0gPSBhcmdzW2ldO1xuICAgIH1cbiAgICB2YXIgZnVuYyA9ICRhcHBseShGdW5jdGlvbi5wcm90b3R5cGUuYmluZCwgb3BlcmFuZCwgYXJnQXJyYXkpO1xuICAgIHJldHVybiBmdW5jO1xuICB9XG4gIGZ1bmN0aW9uICRjb25zdHJ1Y3QoZnVuYywgYXJnQXJyYXkpIHtcbiAgICB2YXIgb2JqZWN0ID0gbmV3ICgkYmluZChmdW5jLCBudWxsLCBhcmdBcnJheSkpO1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbiAgZnVuY3Rpb24gaXNUYWlsUmVjdXJzaXZlKGZ1bmMpIHtcbiAgICByZXR1cm4gISFnZXRQcml2YXRlKGZ1bmMsIGlzVGFpbFJlY3Vyc2l2ZU5hbWUpO1xuICB9XG4gIGZ1bmN0aW9uIHRhaWxDYWxsKGZ1bmMsIHRoaXNBcmcsIGFyZ0FycmF5KSB7XG4gICAgdmFyIGNvbnRpbnVhdGlvbiA9IGFyZ0FycmF5WzBdO1xuICAgIGlmIChpc0NvbnRpbnVhdGlvbihjb250aW51YXRpb24pKSB7XG4gICAgICBjb250aW51YXRpb24gPSAkYXBwbHkoZnVuYywgdGhpc0FyZywgY29udGludWF0aW9uWzNdKTtcbiAgICAgIHJldHVybiBjb250aW51YXRpb247XG4gICAgfVxuICAgIGNvbnRpbnVhdGlvbiA9IGNyZWF0ZUNvbnRpbnVhdGlvbihmdW5jLCB0aGlzQXJnLCBhcmdBcnJheSk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChpc1RhaWxSZWN1cnNpdmUoZnVuYykpIHtcbiAgICAgICAgY29udGludWF0aW9uID0gJGFwcGx5KGZ1bmMsIGNvbnRpbnVhdGlvblsyXSwgW2NvbnRpbnVhdGlvbl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWF0aW9uID0gJGFwcGx5KGZ1bmMsIGNvbnRpbnVhdGlvblsyXSwgY29udGludWF0aW9uWzNdKTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNDb250aW51YXRpb24oY29udGludWF0aW9uKSkge1xuICAgICAgICByZXR1cm4gY29udGludWF0aW9uO1xuICAgICAgfVxuICAgICAgZnVuYyA9IGNvbnRpbnVhdGlvblsxXTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY29uc3RydWN0KCkge1xuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKGlzVGFpbFJlY3Vyc2l2ZSh0aGlzKSkge1xuICAgICAgb2JqZWN0ID0gJGNvbnN0cnVjdCh0aGlzLCBbY3JlYXRlQ29udGludWF0aW9uKG51bGwsIG51bGwsIGFyZ3VtZW50cyldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0ID0gJGNvbnN0cnVjdCh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIHNldHVwUHJvcGVyVGFpbENhbGxzKCkge1xuICAgIGlzVGFpbFJlY3Vyc2l2ZU5hbWUgPSBjcmVhdGVQcml2YXRlU3ltYm9sKCk7XG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwgPSBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uKGZ1bmN0aW9uIGNhbGwodGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdCA9IHRhaWxDYWxsKGZ1bmN0aW9uKHRoaXNBcmcpIHtcbiAgICAgICAgdmFyIGFyZ0FycmF5ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgYXJnQXJyYXlbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb250aW51YXRpb24gPSBjcmVhdGVDb250aW51YXRpb24odGhpcywgdGhpc0FyZywgYXJnQXJyYXkpO1xuICAgICAgICByZXR1cm4gY29udGludWF0aW9uO1xuICAgICAgfSwgdGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5ID0gaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbihmdW5jdGlvbiBhcHBseSh0aGlzQXJnLCBhcmdBcnJheSkge1xuICAgICAgdmFyIHJlc3VsdCA9IHRhaWxDYWxsKGZ1bmN0aW9uKHRoaXNBcmcsIGFyZ0FycmF5KSB7XG4gICAgICAgIHZhciBjb250aW51YXRpb24gPSBjcmVhdGVDb250aW51YXRpb24odGhpcywgdGhpc0FyZywgYXJnQXJyYXkpO1xuICAgICAgICByZXR1cm4gY29udGludWF0aW9uO1xuICAgICAgfSwgdGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbihmdW5jKSB7XG4gICAgaWYgKGlzVGFpbFJlY3Vyc2l2ZU5hbWUgPT09IG51bGwpIHtcbiAgICAgIHNldHVwUHJvcGVyVGFpbENhbGxzKCk7XG4gICAgfVxuICAgIHNldFByaXZhdGUoZnVuYywgaXNUYWlsUmVjdXJzaXZlTmFtZSwgdHJ1ZSk7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBnZXQgY3JlYXRlQ29udGludWF0aW9uKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUNvbnRpbnVhdGlvbjtcbiAgICB9LFxuICAgIGdldCB0YWlsQ2FsbCgpIHtcbiAgICAgIHJldHVybiB0YWlsQ2FsbDtcbiAgICB9LFxuICAgIGdldCBjb25zdHJ1Y3QoKSB7XG4gICAgICByZXR1cm4gY29uc3RydWN0O1xuICAgIH0sXG4gICAgZ2V0IGluaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbjtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbi5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24uanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfcHJvcGVyVGFpbENhbGxzXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24uanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfcHJvcGVyVGFpbENhbGxzXzQ2X2pzX18uaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jYWxsLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY2FsbC5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3Byb3BlclRhaWxDYWxscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY2FsbC5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXy50YWlsQ2FsbDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jb250aW51YXRpb24uanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jb250aW51YXRpb24uanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfcHJvcGVyVGFpbENhbGxzXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NvbnRpbnVhdGlvbi5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXy5jcmVhdGVDb250aW51YXRpb247XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY29uc3RydWN0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY29uc3RydWN0LmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3Byb3BlclRhaWxDYWxsc180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vcHJvcGVyVGFpbENhbGxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jb25zdHJ1Y3QuanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfcHJvcGVyVGFpbENhbGxzXzQ2X2pzX18uY29uc3RydWN0O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJvcGVyVGFpbENhbGxzLmpzXCI7XG4gIHZhciBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9pbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJvcGVyVGFpbENhbGxzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgY2FsbCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvY2FsbC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3Byb3BlclRhaWxDYWxscy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGNvbnRpbnVhdGlvbiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvY29udGludWF0aW9uLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJvcGVyVGFpbENhbGxzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgY29uc3RydWN0ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jb25zdHJ1Y3QuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcm9wZXJUYWlsQ2FsbHMuanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS5pbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uID0gaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbjtcbiAgJHRyYWNldXJSdW50aW1lLmNhbGwgPSBjYWxsO1xuICAkdHJhY2V1clJ1bnRpbWUuY29udGludWF0aW9uID0gY29udGludWF0aW9uO1xuICAkdHJhY2V1clJ1bnRpbWUuY29uc3RydWN0ID0gY29uc3RydWN0O1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3JlbGF0aXZlUmVxdWlyZS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9yZWxhdGl2ZVJlcXVpcmUuanNcIjtcbiAgdmFyIHBhdGg7XG4gIGZ1bmN0aW9uIHJlbGF0aXZlUmVxdWlyZShjYWxsZXJQYXRoLCByZXF1aXJlZFBhdGgpIHtcbiAgICBwYXRoID0gcGF0aCB8fCB0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcmVxdWlyZSgncGF0aCcpO1xuICAgIGZ1bmN0aW9uIGlzRGlyZWN0b3J5KHBhdGgpIHtcbiAgICAgIHJldHVybiBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGgpIHtcbiAgICAgIHJldHVybiBwYXRoWzBdID09PSAnLyc7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzUmVsYXRpdmUocGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGhbMF0gPT09ICcuJztcbiAgICB9XG4gICAgaWYgKGlzRGlyZWN0b3J5KHJlcXVpcmVkUGF0aCkgfHwgaXNBYnNvbHV0ZShyZXF1aXJlZFBhdGgpKVxuICAgICAgcmV0dXJuO1xuICAgIHJldHVybiBpc1JlbGF0aXZlKHJlcXVpcmVkUGF0aCkgPyByZXF1aXJlKHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoY2FsbGVyUGF0aCksIHJlcXVpcmVkUGF0aCkpIDogcmVxdWlyZShyZXF1aXJlZFBhdGgpO1xuICB9XG4gICR0cmFjZXVyUnVudGltZS5yZXF1aXJlID0gcmVsYXRpdmVSZXF1aXJlO1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NoZWNrT2JqZWN0Q29lcmNpYmxlLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NoZWNrT2JqZWN0Q29lcmNpYmxlLmpzXCI7XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICBmdW5jdGlvbiBjaGVja09iamVjdENvZXJjaWJsZSh2KSB7XG4gICAgaWYgKHYgPT09IG51bGwgfHwgdiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgJFR5cGVFcnJvcignVmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhbiBPYmplY3QnKTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBjaGVja09iamVjdENvZXJjaWJsZTtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zcHJlYWQuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zcHJlYWQuanNcIjtcbiAgdmFyIGNoZWNrT2JqZWN0Q29lcmNpYmxlID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL2NoZWNrT2JqZWN0Q29lcmNpYmxlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zcHJlYWQuanNcIikpLmRlZmF1bHQ7XG4gIGZ1bmN0aW9uIHNwcmVhZCgpIHtcbiAgICB2YXIgcnYgPSBbXSxcbiAgICAgICAgaiA9IDAsXG4gICAgICAgIGl0ZXJSZXN1bHQ7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZVRvU3ByZWFkID0gY2hlY2tPYmplY3RDb2VyY2libGUoYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWVUb1NwcmVhZFtTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBzcHJlYWQgbm9uLWl0ZXJhYmxlIG9iamVjdC4nKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyID0gdmFsdWVUb1NwcmVhZFtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gICAgICB3aGlsZSAoIShpdGVyUmVzdWx0ID0gaXRlci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgcnZbaisrXSA9IGl0ZXJSZXN1bHQudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIHNwcmVhZDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3ByZWFkLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3NwcmVhZC5qc1wiO1xuICB2YXIgc3ByZWFkID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zcHJlYWQuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9zcHJlYWQuanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS5zcHJlYWQgPSBzcHJlYWQ7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pdGVyYXRvclRvQXJyYXkuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pdGVyYXRvclRvQXJyYXkuanNcIjtcbiAgZnVuY3Rpb24gaXRlcmF0b3JUb0FycmF5KGl0ZXIpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHRtcDtcbiAgICB3aGlsZSAoISh0bXAgPSBpdGVyLm5leHQoKSkuZG9uZSkge1xuICAgICAgcnZbaSsrXSA9IHRtcC52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gaXRlcmF0b3JUb0FycmF5O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9kZXN0cnVjdHVyaW5nLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2Rlc3RydWN0dXJpbmcuanNcIjtcbiAgdmFyIGl0ZXJhdG9yVG9BcnJheSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvaXRlcmF0b3JUb0FycmF5LmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZGVzdHJ1Y3R1cmluZy5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLml0ZXJhdG9yVG9BcnJheSA9IGl0ZXJhdG9yVG9BcnJheTtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2FzeW5jLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmMuanNcIjtcbiAgdmFyICRfXzEyID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL3ByaXZhdGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2FzeW5jLmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX18xMi5jcmVhdGVQcml2YXRlU3ltYm9sLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzEyLmdldFByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fMTIuc2V0UHJpdmF0ZTtcbiAgdmFyICRfXzExID0gT2JqZWN0LFxuICAgICAgY3JlYXRlID0gJF9fMTEuY3JlYXRlLFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xMS5kZWZpbmVQcm9wZXJ0eTtcbiAgdmFyIG9ic2VydmVOYW1lID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICBmdW5jdGlvbiBBc3luY0dlbmVyYXRvckZ1bmN0aW9uKCkge31cbiAgZnVuY3Rpb24gQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSgpIHt9XG4gIEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZTtcbiAgQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFzeW5jR2VuZXJhdG9yRnVuY3Rpb247XG4gIGRlZmluZVByb3BlcnR5KEFzeW5jR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIHtlbnVtZXJhYmxlOiBmYWxzZX0pO1xuICB2YXIgQXN5bmNHZW5lcmF0b3JDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQXN5bmNHZW5lcmF0b3JDb250ZXh0KG9ic2VydmVyKSB7XG4gICAgICB2YXIgJF9fMiA9IHRoaXM7XG4gICAgICB0aGlzLmRlY29yYXRlZE9ic2VydmVyID0gY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yKG9ic2VydmVyLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJF9fMi5kb25lID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kb25lID0gZmFsc2U7XG4gICAgICB0aGlzLmluUmV0dXJuID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShBc3luY0dlbmVyYXRvckNvbnRleHQsIHtcbiAgICAgIHRocm93OiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBpZiAoIXRoaXMuaW5SZXR1cm4pIHtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHlpZWxkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgICAgdGhpcy5pblJldHVybiA9IHRydWU7XG4gICAgICAgICAgdGhyb3cgdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gdGhpcy5kZWNvcmF0ZWRPYnNlcnZlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmluUmV0dXJuID0gdHJ1ZTtcbiAgICAgICAgICB0aHJvdyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgICAgIH0sXG4gICAgICB5aWVsZEZvcjogZnVuY3Rpb24ob2JzZXJ2YWJsZSkge1xuICAgICAgICB2YXIgY3R4ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIG9ic2VydmVGb3JFYWNoKG9ic2VydmFibGVbU3ltYm9sLm9ic2VydmVyXS5iaW5kKG9ic2VydmFibGUpLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmIChjdHguZG9uZSkge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gY3R4LmRlY29yYXRlZE9ic2VydmVyLm5leHQodmFsdWUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGN0eC5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgIGN0eC5kb25lID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSwge30pO1xuICB9KCk7XG4gIEFzeW5jR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlW1N5bWJvbC5vYnNlcnZlcl0gPSBmdW5jdGlvbihvYnNlcnZlcikge1xuICAgIHZhciBvYnNlcnZlID0gZ2V0UHJpdmF0ZSh0aGlzLCBvYnNlcnZlTmFtZSk7XG4gICAgdmFyIGN0eCA9IG5ldyBBc3luY0dlbmVyYXRvckNvbnRleHQob2JzZXJ2ZXIpO1xuICAgIHNjaGVkdWxlKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG9ic2VydmUoY3R4KTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIWN0eC5kb25lKSB7XG4gICAgICAgIGN0eC5kZWNvcmF0ZWRPYnNlcnZlci5yZXR1cm4odmFsdWUpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBpZiAoIWN0eC5kb25lKSB7XG4gICAgICAgIGN0eC5kZWNvcmF0ZWRPYnNlcnZlci50aHJvdyhlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGN0eC5kZWNvcmF0ZWRPYnNlcnZlcjtcbiAgfTtcbiAgZGVmaW5lUHJvcGVydHkoQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUsIFN5bWJvbC5vYnNlcnZlciwge2VudW1lcmFibGU6IGZhbHNlfSk7XG4gIGZ1bmN0aW9uIGluaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uT2JqZWN0KSB7XG4gICAgZnVuY3Rpb25PYmplY3QucHJvdG90eXBlID0gY3JlYXRlKEFzeW5jR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlKTtcbiAgICBmdW5jdGlvbk9iamVjdC5fX3Byb3RvX18gPSBBc3luY0dlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICAgIHJldHVybiBmdW5jdGlvbk9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlKG9ic2VydmUsIGZ1bmN0aW9uT2JqZWN0KSB7XG4gICAgZm9yICh2YXIgYXJncyA9IFtdLFxuICAgICAgICAkX18xMCA9IDI7ICRfXzEwIDwgYXJndW1lbnRzLmxlbmd0aDsgJF9fMTArKylcbiAgICAgIGFyZ3NbJF9fMTAgLSAyXSA9IGFyZ3VtZW50c1skX18xMF07XG4gICAgdmFyIG9iamVjdCA9IGNyZWF0ZShmdW5jdGlvbk9iamVjdC5wcm90b3R5cGUpO1xuICAgIHNldFByaXZhdGUob2JqZWN0LCBvYnNlcnZlTmFtZSwgb2JzZXJ2ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBvYnNlcnZlRm9yRWFjaChvYnNlcnZlLCBuZXh0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIGdlbmVyYXRvciA9IG9ic2VydmUoe1xuICAgICAgICBuZXh0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBuZXh0LmNhbGwoZ2VuZXJhdG9yLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRocm93OiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gc2NoZWR1bGUoYXN5bmNGKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmNGKTtcbiAgfVxuICB2YXIgZ2VuZXJhdG9yID0gU3ltYm9sKCk7XG4gIHZhciBvbkRvbmUgPSBTeW1ib2woKTtcbiAgdmFyIERlY29yYXRlZEdlbmVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIERlY29yYXRlZEdlbmVyYXRvcihfZ2VuZXJhdG9yLCBfb25Eb25lKSB7XG4gICAgICB0aGlzW2dlbmVyYXRvcl0gPSBfZ2VuZXJhdG9yO1xuICAgICAgdGhpc1tvbkRvbmVdID0gX29uRG9uZTtcbiAgICB9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKERlY29yYXRlZEdlbmVyYXRvciwge1xuICAgICAgbmV4dDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXNbZ2VuZXJhdG9yXS5uZXh0KHZhbHVlKTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkICYmIHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgdGhpc1tvbkRvbmVdLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG4gICAgICB0aHJvdzogZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgdGhpc1tvbkRvbmVdLmNhbGwodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzW2dlbmVyYXRvcl0udGhyb3coZXJyb3IpO1xuICAgICAgfSxcbiAgICAgIHJldHVybjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpc1tvbkRvbmVdLmNhbGwodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzW2dlbmVyYXRvcl0ucmV0dXJuKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9LCB7fSk7XG4gIH0oKTtcbiAgZnVuY3Rpb24gY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yKGdlbmVyYXRvciwgb25Eb25lKSB7XG4gICAgcmV0dXJuIG5ldyBEZWNvcmF0ZWRHZW5lcmF0b3IoZ2VuZXJhdG9yLCBvbkRvbmUpO1xuICB9XG4gIEFycmF5LnByb3RvdHlwZVtTeW1ib2wub2JzZXJ2ZXJdID0gZnVuY3Rpb24ob2JzZXJ2ZXIpIHtcbiAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgIHZhciBkZWNvcmF0ZWRPYnNlcnZlciA9IGNyZWF0ZURlY29yYXRlZEdlbmVyYXRvcihvYnNlcnZlciwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZG9uZSA9IHRydWU7XG4gICAgfSk7XG4gICAgdmFyICRfXzYgPSB0cnVlO1xuICAgIHZhciAkX183ID0gZmFsc2U7XG4gICAgdmFyICRfXzggPSB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAodmFyICRfXzQgPSB2b2lkIDAsXG4gICAgICAgICAgJF9fMyA9ICh0aGlzKVtTeW1ib2wuaXRlcmF0b3JdKCk7ICEoJF9fNiA9ICgkX180ID0gJF9fMy5uZXh0KCkpLmRvbmUpOyAkX182ID0gdHJ1ZSkge1xuICAgICAgICB2YXIgdmFsdWUgPSAkX180LnZhbHVlO1xuICAgICAgICB7XG4gICAgICAgICAgZGVjb3JhdGVkT2JzZXJ2ZXIubmV4dCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoICgkX185KSB7XG4gICAgICAkX183ID0gdHJ1ZTtcbiAgICAgICRfXzggPSAkX185O1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoISRfXzYgJiYgJF9fMy5yZXR1cm4gIT0gbnVsbCkge1xuICAgICAgICAgICRfXzMucmV0dXJuKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmICgkX183KSB7XG4gICAgICAgICAgdGhyb3cgJF9fODtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBkZWNvcmF0ZWRPYnNlcnZlci5yZXR1cm4oKTtcbiAgICByZXR1cm4gZGVjb3JhdGVkT2JzZXJ2ZXI7XG4gIH07XG4gIGRlZmluZVByb3BlcnR5KEFycmF5LnByb3RvdHlwZSwgU3ltYm9sLm9ic2VydmVyLCB7ZW51bWVyYWJsZTogZmFsc2V9KTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb247XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlQXN5bmNHZW5lcmF0b3JJbnN0YW5jZSgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlO1xuICAgIH0sXG4gICAgZ2V0IG9ic2VydmVGb3JFYWNoKCkge1xuICAgICAgcmV0dXJuIG9ic2VydmVGb3JFYWNoO1xuICAgIH0sXG4gICAgZ2V0IHNjaGVkdWxlKCkge1xuICAgICAgcmV0dXJuIHNjaGVkdWxlO1xuICAgIH0sXG4gICAgZ2V0IGNyZWF0ZURlY29yYXRlZEdlbmVyYXRvcigpIHtcbiAgICAgIHJldHVybiBjcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3I7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24uanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2FzeW5jLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbi5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19hc3luY180Nl9qc19fLmluaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2UuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3luYy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlQXN5bmNHZW5lcmF0b3JJbnN0YW5jZS5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19hc3luY180Nl9qc19fLmNyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2U7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvb2JzZXJ2ZUZvckVhY2guanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9vYnNlcnZlRm9yRWFjaC5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19hc3luY180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vYXN5bmMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL29ic2VydmVGb3JFYWNoLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18ub2JzZXJ2ZUZvckVhY2g7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc2NoZWR1bGUuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zY2hlZHVsZS5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19hc3luY180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vYXN5bmMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NjaGVkdWxlLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18uc2NoZWR1bGU7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3luYy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18uY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiO1xuICB2YXIgaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2luaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvYXN5bmMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvYXN5bmMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBvYnNlcnZlRm9yRWFjaCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvb2JzZXJ2ZUZvckVhY2guanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIHNjaGVkdWxlID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zY2hlZHVsZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2FzeW5jLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLmluaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uID0gaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb247XG4gICR0cmFjZXVyUnVudGltZS5jcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlID0gY3JlYXRlQXN5bmNHZW5lcmF0b3JJbnN0YW5jZTtcbiAgJHRyYWNldXJSdW50aW1lLm9ic2VydmVGb3JFYWNoID0gb2JzZXJ2ZUZvckVhY2g7XG4gICR0cmFjZXVyUnVudGltZS5zY2hlZHVsZSA9IHNjaGVkdWxlO1xuICAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yID0gY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yO1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZ2VuZXJhdG9ycy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2dlbmVyYXRvcnMuanNcIjtcbiAgdmFyICRfXzIgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZ2VuZXJhdG9ycy5qc1wiKSksXG4gICAgICBjcmVhdGVQcml2YXRlU3ltYm9sID0gJF9fMi5jcmVhdGVQcml2YXRlU3ltYm9sLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzIuZ2V0UHJpdmF0ZSxcbiAgICAgIHNldFByaXZhdGUgPSAkX18yLnNldFByaXZhdGU7XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICB2YXIgJF9fMSA9IE9iamVjdCxcbiAgICAgIGNyZWF0ZSA9ICRfXzEuY3JlYXRlLFxuICAgICAgZGVmaW5lUHJvcGVydGllcyA9ICRfXzEuZGVmaW5lUHJvcGVydGllcyxcbiAgICAgIGRlZmluZVByb3BlcnR5ID0gJF9fMS5kZWZpbmVQcm9wZXJ0eTtcbiAgZnVuY3Rpb24gbm9uRW51bSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgfVxuICB2YXIgU1RfTkVXQk9STiA9IDA7XG4gIHZhciBTVF9FWEVDVVRJTkcgPSAxO1xuICB2YXIgU1RfU1VTUEVOREVEID0gMjtcbiAgdmFyIFNUX0NMT1NFRCA9IDM7XG4gIHZhciBFTkRfU1RBVEUgPSAtMjtcbiAgdmFyIFJFVEhST1dfU1RBVEUgPSAtMztcbiAgZnVuY3Rpb24gZ2V0SW50ZXJuYWxFcnJvcihzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoJ1RyYWNldXIgY29tcGlsZXIgYnVnOiBpbnZhbGlkIHN0YXRlIGluIHN0YXRlIG1hY2hpbmU6ICcgKyBzdGF0ZSk7XG4gIH1cbiAgdmFyIFJFVFVSTl9TRU5USU5FTCA9IHt9O1xuICBmdW5jdGlvbiBHZW5lcmF0b3JDb250ZXh0KCkge1xuICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgIHRoaXMuR1N0YXRlID0gU1RfTkVXQk9STjtcbiAgICB0aGlzLnN0b3JlZEV4Y2VwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZpbmFsbHlGYWxsVGhyb3VnaCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnNlbnRfID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucmV0dXJuVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5vbGRSZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRyeVN0YWNrXyA9IFtdO1xuICB9XG4gIEdlbmVyYXRvckNvbnRleHQucHJvdG90eXBlID0ge1xuICAgIHB1c2hUcnk6IGZ1bmN0aW9uKGNhdGNoU3RhdGUsIGZpbmFsbHlTdGF0ZSkge1xuICAgICAgaWYgKGZpbmFsbHlTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgZmluYWxseUZhbGxUaHJvdWdoID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5U3RhY2tfLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKHRoaXMudHJ5U3RhY2tfW2ldLmNhdGNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZpbmFsbHlGYWxsVGhyb3VnaCA9IHRoaXMudHJ5U3RhY2tfW2ldLmNhdGNoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmaW5hbGx5RmFsbFRocm91Z2ggPT09IG51bGwpXG4gICAgICAgICAgZmluYWxseUZhbGxUaHJvdWdoID0gUkVUSFJPV19TVEFURTtcbiAgICAgICAgdGhpcy50cnlTdGFja18ucHVzaCh7XG4gICAgICAgICAgZmluYWxseTogZmluYWxseVN0YXRlLFxuICAgICAgICAgIGZpbmFsbHlGYWxsVGhyb3VnaDogZmluYWxseUZhbGxUaHJvdWdoXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGNhdGNoU3RhdGUgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50cnlTdGFja18ucHVzaCh7Y2F0Y2g6IGNhdGNoU3RhdGV9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBvcFRyeTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnRyeVN0YWNrXy5wb3AoKTtcbiAgICB9LFxuICAgIG1heWJlVW5jYXRjaGFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc3RvcmVkRXhjZXB0aW9uID09PSBSRVRVUk5fU0VOVElORUwpIHtcbiAgICAgICAgdGhyb3cgUkVUVVJOX1NFTlRJTkVMO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0IHNlbnQoKSB7XG4gICAgICB0aGlzLm1heWJlVGhyb3coKTtcbiAgICAgIHJldHVybiB0aGlzLnNlbnRfO1xuICAgIH0sXG4gICAgc2V0IHNlbnQodikge1xuICAgICAgdGhpcy5zZW50XyA9IHY7XG4gICAgfSxcbiAgICBnZXQgc2VudElnbm9yZVRocm93KCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2VudF87XG4gICAgfSxcbiAgICBtYXliZVRocm93OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmFjdGlvbiA9PT0gJ3Rocm93Jykge1xuICAgICAgICB0aGlzLmFjdGlvbiA9ICduZXh0JztcbiAgICAgICAgdGhyb3cgdGhpcy5zZW50XztcbiAgICAgIH1cbiAgICB9LFxuICAgIGVuZDogZnVuY3Rpb24oKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUpIHtcbiAgICAgICAgY2FzZSBFTkRfU1RBVEU6XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNhc2UgUkVUSFJPV19TVEFURTpcbiAgICAgICAgICB0aHJvdyB0aGlzLnN0b3JlZEV4Y2VwdGlvbjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBnZXRJbnRlcm5hbEVycm9yKHRoaXMuc3RhdGUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgaGFuZGxlRXhjZXB0aW9uOiBmdW5jdGlvbihleCkge1xuICAgICAgdGhpcy5HU3RhdGUgPSBTVF9DTE9TRUQ7XG4gICAgICB0aGlzLnN0YXRlID0gRU5EX1NUQVRFO1xuICAgICAgdGhyb3cgZXg7XG4gICAgfSxcbiAgICB3cmFwWWllbGRTdGFyOiBmdW5jdGlvbihpdGVyYXRvcikge1xuICAgICAgdmFyIGN0eCA9IHRoaXM7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXh0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yLm5leHQodik7XG4gICAgICAgIH0sXG4gICAgICAgIHRocm93OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICBpZiAoZSA9PT0gUkVUVVJOX1NFTlRJTkVMKSB7XG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IucmV0dXJuKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLnJldHVybihjdHgucmV0dXJuVmFsdWUpO1xuICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgY3R4LnJldHVyblZhbHVlID0gY3R4Lm9sZFJldHVyblZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY3R4LnJldHVyblZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGl0ZXJhdG9yLnRocm93KSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IudGhyb3coZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZXJhdG9yLnJldHVybiAmJiBpdGVyYXRvci5yZXR1cm4oKTtcbiAgICAgICAgICB0aHJvdyAkVHlwZUVycm9yKCdJbm5lciBpdGVyYXRvciBkb2VzIG5vdCBoYXZlIGEgdGhyb3cgbWV0aG9kJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBuZXh0T3JUaHJvdyhjdHgsIG1vdmVOZXh0LCBhY3Rpb24sIHgpIHtcbiAgICBzd2l0Y2ggKGN0eC5HU3RhdGUpIHtcbiAgICAgIGNhc2UgU1RfRVhFQ1VUSU5HOlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKFwiXFxcIlwiICsgYWN0aW9uICsgXCJcXFwiIG9uIGV4ZWN1dGluZyBnZW5lcmF0b3JcIikpO1xuICAgICAgY2FzZSBTVF9DTE9TRUQ6XG4gICAgICAgIGlmIChhY3Rpb24gPT0gJ25leHQnKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBkb25lOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCA9PT0gUkVUVVJOX1NFTlRJTkVMKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlOiBjdHgucmV0dXJuVmFsdWUsXG4gICAgICAgICAgICBkb25lOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyB4O1xuICAgICAgY2FzZSBTVF9ORVdCT1JOOlxuICAgICAgICBpZiAoYWN0aW9uID09PSAndGhyb3cnKSB7XG4gICAgICAgICAgY3R4LkdTdGF0ZSA9IFNUX0NMT1NFRDtcbiAgICAgICAgICBpZiAoeCA9PT0gUkVUVVJOX1NFTlRJTkVMKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogY3R4LnJldHVyblZhbHVlLFxuICAgICAgICAgICAgICBkb25lOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyB4O1xuICAgICAgICB9XG4gICAgICAgIGlmICh4ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhyb3cgJFR5cGVFcnJvcignU2VudCB2YWx1ZSB0byBuZXdib3JuIGdlbmVyYXRvcicpO1xuICAgICAgY2FzZSBTVF9TVVNQRU5ERUQ6XG4gICAgICAgIGN0eC5HU3RhdGUgPSBTVF9FWEVDVVRJTkc7XG4gICAgICAgIGN0eC5hY3Rpb24gPSBhY3Rpb247XG4gICAgICAgIGN0eC5zZW50ID0geDtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhbHVlID0gbW92ZU5leHQoY3R4KTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBpZiAoZXggPT09IFJFVFVSTl9TRU5USU5FTCkge1xuICAgICAgICAgICAgdmFsdWUgPSBjdHg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZG9uZSA9IHZhbHVlID09PSBjdHg7XG4gICAgICAgIGlmIChkb25lKVxuICAgICAgICAgIHZhbHVlID0gY3R4LnJldHVyblZhbHVlO1xuICAgICAgICBjdHguR1N0YXRlID0gZG9uZSA/IFNUX0NMT1NFRCA6IFNUX1NVU1BFTkRFRDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgZG9uZTogZG9uZVxuICAgICAgICB9O1xuICAgIH1cbiAgfVxuICB2YXIgY3R4TmFtZSA9IGNyZWF0ZVByaXZhdGVTeW1ib2woKTtcbiAgdmFyIG1vdmVOZXh0TmFtZSA9IGNyZWF0ZVByaXZhdGVTeW1ib2woKTtcbiAgZnVuY3Rpb24gR2VuZXJhdG9yRnVuY3Rpb24oKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSgpIHt9XG4gIEdlbmVyYXRvckZ1bmN0aW9uLnByb3RvdHlwZSA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICBkZWZpbmVQcm9wZXJ0eShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSwgJ2NvbnN0cnVjdG9yJywgbm9uRW51bShHZW5lcmF0b3JGdW5jdGlvbikpO1xuICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLFxuICAgIG5leHQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHJldHVybiBuZXh0T3JUaHJvdyhnZXRQcml2YXRlKHRoaXMsIGN0eE5hbWUpLCBnZXRQcml2YXRlKHRoaXMsIG1vdmVOZXh0TmFtZSksICduZXh0Jywgdik7XG4gICAgfSxcbiAgICB0aHJvdzogZnVuY3Rpb24odikge1xuICAgICAgcmV0dXJuIG5leHRPclRocm93KGdldFByaXZhdGUodGhpcywgY3R4TmFtZSksIGdldFByaXZhdGUodGhpcywgbW92ZU5leHROYW1lKSwgJ3Rocm93Jywgdik7XG4gICAgfSxcbiAgICByZXR1cm46IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHZhciBjdHggPSBnZXRQcml2YXRlKHRoaXMsIGN0eE5hbWUpO1xuICAgICAgY3R4Lm9sZFJldHVyblZhbHVlID0gY3R4LnJldHVyblZhbHVlO1xuICAgICAgY3R4LnJldHVyblZhbHVlID0gdjtcbiAgICAgIHJldHVybiBuZXh0T3JUaHJvdyhjdHgsIGdldFByaXZhdGUodGhpcywgbW92ZU5leHROYW1lKSwgJ3Rocm93JywgUkVUVVJOX1NFTlRJTkVMKTtcbiAgICB9XG4gIH07XG4gIGRlZmluZVByb3BlcnRpZXMoR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtlbnVtZXJhYmxlOiBmYWxzZX0sXG4gICAgbmV4dDoge2VudW1lcmFibGU6IGZhbHNlfSxcbiAgICB0aHJvdzoge2VudW1lcmFibGU6IGZhbHNlfSxcbiAgICByZXR1cm46IHtlbnVtZXJhYmxlOiBmYWxzZX1cbiAgfSk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgbm9uRW51bShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSkpO1xuICBmdW5jdGlvbiBjcmVhdGVHZW5lcmF0b3JJbnN0YW5jZShpbm5lckZ1bmN0aW9uLCBmdW5jdGlvbk9iamVjdCwgc2VsZikge1xuICAgIHZhciBtb3ZlTmV4dCA9IGdldE1vdmVOZXh0KGlubmVyRnVuY3Rpb24sIHNlbGYpO1xuICAgIHZhciBjdHggPSBuZXcgR2VuZXJhdG9yQ29udGV4dCgpO1xuICAgIHZhciBvYmplY3QgPSBjcmVhdGUoZnVuY3Rpb25PYmplY3QucHJvdG90eXBlKTtcbiAgICBzZXRQcml2YXRlKG9iamVjdCwgY3R4TmFtZSwgY3R4KTtcbiAgICBzZXRQcml2YXRlKG9iamVjdCwgbW92ZU5leHROYW1lLCBtb3ZlTmV4dCk7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBpbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb25PYmplY3QpIHtcbiAgICBmdW5jdGlvbk9iamVjdC5wcm90b3R5cGUgPSBjcmVhdGUoR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlKTtcbiAgICBmdW5jdGlvbk9iamVjdC5fX3Byb3RvX18gPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZTtcbiAgICByZXR1cm4gZnVuY3Rpb25PYmplY3Q7XG4gIH1cbiAgZnVuY3Rpb24gQXN5bmNGdW5jdGlvbkNvbnRleHQoKSB7XG4gICAgR2VuZXJhdG9yQ29udGV4dC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZXJyID0gdW5kZWZpbmVkO1xuICAgIHZhciBjdHggPSB0aGlzO1xuICAgIGN0eC5yZXN1bHQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGN0eC5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIGN0eC5yZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gIH1cbiAgQXN5bmNGdW5jdGlvbkNvbnRleHQucHJvdG90eXBlID0gY3JlYXRlKEdlbmVyYXRvckNvbnRleHQucHJvdG90eXBlKTtcbiAgQXN5bmNGdW5jdGlvbkNvbnRleHQucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHN3aXRjaCAodGhpcy5zdGF0ZSkge1xuICAgICAgY2FzZSBFTkRfU1RBVEU6XG4gICAgICAgIHRoaXMucmVzb2x2ZSh0aGlzLnJldHVyblZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJFVEhST1dfU1RBVEU6XG4gICAgICAgIHRoaXMucmVqZWN0KHRoaXMuc3RvcmVkRXhjZXB0aW9uKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLnJlamVjdChnZXRJbnRlcm5hbEVycm9yKHRoaXMuc3RhdGUpKTtcbiAgICB9XG4gIH07XG4gIEFzeW5jRnVuY3Rpb25Db250ZXh0LnByb3RvdHlwZS5oYW5kbGVFeGNlcHRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlID0gUkVUSFJPV19TVEFURTtcbiAgfTtcbiAgZnVuY3Rpb24gYXN5bmNXcmFwKGlubmVyRnVuY3Rpb24sIHNlbGYpIHtcbiAgICB2YXIgbW92ZU5leHQgPSBnZXRNb3ZlTmV4dChpbm5lckZ1bmN0aW9uLCBzZWxmKTtcbiAgICB2YXIgY3R4ID0gbmV3IEFzeW5jRnVuY3Rpb25Db250ZXh0KCk7XG4gICAgY3R4LmNyZWF0ZUNhbGxiYWNrID0gZnVuY3Rpb24obmV3U3RhdGUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBjdHguc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICAgICAgY3R4LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIG1vdmVOZXh0KGN0eCk7XG4gICAgICB9O1xuICAgIH07XG4gICAgY3R4LmVycmJhY2sgPSBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGhhbmRsZUNhdGNoKGN0eCwgZXJyKTtcbiAgICAgIG1vdmVOZXh0KGN0eCk7XG4gICAgfTtcbiAgICBtb3ZlTmV4dChjdHgpO1xuICAgIHJldHVybiBjdHgucmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIGdldE1vdmVOZXh0KGlubmVyRnVuY3Rpb24sIHNlbGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oY3R4KSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBpbm5lckZ1bmN0aW9uLmNhbGwoc2VsZiwgY3R4KTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBoYW5kbGVDYXRjaChjdHgsIGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gaGFuZGxlQ2F0Y2goY3R4LCBleCkge1xuICAgIGN0eC5zdG9yZWRFeGNlcHRpb24gPSBleDtcbiAgICB2YXIgbGFzdCA9IGN0eC50cnlTdGFja19bY3R4LnRyeVN0YWNrXy5sZW5ndGggLSAxXTtcbiAgICBpZiAoIWxhc3QpIHtcbiAgICAgIGN0eC5oYW5kbGVFeGNlcHRpb24oZXgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjdHguc3RhdGUgPSBsYXN0LmNhdGNoICE9PSB1bmRlZmluZWQgPyBsYXN0LmNhdGNoIDogbGFzdC5maW5hbGx5O1xuICAgIGlmIChsYXN0LmZpbmFsbHlGYWxsVGhyb3VnaCAhPT0gdW5kZWZpbmVkKVxuICAgICAgY3R4LmZpbmFsbHlGYWxsVGhyb3VnaCA9IGxhc3QuZmluYWxseUZhbGxUaHJvdWdoO1xuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0IGNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUdlbmVyYXRvckluc3RhbmNlO1xuICAgIH0sXG4gICAgZ2V0IGluaXRHZW5lcmF0b3JGdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbml0R2VuZXJhdG9yRnVuY3Rpb247XG4gICAgfSxcbiAgICBnZXQgYXN5bmNXcmFwKCkge1xuICAgICAgcmV0dXJuIGFzeW5jV3JhcDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmNXcmFwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmNXcmFwLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2dlbmVyYXRvcnNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2dlbmVyYXRvcnMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2FzeW5jV3JhcC5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19nZW5lcmF0b3JzXzQ2X2pzX18uYXN5bmNXcmFwO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRHZW5lcmF0b3JGdW5jdGlvbi5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRHZW5lcmF0b3JGdW5jdGlvbi5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19nZW5lcmF0b3JzXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9nZW5lcmF0b3JzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pbml0R2VuZXJhdG9yRnVuY3Rpb24uanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfZ2VuZXJhdG9yc180Nl9qc19fLmluaXRHZW5lcmF0b3JGdW5jdGlvbjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUdlbmVyYXRvckluc3RhbmNlLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2dlbmVyYXRvcnNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2dlbmVyYXRvcnMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUdlbmVyYXRvckluc3RhbmNlLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2dlbmVyYXRvcnNfNDZfanNfXy5jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZTtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZ2VuZXJhdG9ycy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9nZW5lcmF0b3JzLmpzXCI7XG4gIHZhciBhc3luY1dyYXAgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2FzeW5jV3JhcC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2dlbmVyYXRvcnMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBpbml0R2VuZXJhdG9yRnVuY3Rpb24gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2luaXRHZW5lcmF0b3JGdW5jdGlvbi5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2dlbmVyYXRvcnMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjcmVhdGVHZW5lcmF0b3JJbnN0YW5jZSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9nZW5lcmF0b3JzLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuYXN5bmNXcmFwID0gYXN5bmNXcmFwO1xuICAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uID0gaW5pdEdlbmVyYXRvckZ1bmN0aW9uO1xuICAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UgPSBjcmVhdGVHZW5lcmF0b3JJbnN0YW5jZTtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwYXduLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3Bhd24uanNcIjtcbiAgZnVuY3Rpb24gc3Bhd24oc2VsZiwgYXJncywgZ2VuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgZnVuY3Rpb24gZnVsZmlsbCh2KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3RlcChnZW4ubmV4dCh2KSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHYpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdGVwKGdlbi50aHJvdyh2KSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzKSB7XG4gICAgICAgIGlmIChyZXMuZG9uZSkge1xuICAgICAgICAgIHJlc29sdmUocmVzLnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUocmVzLnZhbHVlKS50aGVuKGZ1bGZpbGwsIHJlamVjdGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RlcCgoZ2VuID0gZ2VuLmFwcGx5KHNlbGYsIGFyZ3MpKS5uZXh0KCkpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gc3Bhd247XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3NwYXduLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3NwYXduLmpzXCI7XG4gIHZhciBzcGF3biA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvc3Bhd24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9zcGF3bi5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLnNwYXduID0gc3Bhd247XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9nZXRUZW1wbGF0ZU9iamVjdC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2dldFRlbXBsYXRlT2JqZWN0LmpzXCI7XG4gIHZhciAkX18xID0gT2JqZWN0LFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xLmRlZmluZVByb3BlcnR5LFxuICAgICAgZnJlZXplID0gJF9fMS5mcmVlemU7XG4gIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGZ1bmN0aW9uIGdldFRlbXBsYXRlT2JqZWN0KHJhdykge1xuICAgIHZhciBjb29rZWQgPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIGtleSA9IHJhdy5qb2luKCcke30nKTtcbiAgICB2YXIgdGVtcGxhdGVPYmplY3QgPSBtYXBba2V5XTtcbiAgICBpZiAodGVtcGxhdGVPYmplY3QpXG4gICAgICByZXR1cm4gdGVtcGxhdGVPYmplY3Q7XG4gICAgaWYgKCFjb29rZWQpIHtcbiAgICAgIGNvb2tlZCA9IHNsaWNlLmNhbGwocmF3KTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcFtrZXldID0gZnJlZXplKGRlZmluZVByb3BlcnR5KGNvb2tlZCwgJ3JhdycsIHt2YWx1ZTogZnJlZXplKHJhdyl9KSk7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBnZXRUZW1wbGF0ZU9iamVjdDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvdGVtcGxhdGUuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvdGVtcGxhdGUuanNcIjtcbiAgdmFyIGdldFRlbXBsYXRlT2JqZWN0ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9nZXRUZW1wbGF0ZU9iamVjdC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3RlbXBsYXRlLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0VGVtcGxhdGVPYmplY3QgPSBnZXRUZW1wbGF0ZU9iamVjdDtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwcmVhZFByb3BlcnRpZXMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zcHJlYWRQcm9wZXJ0aWVzLmpzXCI7XG4gIHZhciAkX18xID0gT2JqZWN0LFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xLmRlZmluZVByb3BlcnR5LFxuICAgICAgZ2V0T3duUHJvcGVydHlOYW1lcyA9ICRfXzEuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICAgIGdldE93blByb3BlcnR5U3ltYm9scyA9ICRfXzEuZ2V0T3duUHJvcGVydHlTeW1ib2xzLFxuICAgICAgcHJvcGVydHlJc0VudW1lcmFibGUgPSAkX18xLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuICBmdW5jdGlvbiBjcmVhdGVEYXRhUHJvcGVydHkobywgcCwgdikge1xuICAgIGRlZmluZVByb3BlcnR5KG8sIHAsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogdixcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gY29weURhdGFQcm9wZXJ0aWVzKHRhcmdldCwgc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjb3B5ID0gZnVuY3Rpb24oa2V5cykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuZXh0S2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKHByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwoc291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgIHZhciBwcm9wVmFsdWUgPSBzb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgY3JlYXRlRGF0YVByb3BlcnR5KHRhcmdldCwgbmV4dEtleSwgcHJvcFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgY29weShnZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZSkpO1xuICAgIGNvcHkoZ2V0T3duUHJvcGVydHlTeW1ib2xzKHNvdXJjZSkpO1xuICB9XG4gIHZhciAkX19kZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29weURhdGFQcm9wZXJ0aWVzKHRhcmdldCwgYXJndW1lbnRzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX19kZWZhdWx0O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9qc3guanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvanN4LmpzXCI7XG4gIHZhciBzcHJlYWRQcm9wZXJ0aWVzID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zcHJlYWRQcm9wZXJ0aWVzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvanN4LmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuc3ByZWFkUHJvcGVydGllcyA9IHNwcmVhZFByb3BlcnRpZXM7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vY2xhc3Nlcy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2V4cG9ydFN0YXIuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9yZWxhdGl2ZVJlcXVpcmUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9zcHJlYWQuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9kZXN0cnVjdHVyaW5nLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vYXN5bmMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9nZW5lcmF0b3JzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vc3Bhd24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi90ZW1wbGF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2pzeC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZnJvemVuLWRhdGEuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZnJvemVuLWRhdGEuanNcIjtcbiAgZnVuY3Rpb24gZmluZEluZGV4KGFyciwga2V5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IGtleSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGZ1bmN0aW9uIHNldEZyb3plbihhcnIsIGtleSwgdmFsKSB7XG4gICAgdmFyIGkgPSBmaW5kSW5kZXgoYXJyLCBrZXkpO1xuICAgIGlmIChpID09PSAtMSkge1xuICAgICAgYXJyLnB1c2goa2V5LCB2YWwpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBnZXRGcm96ZW4oYXJyLCBrZXkpIHtcbiAgICB2YXIgaSA9IGZpbmRJbmRleChhcnIsIGtleSk7XG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gYXJyW2kgKyAxXTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiBoYXNGcm96ZW4oYXJyLCBrZXkpIHtcbiAgICByZXR1cm4gZmluZEluZGV4KGFyciwga2V5KSAhPT0gLTE7XG4gIH1cbiAgZnVuY3Rpb24gZGVsZXRlRnJvemVuKGFyciwga2V5KSB7XG4gICAgdmFyIGkgPSBmaW5kSW5kZXgoYXJyLCBrZXkpO1xuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgYXJyLnNwbGljZShpLCAyKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBnZXQgc2V0RnJvemVuKCkge1xuICAgICAgcmV0dXJuIHNldEZyb3plbjtcbiAgICB9LFxuICAgIGdldCBnZXRGcm96ZW4oKSB7XG4gICAgICByZXR1cm4gZ2V0RnJvemVuO1xuICAgIH0sXG4gICAgZ2V0IGhhc0Zyb3plbigpIHtcbiAgICAgIHJldHVybiBoYXNGcm96ZW47XG4gICAgfSxcbiAgICBnZXQgZGVsZXRlRnJvemVuKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZUZyb3plbjtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvdXRpbHMuanNcIjtcbiAgdmFyICRjZWlsID0gTWF0aC5jZWlsO1xuICB2YXIgJGZsb29yID0gTWF0aC5mbG9vcjtcbiAgdmFyICRpc0Zpbml0ZSA9IGlzRmluaXRlO1xuICB2YXIgJGlzTmFOID0gaXNOYU47XG4gIHZhciAkcG93ID0gTWF0aC5wb3c7XG4gIHZhciAkbWluID0gTWF0aC5taW47XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICB2YXIgJE9iamVjdCA9IE9iamVjdDtcbiAgZnVuY3Rpb24gdG9PYmplY3QoeCkge1xuICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgIHRocm93ICRUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgcmV0dXJuICRPYmplY3QoeCk7XG4gIH1cbiAgZnVuY3Rpb24gdG9VaW50MzIoeCkge1xuICAgIHJldHVybiB4ID4+PiAwO1xuICB9XG4gIGZ1bmN0aW9uIGlzT2JqZWN0KHgpIHtcbiAgICByZXR1cm4geCAmJiAodHlwZW9mIHggPT09ICdvYmplY3QnIHx8IHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nKTtcbiAgfVxuICBmdW5jdGlvbiBpc0NhbGxhYmxlKHgpIHtcbiAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG4gIH1cbiAgZnVuY3Rpb24gaXNOdW1iZXIoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ251bWJlcic7XG4gIH1cbiAgZnVuY3Rpb24gdG9JbnRlZ2VyKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKCRpc05hTih4KSlcbiAgICAgIHJldHVybiAwO1xuICAgIGlmICh4ID09PSAwIHx8ICEkaXNGaW5pdGUoeCkpXG4gICAgICByZXR1cm4geDtcbiAgICByZXR1cm4geCA+IDAgPyAkZmxvb3IoeCkgOiAkY2VpbCh4KTtcbiAgfVxuICB2YXIgTUFYX1NBRkVfTEVOR1RIID0gJHBvdygyLCA1MykgLSAxO1xuICBmdW5jdGlvbiB0b0xlbmd0aCh4KSB7XG4gICAgdmFyIGxlbiA9IHRvSW50ZWdlcih4KTtcbiAgICByZXR1cm4gbGVuIDwgMCA/IDAgOiAkbWluKGxlbiwgTUFYX1NBRkVfTEVOR1RIKTtcbiAgfVxuICBmdW5jdGlvbiBjaGVja0l0ZXJhYmxlKHgpIHtcbiAgICByZXR1cm4gIWlzT2JqZWN0KHgpID8gdW5kZWZpbmVkIDogeFtTeW1ib2wuaXRlcmF0b3JdO1xuICB9XG4gIGZ1bmN0aW9uIGlzQ29uc3RydWN0b3IoeCkge1xuICAgIHJldHVybiBpc0NhbGxhYmxlKHgpO1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KHZhbHVlLCBkb25lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGRvbmU6IGRvbmVcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIG1heWJlRGVmaW5lKG9iamVjdCwgbmFtZSwgZGVzY3IpIHtcbiAgICBpZiAoIShuYW1lIGluIG9iamVjdCkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIGRlc2NyKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVEZWZpbmVNZXRob2Qob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIG1heWJlRGVmaW5lKG9iamVjdCwgbmFtZSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIG1heWJlRGVmaW5lQ29uc3Qob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIG1heWJlRGVmaW5lKG9iamVjdCwgbmFtZSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVBZGRGdW5jdGlvbnMob2JqZWN0LCBmdW5jdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZ1bmN0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIG5hbWUgPSBmdW5jdGlvbnNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBmdW5jdGlvbnNbaSArIDFdO1xuICAgICAgbWF5YmVEZWZpbmVNZXRob2Qob2JqZWN0LCBuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlQWRkQ29uc3RzKG9iamVjdCwgY29uc3RzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25zdHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHZhciBuYW1lID0gY29uc3RzW2ldO1xuICAgICAgdmFyIHZhbHVlID0gY29uc3RzW2kgKyAxXTtcbiAgICAgIG1heWJlRGVmaW5lQ29uc3Qob2JqZWN0LCBuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlQWRkSXRlcmF0b3Iob2JqZWN0LCBmdW5jLCBTeW1ib2wpIHtcbiAgICBpZiAoIVN5bWJvbCB8fCAhU3ltYm9sLml0ZXJhdG9yIHx8IG9iamVjdFtTeW1ib2wuaXRlcmF0b3JdKVxuICAgICAgcmV0dXJuO1xuICAgIGlmIChvYmplY3RbJ0BAaXRlcmF0b3InXSlcbiAgICAgIGZ1bmMgPSBvYmplY3RbJ0BAaXRlcmF0b3InXTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBTeW1ib2wuaXRlcmF0b3IsIHtcbiAgICAgIHZhbHVlOiBmdW5jLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG4gIHZhciBwb2x5ZmlsbHMgPSBbXTtcbiAgZnVuY3Rpb24gcmVnaXN0ZXJQb2x5ZmlsbChmdW5jKSB7XG4gICAgcG9seWZpbGxzLnB1c2goZnVuYyk7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxBbGwoZ2xvYmFsKSB7XG4gICAgcG9seWZpbGxzLmZvckVhY2goZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGYoZ2xvYmFsKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGdldCB0b09iamVjdCgpIHtcbiAgICAgIHJldHVybiB0b09iamVjdDtcbiAgICB9LFxuICAgIGdldCB0b1VpbnQzMigpIHtcbiAgICAgIHJldHVybiB0b1VpbnQzMjtcbiAgICB9LFxuICAgIGdldCBpc09iamVjdCgpIHtcbiAgICAgIHJldHVybiBpc09iamVjdDtcbiAgICB9LFxuICAgIGdldCBpc0NhbGxhYmxlKCkge1xuICAgICAgcmV0dXJuIGlzQ2FsbGFibGU7XG4gICAgfSxcbiAgICBnZXQgaXNOdW1iZXIoKSB7XG4gICAgICByZXR1cm4gaXNOdW1iZXI7XG4gICAgfSxcbiAgICBnZXQgdG9JbnRlZ2VyKCkge1xuICAgICAgcmV0dXJuIHRvSW50ZWdlcjtcbiAgICB9LFxuICAgIGdldCB0b0xlbmd0aCgpIHtcbiAgICAgIHJldHVybiB0b0xlbmd0aDtcbiAgICB9LFxuICAgIGdldCBjaGVja0l0ZXJhYmxlKCkge1xuICAgICAgcmV0dXJuIGNoZWNrSXRlcmFibGU7XG4gICAgfSxcbiAgICBnZXQgaXNDb25zdHJ1Y3RvcigpIHtcbiAgICAgIHJldHVybiBpc0NvbnN0cnVjdG9yO1xuICAgIH0sXG4gICAgZ2V0IGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0O1xuICAgIH0sXG4gICAgZ2V0IG1heWJlRGVmaW5lKCkge1xuICAgICAgcmV0dXJuIG1heWJlRGVmaW5lO1xuICAgIH0sXG4gICAgZ2V0IG1heWJlRGVmaW5lTWV0aG9kKCkge1xuICAgICAgcmV0dXJuIG1heWJlRGVmaW5lTWV0aG9kO1xuICAgIH0sXG4gICAgZ2V0IG1heWJlRGVmaW5lQ29uc3QoKSB7XG4gICAgICByZXR1cm4gbWF5YmVEZWZpbmVDb25zdDtcbiAgICB9LFxuICAgIGdldCBtYXliZUFkZEZ1bmN0aW9ucygpIHtcbiAgICAgIHJldHVybiBtYXliZUFkZEZ1bmN0aW9ucztcbiAgICB9LFxuICAgIGdldCBtYXliZUFkZENvbnN0cygpIHtcbiAgICAgIHJldHVybiBtYXliZUFkZENvbnN0cztcbiAgICB9LFxuICAgIGdldCBtYXliZUFkZEl0ZXJhdG9yKCkge1xuICAgICAgcmV0dXJuIG1heWJlQWRkSXRlcmF0b3I7XG4gICAgfSxcbiAgICBnZXQgcmVnaXN0ZXJQb2x5ZmlsbCgpIHtcbiAgICAgIHJldHVybiByZWdpc3RlclBvbHlmaWxsO1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsQWxsKCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsQWxsO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWFwLmpzXCI7XG4gIHZhciAkX18xNiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9wcml2YXRlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiKSksXG4gICAgICBjcmVhdGVQcml2YXRlU3ltYm9sID0gJF9fMTYuY3JlYXRlUHJpdmF0ZVN5bWJvbCxcbiAgICAgIGdldFByaXZhdGUgPSAkX18xNi5nZXRQcml2YXRlLFxuICAgICAgc2V0UHJpdmF0ZSA9ICRfXzE2LnNldFByaXZhdGU7XG4gIHZhciAkX18xNyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9mcm96ZW4tZGF0YS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIikpLFxuICAgICAgZGVsZXRlRnJvemVuID0gJF9fMTcuZGVsZXRlRnJvemVuLFxuICAgICAgZ2V0RnJvemVuID0gJF9fMTcuZ2V0RnJvemVuLFxuICAgICAgc2V0RnJvemVuID0gJF9fMTcuc2V0RnJvemVuO1xuICB2YXIgJF9fMTggPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIikpLFxuICAgICAgaXNPYmplY3QgPSAkX18xOC5pc09iamVjdCxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18xOC5yZWdpc3RlclBvbHlmaWxsO1xuICB2YXIgaGFzTmF0aXZlU3ltYm9sID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL2hhcy1uYXRpdmUtc3ltYm9scy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkX185ID0gT2JqZWN0LFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX185LmRlZmluZVByb3BlcnR5LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJF9fOS5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9ICRfXzkuaGFzT3duUHJvcGVydHksXG4gICAgICBpc0V4dGVuc2libGUgPSAkX185LmlzRXh0ZW5zaWJsZTtcbiAgdmFyIGRlbGV0ZWRTZW50aW5lbCA9IHt9O1xuICB2YXIgY291bnRlciA9IDE7XG4gIHZhciBoYXNoQ29kZU5hbWUgPSBjcmVhdGVQcml2YXRlU3ltYm9sKCk7XG4gIGZ1bmN0aW9uIGdldEhhc2hDb2RlRm9yT2JqZWN0KG9iaikge1xuICAgIHJldHVybiBnZXRQcml2YXRlKG9iaiwgaGFzaENvZGVOYW1lKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPclNldEhhc2hDb2RlRm9yT2JqZWN0KG9iaikge1xuICAgIHZhciBoYXNoID0gZ2V0SGFzaENvZGVGb3JPYmplY3Qob2JqKTtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgIGhhc2ggPSBjb3VudGVyKys7XG4gICAgICBzZXRQcml2YXRlKG9iaiwgaGFzaENvZGVOYW1lLCBoYXNoKTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cbiAgZnVuY3Rpb24gbG9va3VwSW5kZXgobWFwLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBtYXAuc3RyaW5nSW5kZXhfW2tleV07XG4gICAgfVxuICAgIGlmIChpc09iamVjdChrZXkpKSB7XG4gICAgICBpZiAoIWlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICAgIHJldHVybiBnZXRGcm96ZW4obWFwLmZyb3plbkRhdGFfLCBrZXkpO1xuICAgICAgfVxuICAgICAgdmFyIGhjID0gZ2V0SGFzaENvZGVGb3JPYmplY3Qoa2V5KTtcbiAgICAgIGlmIChoYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFwLm9iamVjdEluZGV4X1toY107XG4gICAgfVxuICAgIHJldHVybiBtYXAucHJpbWl0aXZlSW5kZXhfW2tleV07XG4gIH1cbiAgZnVuY3Rpb24gaW5pdE1hcChtYXApIHtcbiAgICBtYXAuZW50cmllc18gPSBbXTtcbiAgICBtYXAub2JqZWN0SW5kZXhfID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBtYXAuc3RyaW5nSW5kZXhfID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBtYXAucHJpbWl0aXZlSW5kZXhfID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBtYXAuZnJvemVuRGF0YV8gPSBbXTtcbiAgICBtYXAuZGVsZXRlZENvdW50XyA9IDA7XG4gIH1cbiAgdmFyIE1hcCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE1hcCgpIHtcbiAgICAgIHZhciAkX18xMSxcbiAgICAgICAgICAkX18xMjtcbiAgICAgIHZhciBpdGVyYWJsZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgIGlmICghaXNPYmplY3QodGhpcykpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ01hcCBjYWxsZWQgb24gaW5jb21wYXRpYmxlIHR5cGUnKTtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMsICdlbnRyaWVzXycpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ01hcCBjYW4gbm90IGJlIHJlZW50cmFudGx5IGluaXRpYWxpc2VkJyk7XG4gICAgICB9XG4gICAgICBpbml0TWFwKHRoaXMpO1xuICAgICAgaWYgKGl0ZXJhYmxlICE9PSBudWxsICYmIGl0ZXJhYmxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyICRfXzUgPSB0cnVlO1xuICAgICAgICB2YXIgJF9fNiA9IGZhbHNlO1xuICAgICAgICB2YXIgJF9fNyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmb3IgKHZhciAkX18zID0gdm9pZCAwLFxuICAgICAgICAgICAgICAkX18yID0gKGl0ZXJhYmxlKVtTeW1ib2wuaXRlcmF0b3JdKCk7ICEoJF9fNSA9ICgkX18zID0gJF9fMi5uZXh0KCkpLmRvbmUpOyAkX181ID0gdHJ1ZSkge1xuICAgICAgICAgICAgdmFyICRfXzEwID0gJF9fMy52YWx1ZSxcbiAgICAgICAgICAgICAgICBrZXkgPSAoJF9fMTEgPSAkX18xMFtTeW1ib2wuaXRlcmF0b3JdKCksICgkX18xMiA9ICRfXzExLm5leHQoKSkuZG9uZSA/IHZvaWQgMCA6ICRfXzEyLnZhbHVlKSxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICgkX18xMiA9ICRfXzExLm5leHQoKSkuZG9uZSA/IHZvaWQgMCA6ICRfXzEyLnZhbHVlO1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aGlzLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKCRfXzgpIHtcbiAgICAgICAgICAkX182ID0gdHJ1ZTtcbiAgICAgICAgICAkX183ID0gJF9fODtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCEkX181ICYmICRfXzIucmV0dXJuICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgJF9fMi5yZXR1cm4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKCRfXzYpIHtcbiAgICAgICAgICAgICAgdGhyb3cgJF9fNztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKE1hcCwge1xuICAgICAgZ2V0IHNpemUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVudHJpZXNfLmxlbmd0aCAvIDIgLSB0aGlzLmRlbGV0ZWRDb3VudF87XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbG9va3VwSW5kZXgodGhpcywga2V5KTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbnRyaWVzX1tpbmRleCArIDFdO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxvb2t1cEluZGV4KHRoaXMsIGtleSk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5lbnRyaWVzX1tpbmRleCArIDFdID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5kZXggPSB0aGlzLmVudHJpZXNfLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4XSA9IGtleTtcbiAgICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgICBpZiAoaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICAgICAgaWYgKCFpc0V4dGVuc2libGUoa2V5KSkge1xuICAgICAgICAgICAgICBzZXRGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywga2V5LCBpbmRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgaGFzaCA9IGdldE9yU2V0SGFzaENvZGVGb3JPYmplY3Qoa2V5KTtcbiAgICAgICAgICAgICAgdGhpcy5vYmplY3RJbmRleF9baGFzaF0gPSBpbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnN0cmluZ0luZGV4X1trZXldID0gaW5kZXg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJpbWl0aXZlSW5kZXhfW2tleV0gPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIGxvb2t1cEluZGV4KHRoaXMsIGtleSkgIT09IHVuZGVmaW5lZDtcbiAgICAgIH0sXG4gICAgICBkZWxldGU6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgaW5kZXggPSBsb29rdXBJbmRleCh0aGlzLCBrZXkpO1xuICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4XSA9IGRlbGV0ZWRTZW50aW5lbDtcbiAgICAgICAgdGhpcy5lbnRyaWVzX1tpbmRleCArIDFdID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmRlbGV0ZWRDb3VudF8rKztcbiAgICAgICAgaWYgKGlzT2JqZWN0KGtleSkpIHtcbiAgICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICAgICAgICBkZWxldGVGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywga2V5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBnZXRIYXNoQ29kZUZvck9iamVjdChrZXkpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub2JqZWN0SW5kZXhfW2hhc2hdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0cmluZ0luZGV4X1trZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnByaW1pdGl2ZUluZGV4X1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaW5pdE1hcCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBmb3JFYWNoOiBmdW5jdGlvbihjYWxsYmFja0ZuKSB7XG4gICAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZW50cmllc18ubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICB2YXIga2V5ID0gdGhpcy5lbnRyaWVzX1tpXTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmVudHJpZXNfW2kgKyAxXTtcbiAgICAgICAgICBpZiAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICBjYWxsYmFja0ZuLmNhbGwodGhpc0FyZywgdmFsdWUsIGtleSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlbnRyaWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzEzKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgICB3aGlsZSAodHJ1ZSlcbiAgICAgICAgICAgIHN3aXRjaCAoJGN0eC5zdGF0ZSkge1xuICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoaSA8IHRoaXMuZW50cmllc18ubGVuZ3RoKSA/IDggOiAtMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgICAgICBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5lbnRyaWVzX1tpICsgMV07XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKGtleSA9PT0gZGVsZXRlZFNlbnRpbmVsKSA/IDQgOiA2O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtrZXksIHZhbHVlXTtcbiAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICRjdHgubWF5YmVUaHJvdygpO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSA0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAkY3R4LmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAkX18xMywgdGhpcyk7XG4gICAgICB9KSxcbiAgICAgIGtleXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fMTQoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICAgIHdoaWxlICh0cnVlKVxuICAgICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGgpID8gOCA6IC0yO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICAgIGtleSA9IHRoaXMuZW50cmllc19baV07XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmVudHJpZXNfW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpID8gNCA6IDY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMjtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgJGN0eC5tYXliZVRocm93KCk7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICRfXzE0LCB0aGlzKTtcbiAgICAgIH0pLFxuICAgICAgdmFsdWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzE1KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgICB3aGlsZSAodHJ1ZSlcbiAgICAgICAgICAgIHN3aXRjaCAoJGN0eC5zdGF0ZSkge1xuICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoaSA8IHRoaXMuZW50cmllc18ubGVuZ3RoKSA/IDggOiAtMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgICAgICBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5lbnRyaWVzX1tpICsgMV07XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKGtleSA9PT0gZGVsZXRlZFNlbnRpbmVsKSA/IDQgOiA2O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgJGN0eC5tYXliZVRocm93KCk7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICRfXzE1LCB0aGlzKTtcbiAgICAgIH0pXG4gICAgfSwge30pO1xuICB9KCk7XG4gIGRlZmluZVByb3BlcnR5KE1hcC5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogTWFwLnByb3RvdHlwZS5lbnRyaWVzXG4gIH0pO1xuICBmdW5jdGlvbiBuZWVkc1BvbHlmaWxsKGdsb2JhbCkge1xuICAgIHZhciAkX18xMCA9IGdsb2JhbCxcbiAgICAgICAgTWFwID0gJF9fMTAuTWFwLFxuICAgICAgICBTeW1ib2wgPSAkX18xMC5TeW1ib2w7XG4gICAgaWYgKCFNYXAgfHwgIWhhc05hdGl2ZVN5bWJvbCgpIHx8ICFNYXAucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gfHwgIU1hcC5wcm90b3R5cGUuZW50cmllcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IE1hcChbW11dKS5zaXplICE9PSAxO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxNYXAoZ2xvYmFsKSB7XG4gICAgaWYgKG5lZWRzUG9seWZpbGwoZ2xvYmFsKSkge1xuICAgICAgZ2xvYmFsLk1hcCA9IE1hcDtcbiAgICB9XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbE1hcCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IE1hcCgpIHtcbiAgICAgIHJldHVybiBNYXA7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxNYXAoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxNYXA7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCI7XG4gIHZhciAkX18xOCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiKSksXG4gICAgICBpc09iamVjdCA9ICRfXzE4LmlzT2JqZWN0LFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzE4LnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBNYXAgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9NYXAuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCIpKS5NYXA7XG4gIHZhciBoYXNOYXRpdmVTeW1ib2wgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyIFNldCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNldCgpIHtcbiAgICAgIHZhciBpdGVyYWJsZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgIGlmICghaXNPYmplY3QodGhpcykpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NldCBjYWxsZWQgb24gaW5jb21wYXRpYmxlIHR5cGUnKTtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMsICdtYXBfJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2V0IGNhbiBub3QgYmUgcmVlbnRyYW50bHkgaW5pdGlhbGlzZWQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWFwXyA9IG5ldyBNYXAoKTtcbiAgICAgIGlmIChpdGVyYWJsZSAhPT0gbnVsbCAmJiBpdGVyYWJsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciAkX182ID0gdHJ1ZTtcbiAgICAgICAgdmFyICRfXzcgPSBmYWxzZTtcbiAgICAgICAgdmFyICRfXzggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZm9yICh2YXIgJF9fNCA9IHZvaWQgMCxcbiAgICAgICAgICAgICAgJF9fMyA9IChpdGVyYWJsZSlbU3ltYm9sLml0ZXJhdG9yXSgpOyAhKCRfXzYgPSAoJF9fNCA9ICRfXzMubmV4dCgpKS5kb25lKTsgJF9fNiA9IHRydWUpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gJF9fNC52YWx1ZTtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGhpcy5hZGQoaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICgkX185KSB7XG4gICAgICAgICAgJF9fNyA9IHRydWU7XG4gICAgICAgICAgJF9fOCA9ICRfXzk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghJF9fNiAmJiAkX18zLnJldHVybiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICRfXzMucmV0dXJuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmICgkX183KSB7XG4gICAgICAgICAgICAgIHRocm93ICRfXzg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShTZXQsIHtcbiAgICAgIGdldCBzaXplKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXBfLnNpemU7XG4gICAgICB9LFxuICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwXy5oYXMoa2V5KTtcbiAgICAgIH0sXG4gICAgICBhZGQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB0aGlzLm1hcF8uc2V0KGtleSwga2V5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgZGVsZXRlOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwXy5kZWxldGUoa2V5KTtcbiAgICAgIH0sXG4gICAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcF8uY2xlYXIoKTtcbiAgICAgIH0sXG4gICAgICBmb3JFYWNoOiBmdW5jdGlvbihjYWxsYmFja0ZuKSB7XG4gICAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgICAgICB2YXIgJF9fMiA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcF8uZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgY2FsbGJhY2tGbi5jYWxsKHRoaXNBcmcsIGtleSwga2V5LCAkX18yKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgdmFsdWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzEyKCkge1xuICAgICAgICB2YXIgJF9fMTMsXG4gICAgICAgICAgICAkX18xNDtcbiAgICAgICAgcmV0dXJuICR0cmFjZXVyUnVudGltZS5jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZShmdW5jdGlvbigkY3R4KSB7XG4gICAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgICBzd2l0Y2ggKCRjdHguc3RhdGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICRfXzEzID0gJGN0eC53cmFwWWllbGRTdGFyKHRoaXMubWFwXy5rZXlzKClbU3ltYm9sLml0ZXJhdG9yXSgpKTtcbiAgICAgICAgICAgICAgICAkY3R4LnNlbnQgPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgJGN0eC5hY3Rpb24gPSAnbmV4dCc7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAgICRfXzE0ID0gJF9fMTNbJGN0eC5hY3Rpb25dKCRjdHguc2VudElnbm9yZVRocm93KTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoJF9fMTQuZG9uZSkgPyAzIDogMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICRjdHguc2VudCA9ICRfXzE0LnZhbHVlO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAtMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gJF9fMTQudmFsdWU7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICRfXzEyLCB0aGlzKTtcbiAgICAgIH0pLFxuICAgICAgZW50cmllczogJHRyYWNldXJSdW50aW1lLmluaXRHZW5lcmF0b3JGdW5jdGlvbihmdW5jdGlvbiAkX18xNSgpIHtcbiAgICAgICAgdmFyICRfXzE2LFxuICAgICAgICAgICAgJF9fMTc7XG4gICAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICAgIHdoaWxlICh0cnVlKVxuICAgICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAkX18xNiA9ICRjdHgud3JhcFlpZWxkU3Rhcih0aGlzLm1hcF8uZW50cmllcygpW1N5bWJvbC5pdGVyYXRvcl0oKSk7XG4gICAgICAgICAgICAgICAgJGN0eC5zZW50ID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgICRjdHguYWN0aW9uID0gJ25leHQnO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgICAkX18xNyA9ICRfXzE2WyRjdHguYWN0aW9uXSgkY3R4LnNlbnRJZ25vcmVUaHJvdyk7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKCRfXzE3LmRvbmUpID8gMyA6IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAkY3R4LnNlbnQgPSAkX18xNy52YWx1ZTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gLTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRfXzE3LnZhbHVlO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAkY3R4LmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAkX18xNSwgdGhpcyk7XG4gICAgICB9KVxuICAgIH0sIHt9KTtcbiAgfSgpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2V0LnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBTZXQucHJvdG90eXBlLnZhbHVlc1xuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNldC5wcm90b3R5cGUsICdrZXlzJywge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogU2V0LnByb3RvdHlwZS52YWx1ZXNcbiAgfSk7XG4gIGZ1bmN0aW9uIG5lZWRzUG9seWZpbGwoZ2xvYmFsKSB7XG4gICAgdmFyICRfXzExID0gZ2xvYmFsLFxuICAgICAgICBTZXQgPSAkX18xMS5TZXQsXG4gICAgICAgIFN5bWJvbCA9ICRfXzExLlN5bWJvbDtcbiAgICBpZiAoIVNldCB8fCAhaGFzTmF0aXZlU3ltYm9sKCkgfHwgIVNldC5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSB8fCAhU2V0LnByb3RvdHlwZS52YWx1ZXMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBTZXQoWzFdKS5zaXplICE9PSAxO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxTZXQoZ2xvYmFsKSB7XG4gICAgaWYgKG5lZWRzUG9seWZpbGwoZ2xvYmFsKSkge1xuICAgICAgZ2xvYmFsLlNldCA9IFNldDtcbiAgICB9XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbFNldCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IFNldCgpIHtcbiAgICAgIHJldHVybiBTZXQ7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxTZXQoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxTZXQ7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvbm9kZV9tb2R1bGVzL3JzdnAvbGliL3JzdnAvYXNhcC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9ub2RlX21vZHVsZXMvcnN2cC9saWIvcnN2cC9hc2FwLmpzXCI7XG4gIHZhciBsZW4gPSAwO1xuICB2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcbiAgdmFyIHZlcnR4TmV4dDtcbiAgZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgcXVldWVbbGVuXSA9IGNhbGxiYWNrO1xuICAgIHF1ZXVlW2xlbiArIDFdID0gYXJnO1xuICAgIGxlbiArPSAyO1xuICAgIGlmIChsZW4gPT09IDIpIHtcbiAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICB9XG4gIH1cbiAgdmFyIGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICB2YXIgYnJvd3Nlckdsb2JhbCA9IGJyb3dzZXJXaW5kb3cgfHwge307XG4gIHZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gIHZhciBpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcbiAgdmFyIGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcbiAgZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gICAgdmFyIG5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB2YXIgdmVyc2lvbiA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5tYXRjaCgvXig/OihcXGQrKVxcLik/KD86KFxcZCspXFwuKT8oXFwqfFxcZCspJC8pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZlcnNpb24pICYmIHZlcnNpb25bMV0gPT09ICcwJyAmJiB2ZXJzaW9uWzJdID09PSAnMTAnKSB7XG4gICAgICBuZXh0VGljayA9IHNldEltbWVkaWF0ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgbmV4dFRpY2soZmx1c2gpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdXNlVmVydHhUaW1lcigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2ZXJ0eE5leHQoZmx1c2gpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtjaGFyYWN0ZXJEYXRhOiB0cnVlfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBzZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgICB9O1xuICB9XG4gIHZhciBxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgdmFyIGNhbGxiYWNrID0gcXVldWVbaV07XG4gICAgICB2YXIgYXJnID0gcXVldWVbaSArIDFdO1xuICAgICAgY2FsbGJhY2soYXJnKTtcbiAgICAgIHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgICAgcXVldWVbaSArIDFdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZW4gPSAwO1xuICB9XG4gIGZ1bmN0aW9uIGF0dGVtcHRWZXJ0ZXgoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByID0gcmVxdWlyZTtcbiAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICB2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgcmV0dXJuIHVzZVZlcnR4VGltZXIoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xuICAgIH1cbiAgfVxuICB2YXIgc2NoZWR1bGVGbHVzaDtcbiAgaWYgKGlzTm9kZSkge1xuICAgIHNjaGVkdWxlRmx1c2ggPSB1c2VOZXh0VGljaygpO1xuICB9IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgfSBlbHNlIGlmIChpc1dvcmtlcikge1xuICAgIHNjaGVkdWxlRmx1c2ggPSB1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICB9IGVsc2UgaWYgKGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHNjaGVkdWxlRmx1c2ggPSBhdHRlbXB0VmVydGV4KCk7XG4gIH0gZWxzZSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIGFzYXA7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9Qcm9taXNlLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9Qcm9taXNlLmpzXCI7XG4gIHZhciBhc3luYyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvcnN2cC9saWIvcnN2cC9hc2FwLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkX185ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvUHJvbWlzZS5qc1wiKSksXG4gICAgICBpc09iamVjdCA9ICRfXzkuaXNPYmplY3QsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fOS5yZWdpc3RlclBvbHlmaWxsO1xuICB2YXIgJF9fMTAgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9Qcm9taXNlLmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX18xMC5jcmVhdGVQcml2YXRlU3ltYm9sLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzEwLmdldFByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fMTAuc2V0UHJpdmF0ZTtcbiAgdmFyIHByb21pc2VSYXcgPSB7fTtcbiAgZnVuY3Rpb24gaXNQcm9taXNlKHgpIHtcbiAgICByZXR1cm4geCAmJiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeC5zdGF0dXNfICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gaWRSZXNvbHZlSGFuZGxlcih4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH1cbiAgZnVuY3Rpb24gaWRSZWplY3RIYW5kbGVyKHgpIHtcbiAgICB0aHJvdyB4O1xuICB9XG4gIGZ1bmN0aW9uIGNoYWluKHByb21pc2UpIHtcbiAgICB2YXIgb25SZXNvbHZlID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IGlkUmVzb2x2ZUhhbmRsZXI7XG4gICAgdmFyIG9uUmVqZWN0ID0gYXJndW1lbnRzWzJdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1syXSA6IGlkUmVqZWN0SGFuZGxlcjtcbiAgICB2YXIgZGVmZXJyZWQgPSBnZXREZWZlcnJlZChwcm9taXNlLmNvbnN0cnVjdG9yKTtcbiAgICBzd2l0Y2ggKHByb21pc2Uuc3RhdHVzXykge1xuICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvcjtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcHJvbWlzZS5vblJlc29sdmVfLnB1c2gob25SZXNvbHZlLCBkZWZlcnJlZCk7XG4gICAgICAgIHByb21pc2Uub25SZWplY3RfLnB1c2gob25SZWplY3QsIGRlZmVycmVkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICsxOlxuICAgICAgICBwcm9taXNlRW5xdWV1ZShwcm9taXNlLnZhbHVlXywgW29uUmVzb2x2ZSwgZGVmZXJyZWRdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIC0xOlxuICAgICAgICBwcm9taXNlRW5xdWV1ZShwcm9taXNlLnZhbHVlXywgW29uUmVqZWN0LCBkZWZlcnJlZF0pO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0RGVmZXJyZWQoQykge1xuICAgIGlmICh0aGlzID09PSAkUHJvbWlzZSkge1xuICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlSW5pdChuZXcgJFByb21pc2UocHJvbWlzZVJhdykpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogcHJvbWlzZSxcbiAgICAgICAgcmVzb2x2ZTogZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHByb21pc2VSZXNvbHZlKHByb21pc2UsIHgpO1xuICAgICAgICB9LFxuICAgICAgICByZWplY3Q6IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICBwcm9taXNlUmVqZWN0KHByb21pc2UsIHIpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICByZXN1bHQucHJvbWlzZSA9IG5ldyBDKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZXN1bHQucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIHJlc3VsdC5yZWplY3QgPSByZWplY3Q7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VTZXQocHJvbWlzZSwgc3RhdHVzLCB2YWx1ZSwgb25SZXNvbHZlLCBvblJlamVjdCkge1xuICAgIHByb21pc2Uuc3RhdHVzXyA9IHN0YXR1cztcbiAgICBwcm9taXNlLnZhbHVlXyA9IHZhbHVlO1xuICAgIHByb21pc2Uub25SZXNvbHZlXyA9IG9uUmVzb2x2ZTtcbiAgICBwcm9taXNlLm9uUmVqZWN0XyA9IG9uUmVqZWN0O1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VJbml0KHByb21pc2UpIHtcbiAgICByZXR1cm4gcHJvbWlzZVNldChwcm9taXNlLCAwLCB1bmRlZmluZWQsIFtdLCBbXSk7XG4gIH1cbiAgdmFyIFByb21pc2UgPSBmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBQcm9taXNlKHJlc29sdmVyKSB7XG4gICAgICBpZiAocmVzb2x2ZXIgPT09IHByb21pc2VSYXcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB2YXIgcHJvbWlzZSA9IHByb21pc2VJbml0KHRoaXMpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHByb21pc2VSZXNvbHZlKHByb21pc2UsIHgpO1xuICAgICAgICB9LCBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgcHJvbWlzZVJlamVjdChwcm9taXNlLCByKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHByb21pc2VSZWplY3QocHJvbWlzZSwgZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShQcm9taXNlLCB7XG4gICAgICBjYXRjaDogZnVuY3Rpb24ob25SZWplY3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbih1bmRlZmluZWQsIG9uUmVqZWN0KTtcbiAgICAgIH0sXG4gICAgICB0aGVuOiBmdW5jdGlvbihvblJlc29sdmUsIG9uUmVqZWN0KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb25SZXNvbHZlICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIG9uUmVzb2x2ZSA9IGlkUmVzb2x2ZUhhbmRsZXI7XG4gICAgICAgIGlmICh0eXBlb2Ygb25SZWplY3QgIT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25SZWplY3QgPSBpZFJlamVjdEhhbmRsZXI7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGNvbnN0cnVjdG9yID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgcmV0dXJuIGNoYWluKHRoaXMsIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICB4ID0gcHJvbWlzZUNvZXJjZShjb25zdHJ1Y3RvciwgeCk7XG4gICAgICAgICAgcmV0dXJuIHggPT09IHRoYXQgPyBvblJlamVjdChuZXcgVHlwZUVycm9yKSA6IGlzUHJvbWlzZSh4KSA/IHgudGhlbihvblJlc29sdmUsIG9uUmVqZWN0KSA6IG9uUmVzb2x2ZSh4KTtcbiAgICAgICAgfSwgb25SZWplY3QpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHJlc29sdmU6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgaWYgKHRoaXMgPT09ICRQcm9taXNlKSB7XG4gICAgICAgICAgaWYgKGlzUHJvbWlzZSh4KSkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwcm9taXNlU2V0KG5ldyAkUHJvbWlzZShwcm9taXNlUmF3KSwgKzEsIHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgdGhpcyhmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHJlc29sdmUoeCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWplY3Q6IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgaWYgKHRoaXMgPT09ICRQcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIHByb21pc2VTZXQobmV3ICRQcm9taXNlKHByb21pc2VSYXcpLCAtMSwgcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyB0aGlzKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgcmVqZWN0KHIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYWxsOiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZ2V0RGVmZXJyZWQodGhpcyk7XG4gICAgICAgIHZhciByZXNvbHV0aW9ucyA9IFtdO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBtYWtlQ291bnRkb3duRnVuY3Rpb24gPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgICByZXNvbHV0aW9uc1tpXSA9IHg7XG4gICAgICAgICAgICAgIGlmICgtLWNvdW50ID09PSAwKVxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzb2x1dGlvbnMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgIHZhciAkX180ID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgJF9fNSA9IGZhbHNlO1xuICAgICAgICAgIHZhciAkX182ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKHZhciAkX18yID0gdm9pZCAwLFxuICAgICAgICAgICAgICAgICRfXzEgPSAodmFsdWVzKVtTeW1ib2wuaXRlcmF0b3JdKCk7ICEoJF9fNCA9ICgkX18yID0gJF9fMS5uZXh0KCkpLmRvbmUpOyAkX180ID0gdHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkX18yLnZhbHVlO1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyIGNvdW50ZG93bkZ1bmN0aW9uID0gbWFrZUNvdW50ZG93bkZ1bmN0aW9uKGkpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSkudGhlbihjb3VudGRvd25GdW5jdGlvbiwgZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICArK2NvdW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoJF9fNykge1xuICAgICAgICAgICAgJF9fNSA9IHRydWU7XG4gICAgICAgICAgICAkX182ID0gJF9fNztcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWYgKCEkX180ICYmICRfXzEucmV0dXJuICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkX18xLnJldHVybigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICBpZiAoJF9fNSkge1xuICAgICAgICAgICAgICAgIHRocm93ICRfXzY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc29sdXRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgICAgcmFjZTogZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGdldERlZmVycmVkKHRoaXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmUodmFsdWVzW2ldKS50aGVuKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh4KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9KCk7XG4gIHZhciAkUHJvbWlzZSA9IFByb21pc2U7XG4gIHZhciAkUHJvbWlzZVJlamVjdCA9ICRQcm9taXNlLnJlamVjdDtcbiAgZnVuY3Rpb24gcHJvbWlzZVJlc29sdmUocHJvbWlzZSwgeCkge1xuICAgIHByb21pc2VEb25lKHByb21pc2UsICsxLCB4LCBwcm9taXNlLm9uUmVzb2x2ZV8pO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VSZWplY3QocHJvbWlzZSwgcikge1xuICAgIHByb21pc2VEb25lKHByb21pc2UsIC0xLCByLCBwcm9taXNlLm9uUmVqZWN0Xyk7XG4gIH1cbiAgZnVuY3Rpb24gcHJvbWlzZURvbmUocHJvbWlzZSwgc3RhdHVzLCB2YWx1ZSwgcmVhY3Rpb25zKSB7XG4gICAgaWYgKHByb21pc2Uuc3RhdHVzXyAhPT0gMClcbiAgICAgIHJldHVybjtcbiAgICBwcm9taXNlRW5xdWV1ZSh2YWx1ZSwgcmVhY3Rpb25zKTtcbiAgICBwcm9taXNlU2V0KHByb21pc2UsIHN0YXR1cywgdmFsdWUpO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VFbnF1ZXVlKHZhbHVlLCB0YXNrcykge1xuICAgIGFzeW5jKGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXNrcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBwcm9taXNlSGFuZGxlKHZhbHVlLCB0YXNrc1tpXSwgdGFza3NbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlSGFuZGxlKHZhbHVlLCBoYW5kbGVyLCBkZWZlcnJlZCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVzdWx0ID0gaGFuZGxlcih2YWx1ZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBkZWZlcnJlZC5wcm9taXNlKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgZWxzZSBpZiAoaXNQcm9taXNlKHJlc3VsdCkpXG4gICAgICAgIGNoYWluKHJlc3VsdCwgZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICB9XG4gIHZhciB0aGVuYWJsZVN5bWJvbCA9IGNyZWF0ZVByaXZhdGVTeW1ib2woKTtcbiAgZnVuY3Rpb24gcHJvbWlzZUNvZXJjZShjb25zdHJ1Y3RvciwgeCkge1xuICAgIGlmICghaXNQcm9taXNlKHgpICYmIGlzT2JqZWN0KHgpKSB7XG4gICAgICB2YXIgdGhlbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4gPSB4LnRoZW47XG4gICAgICB9IGNhdGNoIChyKSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gJFByb21pc2VSZWplY3QuY2FsbChjb25zdHJ1Y3Rvciwgcik7XG4gICAgICAgIHNldFByaXZhdGUoeCwgdGhlbmFibGVTeW1ib2wsIHByb21pc2UpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgcCA9IGdldFByaXZhdGUoeCwgdGhlbmFibGVTeW1ib2wpO1xuICAgICAgICBpZiAocCkge1xuICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBkZWZlcnJlZCA9IGdldERlZmVycmVkKGNvbnN0cnVjdG9yKTtcbiAgICAgICAgICBzZXRQcml2YXRlKHgsIHRoZW5hYmxlU3ltYm9sLCBkZWZlcnJlZC5wcm9taXNlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhlbi5jYWxsKHgsIGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgfSBjYXRjaCAocikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geDtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFByb21pc2UoZ2xvYmFsKSB7XG4gICAgaWYgKCFnbG9iYWwuUHJvbWlzZSlcbiAgICAgIGdsb2JhbC5Qcm9taXNlID0gUHJvbWlzZTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsUHJvbWlzZSk7XG4gIHJldHVybiB7XG4gICAgZ2V0IFByb21pc2UoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZTtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFByb21pc2UoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxQcm9taXNlO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9Qcm9taXNlLmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nSXRlcmF0b3IuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZ0l0ZXJhdG9yLmpzXCI7XG4gIHZhciAkX18zID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nSXRlcmF0b3IuanNcIikpLFxuICAgICAgY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QgPSAkX18zLmNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0LFxuICAgICAgaXNPYmplY3QgPSAkX18zLmlzT2JqZWN0O1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgaXRlcmF0ZWRTdHJpbmcgPSBTeW1ib2woJ2l0ZXJhdGVkU3RyaW5nJyk7XG4gIHZhciBzdHJpbmdJdGVyYXRvck5leHRJbmRleCA9IFN5bWJvbCgnc3RyaW5nSXRlcmF0b3JOZXh0SW5kZXgnKTtcbiAgdmFyIFN0cmluZ0l0ZXJhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyICRfXzE7XG4gICAgZnVuY3Rpb24gU3RyaW5nSXRlcmF0b3IoKSB7fVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShTdHJpbmdJdGVyYXRvciwgKCRfXzEgPSB7fSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KCRfXzEsIFwibmV4dFwiLCB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvID0gdGhpcztcbiAgICAgICAgaWYgKCFpc09iamVjdChvKSB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvLCBpdGVyYXRlZFN0cmluZykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGlzIG11c3QgYmUgYSBTdHJpbmdJdGVyYXRvciBvYmplY3QnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcyA9IG9baXRlcmF0ZWRTdHJpbmddO1xuICAgICAgICBpZiAocyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gb1tzdHJpbmdJdGVyYXRvck5leHRJbmRleF07XG4gICAgICAgIHZhciBsZW4gPSBzLmxlbmd0aDtcbiAgICAgICAgaWYgKHBvc2l0aW9uID49IGxlbikge1xuICAgICAgICAgIG9baXRlcmF0ZWRTdHJpbmddID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCh1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmaXJzdCA9IHMuY2hhckNvZGVBdChwb3NpdGlvbik7XG4gICAgICAgIHZhciByZXN1bHRTdHJpbmc7XG4gICAgICAgIGlmIChmaXJzdCA8IDB4RDgwMCB8fCBmaXJzdCA+IDB4REJGRiB8fCBwb3NpdGlvbiArIDEgPT09IGxlbikge1xuICAgICAgICAgIHJlc3VsdFN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZmlyc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBzZWNvbmQgPSBzLmNoYXJDb2RlQXQocG9zaXRpb24gKyAxKTtcbiAgICAgICAgICBpZiAoc2Vjb25kIDwgMHhEQzAwIHx8IHNlY29uZCA+IDB4REZGRikge1xuICAgICAgICAgICAgcmVzdWx0U3RyaW5nID0gU3RyaW5nLmZyb21DaGFyQ29kZShmaXJzdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdFN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZmlyc3QpICsgU3RyaW5nLmZyb21DaGFyQ29kZShzZWNvbmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvW3N0cmluZ0l0ZXJhdG9yTmV4dEluZGV4XSA9IHBvc2l0aW9uICsgcmVzdWx0U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KHJlc3VsdFN0cmluZywgZmFsc2UpO1xuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMSwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pLCAkX18xKSwge30pO1xuICB9KCk7XG4gIGZ1bmN0aW9uIGNyZWF0ZVN0cmluZ0l0ZXJhdG9yKHN0cmluZykge1xuICAgIHZhciBzID0gU3RyaW5nKHN0cmluZyk7XG4gICAgdmFyIGl0ZXJhdG9yID0gT2JqZWN0LmNyZWF0ZShTdHJpbmdJdGVyYXRvci5wcm90b3R5cGUpO1xuICAgIGl0ZXJhdG9yW2l0ZXJhdGVkU3RyaW5nXSA9IHM7XG4gICAgaXRlcmF0b3Jbc3RyaW5nSXRlcmF0b3JOZXh0SW5kZXhdID0gMDtcbiAgICByZXR1cm4gaXRlcmF0b3I7XG4gIH1cbiAgcmV0dXJuIHtnZXQgY3JlYXRlU3RyaW5nSXRlcmF0b3IoKSB7XG4gICAgICByZXR1cm4gY3JlYXRlU3RyaW5nSXRlcmF0b3I7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmcuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiO1xuICB2YXIgY2hlY2tPYmplY3RDb2VyY2libGUgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vY2hlY2tPYmplY3RDb2VyY2libGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgY3JlYXRlU3RyaW5nSXRlcmF0b3IgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9TdHJpbmdJdGVyYXRvci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmcuanNcIikpLmNyZWF0ZVN0cmluZ0l0ZXJhdG9yO1xuICB2YXIgJF9fMyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiKSksXG4gICAgICBtYXliZUFkZEZ1bmN0aW9ucyA9ICRfXzMubWF5YmVBZGRGdW5jdGlvbnMsXG4gICAgICBtYXliZUFkZEl0ZXJhdG9yID0gJF9fMy5tYXliZUFkZEl0ZXJhdG9yLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzMucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyICR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG4gIHZhciAkaW5kZXhPZiA9IFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZjtcbiAgdmFyICRsYXN0SW5kZXhPZiA9IFN0cmluZy5wcm90b3R5cGUubGFzdEluZGV4T2Y7XG4gIGZ1bmN0aW9uIHN0YXJ0c1dpdGgoc2VhcmNoKSB7XG4gICAgdmFyIHN0cmluZyA9IFN0cmluZyh0aGlzKTtcbiAgICBpZiAodGhpcyA9PSBudWxsIHx8ICR0b1N0cmluZy5jYWxsKHNlYXJjaCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgc2VhcmNoU3RyaW5nID0gU3RyaW5nKHNlYXJjaCk7XG4gICAgdmFyIHNlYXJjaExlbmd0aCA9IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHBvc2l0aW9uID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgaWYgKGlzTmFOKHBvcykpIHtcbiAgICAgIHBvcyA9IDA7XG4gICAgfVxuICAgIHZhciBzdGFydCA9IE1hdGgubWluKE1hdGgubWF4KHBvcywgMCksIHN0cmluZ0xlbmd0aCk7XG4gICAgcmV0dXJuICRpbmRleE9mLmNhbGwoc3RyaW5nLCBzZWFyY2hTdHJpbmcsIHBvcykgPT0gc3RhcnQ7XG4gIH1cbiAgZnVuY3Rpb24gZW5kc1dpdGgoc2VhcmNoKSB7XG4gICAgdmFyIHN0cmluZyA9IFN0cmluZyh0aGlzKTtcbiAgICBpZiAodGhpcyA9PSBudWxsIHx8ICR0b1N0cmluZy5jYWxsKHNlYXJjaCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgc2VhcmNoU3RyaW5nID0gU3RyaW5nKHNlYXJjaCk7XG4gICAgdmFyIHNlYXJjaExlbmd0aCA9IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHBvcyA9IHN0cmluZ0xlbmd0aDtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBwb3NpdGlvbiA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBvcyA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgICAgIGlmIChpc05hTihwb3MpKSB7XG4gICAgICAgICAgcG9zID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZW5kID0gTWF0aC5taW4oTWF0aC5tYXgocG9zLCAwKSwgc3RyaW5nTGVuZ3RoKTtcbiAgICB2YXIgc3RhcnQgPSBlbmQgLSBzZWFyY2hMZW5ndGg7XG4gICAgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gJGxhc3RJbmRleE9mLmNhbGwoc3RyaW5nLCBzZWFyY2hTdHJpbmcsIHN0YXJ0KSA9PSBzdGFydDtcbiAgfVxuICBmdW5jdGlvbiBpbmNsdWRlcyhzZWFyY2gpIHtcbiAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZyA9IFN0cmluZyh0aGlzKTtcbiAgICBpZiAoc2VhcmNoICYmICR0b1N0cmluZy5jYWxsKHNlYXJjaCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgc2VhcmNoU3RyaW5nID0gU3RyaW5nKHNlYXJjaCk7XG4gICAgdmFyIHNlYXJjaExlbmd0aCA9IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHBvc2l0aW9uID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgaWYgKHBvcyAhPSBwb3MpIHtcbiAgICAgIHBvcyA9IDA7XG4gICAgfVxuICAgIHZhciBzdGFydCA9IE1hdGgubWluKE1hdGgubWF4KHBvcywgMCksIHN0cmluZ0xlbmd0aCk7XG4gICAgaWYgKHNlYXJjaExlbmd0aCArIHN0YXJ0ID4gc3RyaW5nTGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAkaW5kZXhPZi5jYWxsKHN0cmluZywgc2VhcmNoU3RyaW5nLCBwb3MpICE9IC0xO1xuICB9XG4gIGZ1bmN0aW9uIHJlcGVhdChjb3VudCkge1xuICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgIHZhciBuID0gY291bnQgPyBOdW1iZXIoY291bnQpIDogMDtcbiAgICBpZiAoaXNOYU4obikpIHtcbiAgICAgIG4gPSAwO1xuICAgIH1cbiAgICBpZiAobiA8IDAgfHwgbiA9PSBJbmZpbml0eSkge1xuICAgICAgdGhyb3cgUmFuZ2VFcnJvcigpO1xuICAgIH1cbiAgICBpZiAobiA9PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICB3aGlsZSAobi0tKSB7XG4gICAgICByZXN1bHQgKz0gc3RyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIGNvZGVQb2ludEF0KHBvc2l0aW9uKSB7XG4gICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgdmFyIHNpemUgPSBzdHJpbmcubGVuZ3RoO1xuICAgIHZhciBpbmRleCA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgaWYgKGlzTmFOKGluZGV4KSkge1xuICAgICAgaW5kZXggPSAwO1xuICAgIH1cbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHNpemUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciBmaXJzdCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICB2YXIgc2Vjb25kO1xuICAgIGlmIChmaXJzdCA+PSAweEQ4MDAgJiYgZmlyc3QgPD0gMHhEQkZGICYmIHNpemUgPiBpbmRleCArIDEpIHtcbiAgICAgIHNlY29uZCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG4gICAgICBpZiAoc2Vjb25kID49IDB4REMwMCAmJiBzZWNvbmQgPD0gMHhERkZGKSB7XG4gICAgICAgIHJldHVybiAoZmlyc3QgLSAweEQ4MDApICogMHg0MDAgKyBzZWNvbmQgLSAweERDMDAgKyAweDEwMDAwO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlyc3Q7XG4gIH1cbiAgZnVuY3Rpb24gcmF3KGNhbGxzaXRlKSB7XG4gICAgdmFyIHJhdyA9IGNhbGxzaXRlLnJhdztcbiAgICB2YXIgbGVuID0gcmF3Lmxlbmd0aCA+Pj4gMDtcbiAgICBpZiAobGVuID09PSAwKVxuICAgICAgcmV0dXJuICcnO1xuICAgIHZhciBzID0gJyc7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBzICs9IHJhd1tpXTtcbiAgICAgIGlmIChpICsgMSA9PT0gbGVuKVxuICAgICAgICByZXR1cm4gcztcbiAgICAgIHMgKz0gYXJndW1lbnRzWysraV07XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGZyb21Db2RlUG9pbnQoXykge1xuICAgIHZhciBjb2RlVW5pdHMgPSBbXTtcbiAgICB2YXIgZmxvb3IgPSBNYXRoLmZsb29yO1xuICAgIHZhciBoaWdoU3Vycm9nYXRlO1xuICAgIHZhciBsb3dTdXJyb2dhdGU7XG4gICAgdmFyIGluZGV4ID0gLTE7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBOdW1iZXIoYXJndW1lbnRzW2luZGV4XSk7XG4gICAgICBpZiAoIWlzRmluaXRlKGNvZGVQb2ludCkgfHwgY29kZVBvaW50IDwgMCB8fCBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCkge1xuICAgICAgICB0aHJvdyBSYW5nZUVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQ6ICcgKyBjb2RlUG9pbnQpO1xuICAgICAgfVxuICAgICAgaWYgKGNvZGVQb2ludCA8PSAweEZGRkYpIHtcbiAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwO1xuICAgICAgICBoaWdoU3Vycm9nYXRlID0gKGNvZGVQb2ludCA+PiAxMCkgKyAweEQ4MDA7XG4gICAgICAgIGxvd1N1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgJSAweDQwMCkgKyAweERDMDA7XG4gICAgICAgIGNvZGVVbml0cy5wdXNoKGhpZ2hTdXJyb2dhdGUsIGxvd1N1cnJvZ2F0ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNvZGVVbml0cyk7XG4gIH1cbiAgZnVuY3Rpb24gc3RyaW5nUHJvdG90eXBlSXRlcmF0b3IoKSB7XG4gICAgdmFyIG8gPSBjaGVja09iamVjdENvZXJjaWJsZSh0aGlzKTtcbiAgICB2YXIgcyA9IFN0cmluZyhvKTtcbiAgICByZXR1cm4gY3JlYXRlU3RyaW5nSXRlcmF0b3Iocyk7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxTdHJpbmcoZ2xvYmFsKSB7XG4gICAgdmFyIFN0cmluZyA9IGdsb2JhbC5TdHJpbmc7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoU3RyaW5nLnByb3RvdHlwZSwgWydjb2RlUG9pbnRBdCcsIGNvZGVQb2ludEF0LCAnZW5kc1dpdGgnLCBlbmRzV2l0aCwgJ2luY2x1ZGVzJywgaW5jbHVkZXMsICdyZXBlYXQnLCByZXBlYXQsICdzdGFydHNXaXRoJywgc3RhcnRzV2l0aF0pO1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKFN0cmluZywgWydmcm9tQ29kZVBvaW50JywgZnJvbUNvZGVQb2ludCwgJ3JhdycsIHJhd10pO1xuICAgIG1heWJlQWRkSXRlcmF0b3IoU3RyaW5nLnByb3RvdHlwZSwgc3RyaW5nUHJvdG90eXBlSXRlcmF0b3IsIFN5bWJvbCk7XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbFN0cmluZyk7XG4gIHJldHVybiB7XG4gICAgZ2V0IHN0YXJ0c1dpdGgoKSB7XG4gICAgICByZXR1cm4gc3RhcnRzV2l0aDtcbiAgICB9LFxuICAgIGdldCBlbmRzV2l0aCgpIHtcbiAgICAgIHJldHVybiBlbmRzV2l0aDtcbiAgICB9LFxuICAgIGdldCBpbmNsdWRlcygpIHtcbiAgICAgIHJldHVybiBpbmNsdWRlcztcbiAgICB9LFxuICAgIGdldCByZXBlYXQoKSB7XG4gICAgICByZXR1cm4gcmVwZWF0O1xuICAgIH0sXG4gICAgZ2V0IGNvZGVQb2ludEF0KCkge1xuICAgICAgcmV0dXJuIGNvZGVQb2ludEF0O1xuICAgIH0sXG4gICAgZ2V0IHJhdygpIHtcbiAgICAgIHJldHVybiByYXc7XG4gICAgfSxcbiAgICBnZXQgZnJvbUNvZGVQb2ludCgpIHtcbiAgICAgIHJldHVybiBmcm9tQ29kZVBvaW50O1xuICAgIH0sXG4gICAgZ2V0IHN0cmluZ1Byb3RvdHlwZUl0ZXJhdG9yKCkge1xuICAgICAgcmV0dXJuIHN0cmluZ1Byb3RvdHlwZUl0ZXJhdG9yO1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsU3RyaW5nO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmcuanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheUl0ZXJhdG9yLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheUl0ZXJhdG9yLmpzXCI7XG4gIHZhciAkX18yID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvQXJyYXlJdGVyYXRvci5qc1wiKSksXG4gICAgICB0b09iamVjdCA9ICRfXzIudG9PYmplY3QsXG4gICAgICB0b1VpbnQzMiA9ICRfXzIudG9VaW50MzIsXG4gICAgICBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCA9ICRfXzIuY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3Q7XG4gIHZhciBBUlJBWV9JVEVSQVRPUl9LSU5EX0tFWVMgPSAxO1xuICB2YXIgQVJSQVlfSVRFUkFUT1JfS0lORF9WQUxVRVMgPSAyO1xuICB2YXIgQVJSQVlfSVRFUkFUT1JfS0lORF9FTlRSSUVTID0gMztcbiAgdmFyIEFycmF5SXRlcmF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJF9fMTtcbiAgICBmdW5jdGlvbiBBcnJheUl0ZXJhdG9yKCkge31cbiAgICByZXR1cm4gKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoQXJyYXlJdGVyYXRvciwgKCRfXzEgPSB7fSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KCRfXzEsIFwibmV4dFwiLCB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVyYXRvciA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICB2YXIgYXJyYXkgPSBpdGVyYXRvci5pdGVyYXRvck9iamVjdF87XG4gICAgICAgIGlmICghYXJyYXkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QgaXMgbm90IGFuIEFycmF5SXRlcmF0b3InKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5kZXggPSBpdGVyYXRvci5hcnJheUl0ZXJhdG9yTmV4dEluZGV4XztcbiAgICAgICAgdmFyIGl0ZW1LaW5kID0gaXRlcmF0b3IuYXJyYXlJdGVyYXRpb25LaW5kXztcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRvVWludDMyKGFycmF5Lmxlbmd0aCk7XG4gICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBpdGVyYXRvci5hcnJheUl0ZXJhdG9yTmV4dEluZGV4XyA9IEluZmluaXR5O1xuICAgICAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCh1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfID0gaW5kZXggKyAxO1xuICAgICAgICBpZiAoaXRlbUtpbmQgPT0gQVJSQVlfSVRFUkFUT1JfS0lORF9WQUxVRVMpXG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KGFycmF5W2luZGV4XSwgZmFsc2UpO1xuICAgICAgICBpZiAoaXRlbUtpbmQgPT0gQVJSQVlfSVRFUkFUT1JfS0lORF9FTlRSSUVTKVxuICAgICAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdChbaW5kZXgsIGFycmF5W2luZGV4XV0sIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KGluZGV4LCBmYWxzZSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSksIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgkX18xLCBTeW1ib2wuaXRlcmF0b3IsIHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSksICRfXzEpLCB7fSk7XG4gIH0oKTtcbiAgZnVuY3Rpb24gY3JlYXRlQXJyYXlJdGVyYXRvcihhcnJheSwga2luZCkge1xuICAgIHZhciBvYmplY3QgPSB0b09iamVjdChhcnJheSk7XG4gICAgdmFyIGl0ZXJhdG9yID0gbmV3IEFycmF5SXRlcmF0b3I7XG4gICAgaXRlcmF0b3IuaXRlcmF0b3JPYmplY3RfID0gb2JqZWN0O1xuICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfID0gMDtcbiAgICBpdGVyYXRvci5hcnJheUl0ZXJhdGlvbktpbmRfID0ga2luZDtcbiAgICByZXR1cm4gaXRlcmF0b3I7XG4gIH1cbiAgZnVuY3Rpb24gZW50cmllcygpIHtcbiAgICByZXR1cm4gY3JlYXRlQXJyYXlJdGVyYXRvcih0aGlzLCBBUlJBWV9JVEVSQVRPUl9LSU5EX0VOVFJJRVMpO1xuICB9XG4gIGZ1bmN0aW9uIGtleXMoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUFycmF5SXRlcmF0b3IodGhpcywgQVJSQVlfSVRFUkFUT1JfS0lORF9LRVlTKTtcbiAgfVxuICBmdW5jdGlvbiB2YWx1ZXMoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUFycmF5SXRlcmF0b3IodGhpcywgQVJSQVlfSVRFUkFUT1JfS0lORF9WQUxVRVMpO1xuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0IGVudHJpZXMoKSB7XG4gICAgICByZXR1cm4gZW50cmllcztcbiAgICB9LFxuICAgIGdldCBrZXlzKCkge1xuICAgICAgcmV0dXJuIGtleXM7XG4gICAgfSxcbiAgICBnZXQgdmFsdWVzKCkge1xuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvQXJyYXkuanNcIjtcbiAgdmFyICRfXzkgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9BcnJheUl0ZXJhdG9yLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5LmpzXCIpKSxcbiAgICAgIGVudHJpZXMgPSAkX185LmVudHJpZXMsXG4gICAgICBrZXlzID0gJF9fOS5rZXlzLFxuICAgICAganNWYWx1ZXMgPSAkX185LnZhbHVlcztcbiAgdmFyICRfXzEwID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvQXJyYXkuanNcIikpLFxuICAgICAgY2hlY2tJdGVyYWJsZSA9ICRfXzEwLmNoZWNrSXRlcmFibGUsXG4gICAgICBpc0NhbGxhYmxlID0gJF9fMTAuaXNDYWxsYWJsZSxcbiAgICAgIGlzQ29uc3RydWN0b3IgPSAkX18xMC5pc0NvbnN0cnVjdG9yLFxuICAgICAgbWF5YmVBZGRGdW5jdGlvbnMgPSAkX18xMC5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIG1heWJlQWRkSXRlcmF0b3IgPSAkX18xMC5tYXliZUFkZEl0ZXJhdG9yLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzEwLnJlZ2lzdGVyUG9seWZpbGwsXG4gICAgICB0b0ludGVnZXIgPSAkX18xMC50b0ludGVnZXIsXG4gICAgICB0b0xlbmd0aCA9ICRfXzEwLnRvTGVuZ3RoLFxuICAgICAgdG9PYmplY3QgPSAkX18xMC50b09iamVjdDtcbiAgZnVuY3Rpb24gZnJvbShhcnJMaWtlKSB7XG4gICAgdmFyIG1hcEZuID0gYXJndW1lbnRzWzFdO1xuICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciBDID0gdGhpcztcbiAgICB2YXIgaXRlbXMgPSB0b09iamVjdChhcnJMaWtlKTtcbiAgICB2YXIgbWFwcGluZyA9IG1hcEZuICE9PSB1bmRlZmluZWQ7XG4gICAgdmFyIGsgPSAwO1xuICAgIHZhciBhcnIsXG4gICAgICAgIGxlbjtcbiAgICBpZiAobWFwcGluZyAmJiAhaXNDYWxsYWJsZShtYXBGbikpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICBpZiAoY2hlY2tJdGVyYWJsZShpdGVtcykpIHtcbiAgICAgIGFyciA9IGlzQ29uc3RydWN0b3IoQykgPyBuZXcgQygpIDogW107XG4gICAgICB2YXIgJF9fMyA9IHRydWU7XG4gICAgICB2YXIgJF9fNCA9IGZhbHNlO1xuICAgICAgdmFyICRfXzUgPSB1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKHZhciAkX18xID0gdm9pZCAwLFxuICAgICAgICAgICAgJF9fMCA9IChpdGVtcylbU3ltYm9sLml0ZXJhdG9yXSgpOyAhKCRfXzMgPSAoJF9fMSA9ICRfXzAubmV4dCgpKS5kb25lKTsgJF9fMyA9IHRydWUpIHtcbiAgICAgICAgICB2YXIgaXRlbSA9ICRfXzEudmFsdWU7XG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKG1hcHBpbmcpIHtcbiAgICAgICAgICAgICAgYXJyW2tdID0gbWFwRm4uY2FsbCh0aGlzQXJnLCBpdGVtLCBrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFycltrXSA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoICgkX182KSB7XG4gICAgICAgICRfXzQgPSB0cnVlO1xuICAgICAgICAkX181ID0gJF9fNjtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKCEkX18zICYmICRfXzAucmV0dXJuICE9IG51bGwpIHtcbiAgICAgICAgICAgICRfXzAucmV0dXJuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGlmICgkX180KSB7XG4gICAgICAgICAgICB0aHJvdyAkX181O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXJyLmxlbmd0aCA9IGs7XG4gICAgICByZXR1cm4gYXJyO1xuICAgIH1cbiAgICBsZW4gPSB0b0xlbmd0aChpdGVtcy5sZW5ndGgpO1xuICAgIGFyciA9IGlzQ29uc3RydWN0b3IoQykgPyBuZXcgQyhsZW4pIDogbmV3IEFycmF5KGxlbik7XG4gICAgZm9yICg7IGsgPCBsZW47IGsrKykge1xuICAgICAgaWYgKG1hcHBpbmcpIHtcbiAgICAgICAgYXJyW2tdID0gdHlwZW9mIHRoaXNBcmcgPT09ICd1bmRlZmluZWQnID8gbWFwRm4oaXRlbXNba10sIGspIDogbWFwRm4uY2FsbCh0aGlzQXJnLCBpdGVtc1trXSwgayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcnJba10gPSBpdGVtc1trXTtcbiAgICAgIH1cbiAgICB9XG4gICAgYXJyLmxlbmd0aCA9IGxlbjtcbiAgICByZXR1cm4gYXJyO1xuICB9XG4gIGZ1bmN0aW9uIG9mKCkge1xuICAgIGZvciAodmFyIGl0ZW1zID0gW10sXG4gICAgICAgICRfXzcgPSAwOyAkX183IDwgYXJndW1lbnRzLmxlbmd0aDsgJF9fNysrKVxuICAgICAgaXRlbXNbJF9fN10gPSBhcmd1bWVudHNbJF9fN107XG4gICAgdmFyIEMgPSB0aGlzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGFyciA9IGlzQ29uc3RydWN0b3IoQykgPyBuZXcgQyhsZW4pIDogbmV3IEFycmF5KGxlbik7XG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBsZW47IGsrKykge1xuICAgICAgYXJyW2tdID0gaXRlbXNba107XG4gICAgfVxuICAgIGFyci5sZW5ndGggPSBsZW47XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICBmdW5jdGlvbiBmaWxsKHZhbHVlKSB7XG4gICAgdmFyIHN0YXJ0ID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IDA7XG4gICAgdmFyIGVuZCA9IGFyZ3VtZW50c1syXTtcbiAgICB2YXIgb2JqZWN0ID0gdG9PYmplY3QodGhpcyk7XG4gICAgdmFyIGxlbiA9IHRvTGVuZ3RoKG9iamVjdC5sZW5ndGgpO1xuICAgIHZhciBmaWxsU3RhcnQgPSB0b0ludGVnZXIoc3RhcnQpO1xuICAgIHZhciBmaWxsRW5kID0gZW5kICE9PSB1bmRlZmluZWQgPyB0b0ludGVnZXIoZW5kKSA6IGxlbjtcbiAgICBmaWxsU3RhcnQgPSBmaWxsU3RhcnQgPCAwID8gTWF0aC5tYXgobGVuICsgZmlsbFN0YXJ0LCAwKSA6IE1hdGgubWluKGZpbGxTdGFydCwgbGVuKTtcbiAgICBmaWxsRW5kID0gZmlsbEVuZCA8IDAgPyBNYXRoLm1heChsZW4gKyBmaWxsRW5kLCAwKSA6IE1hdGgubWluKGZpbGxFbmQsIGxlbik7XG4gICAgd2hpbGUgKGZpbGxTdGFydCA8IGZpbGxFbmQpIHtcbiAgICAgIG9iamVjdFtmaWxsU3RhcnRdID0gdmFsdWU7XG4gICAgICBmaWxsU3RhcnQrKztcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBmaW5kKHByZWRpY2F0ZSkge1xuICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgIHJldHVybiBmaW5kSGVscGVyKHRoaXMsIHByZWRpY2F0ZSwgdGhpc0FyZyk7XG4gIH1cbiAgZnVuY3Rpb24gZmluZEluZGV4KHByZWRpY2F0ZSkge1xuICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgIHJldHVybiBmaW5kSGVscGVyKHRoaXMsIHByZWRpY2F0ZSwgdGhpc0FyZywgdHJ1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gZmluZEhlbHBlcihzZWxmLCBwcmVkaWNhdGUpIHtcbiAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1syXTtcbiAgICB2YXIgcmV0dXJuSW5kZXggPSBhcmd1bWVudHNbM10gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzNdIDogZmFsc2U7XG4gICAgdmFyIG9iamVjdCA9IHRvT2JqZWN0KHNlbGYpO1xuICAgIHZhciBsZW4gPSB0b0xlbmd0aChvYmplY3QubGVuZ3RoKTtcbiAgICBpZiAoIWlzQ2FsbGFibGUocHJlZGljYXRlKSkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9iamVjdFtpXTtcbiAgICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgb2JqZWN0KSkge1xuICAgICAgICByZXR1cm4gcmV0dXJuSW5kZXggPyBpIDogdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5JbmRleCA/IC0xIDogdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsQXJyYXkoZ2xvYmFsKSB7XG4gICAgdmFyICRfXzggPSBnbG9iYWwsXG4gICAgICAgIEFycmF5ID0gJF9fOC5BcnJheSxcbiAgICAgICAgT2JqZWN0ID0gJF9fOC5PYmplY3QsXG4gICAgICAgIFN5bWJvbCA9ICRfXzguU3ltYm9sO1xuICAgIHZhciB2YWx1ZXMgPSBqc1ZhbHVlcztcbiAgICBpZiAoU3ltYm9sICYmIFN5bWJvbC5pdGVyYXRvciAmJiBBcnJheS5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSkge1xuICAgICAgdmFsdWVzID0gQXJyYXkucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl07XG4gICAgfVxuICAgIG1heWJlQWRkRnVuY3Rpb25zKEFycmF5LnByb3RvdHlwZSwgWydlbnRyaWVzJywgZW50cmllcywgJ2tleXMnLCBrZXlzLCAndmFsdWVzJywgdmFsdWVzLCAnZmlsbCcsIGZpbGwsICdmaW5kJywgZmluZCwgJ2ZpbmRJbmRleCcsIGZpbmRJbmRleF0pO1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKEFycmF5LCBbJ2Zyb20nLCBmcm9tLCAnb2YnLCBvZl0pO1xuICAgIG1heWJlQWRkSXRlcmF0b3IoQXJyYXkucHJvdG90eXBlLCB2YWx1ZXMsIFN5bWJvbCk7XG4gICAgbWF5YmVBZGRJdGVyYXRvcihPYmplY3QuZ2V0UHJvdG90eXBlT2YoW10udmFsdWVzKCkpLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIFN5bWJvbCk7XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbEFycmF5KTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgZnJvbSgpIHtcbiAgICAgIHJldHVybiBmcm9tO1xuICAgIH0sXG4gICAgZ2V0IG9mKCkge1xuICAgICAgcmV0dXJuIG9mO1xuICAgIH0sXG4gICAgZ2V0IGZpbGwoKSB7XG4gICAgICByZXR1cm4gZmlsbDtcbiAgICB9LFxuICAgIGdldCBmaW5kKCkge1xuICAgICAgcmV0dXJuIGZpbmQ7XG4gICAgfSxcbiAgICBnZXQgZmluZEluZGV4KCkge1xuICAgICAgcmV0dXJuIGZpbmRJbmRleDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbEFycmF5KCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsQXJyYXk7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5LmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvYXNzaWduLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9hc3NpZ24uanNcIjtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cztcbiAgZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgICAgdmFyIHByb3BzID0gc291cmNlID09IG51bGwgPyBbXSA6IGtleXMoc291cmNlKTtcbiAgICAgIHZhciBwID0gdm9pZCAwLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICB2YXIgbmFtZSA9IHByb3BzW3BdO1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSBzb3VyY2VbbmFtZV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBhc3NpZ247XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9PYmplY3QuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiO1xuICB2YXIgJF9fMiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiKSksXG4gICAgICBtYXliZUFkZEZ1bmN0aW9ucyA9ICRfXzIubWF5YmVBZGRGdW5jdGlvbnMsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMi5yZWdpc3RlclBvbHlmaWxsO1xuICB2YXIgYXNzaWduID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vYXNzaWduLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyICRfXzAgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzAuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAkX18wLmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGdldE93blByb3BlcnR5TmFtZXMgPSAkX18wLmdldE93blByb3BlcnR5TmFtZXM7XG4gIGZ1bmN0aW9uIGlzKGxlZnQsIHJpZ2h0KSB7XG4gICAgaWYgKGxlZnQgPT09IHJpZ2h0KVxuICAgICAgcmV0dXJuIGxlZnQgIT09IDAgfHwgMSAvIGxlZnQgPT09IDEgLyByaWdodDtcbiAgICByZXR1cm4gbGVmdCAhPT0gbGVmdCAmJiByaWdodCAhPT0gcmlnaHQ7XG4gIH1cbiAgZnVuY3Rpb24gbWl4aW4odGFyZ2V0LCBzb3VyY2UpIHtcbiAgICB2YXIgcHJvcHMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZSk7XG4gICAgdmFyIHAsXG4gICAgICAgIGRlc2NyaXB0b3IsXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgIHZhciBuYW1lID0gcHJvcHNbcF07XG4gICAgICBkZXNjcmlwdG9yID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwgcHJvcHNbcF0pO1xuICAgICAgZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wc1twXSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxPYmplY3QoZ2xvYmFsKSB7XG4gICAgdmFyIE9iamVjdCA9IGdsb2JhbC5PYmplY3Q7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoT2JqZWN0LCBbJ2Fzc2lnbicsIGFzc2lnbiwgJ2lzJywgaXMsICdtaXhpbicsIG1peGluXSk7XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbE9iamVjdCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IGFzc2lnbigpIHtcbiAgICAgIHJldHVybiBhc3NpZ247XG4gICAgfSxcbiAgICBnZXQgaXMoKSB7XG4gICAgICByZXR1cm4gaXM7XG4gICAgfSxcbiAgICBnZXQgbWl4aW4oKSB7XG4gICAgICByZXR1cm4gbWl4aW47XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxPYmplY3QoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxPYmplY3Q7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL051bWJlci5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCI7XG4gIHZhciAkX18xID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCIpKSxcbiAgICAgIGlzTnVtYmVyID0gJF9fMS5pc051bWJlcixcbiAgICAgIG1heWJlQWRkQ29uc3RzID0gJF9fMS5tYXliZUFkZENvbnN0cyxcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMS5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18xLnJlZ2lzdGVyUG9seWZpbGwsXG4gICAgICB0b0ludGVnZXIgPSAkX18xLnRvSW50ZWdlcjtcbiAgdmFyICRhYnMgPSBNYXRoLmFicztcbiAgdmFyICRpc0Zpbml0ZSA9IGlzRmluaXRlO1xuICB2YXIgJGlzTmFOID0gaXNOYU47XG4gIHZhciBNQVhfU0FGRV9JTlRFR0VSID0gTWF0aC5wb3coMiwgNTMpIC0gMTtcbiAgdmFyIE1JTl9TQUZFX0lOVEVHRVIgPSAtTWF0aC5wb3coMiwgNTMpICsgMTtcbiAgdmFyIEVQU0lMT04gPSBNYXRoLnBvdygyLCAtNTIpO1xuICBmdW5jdGlvbiBOdW1iZXJJc0Zpbml0ZShudW1iZXIpIHtcbiAgICByZXR1cm4gaXNOdW1iZXIobnVtYmVyKSAmJiAkaXNGaW5pdGUobnVtYmVyKTtcbiAgfVxuICBmdW5jdGlvbiBpc0ludGVnZXIobnVtYmVyKSB7XG4gICAgcmV0dXJuIE51bWJlcklzRmluaXRlKG51bWJlcikgJiYgdG9JbnRlZ2VyKG51bWJlcikgPT09IG51bWJlcjtcbiAgfVxuICBmdW5jdGlvbiBOdW1iZXJJc05hTihudW1iZXIpIHtcbiAgICByZXR1cm4gaXNOdW1iZXIobnVtYmVyKSAmJiAkaXNOYU4obnVtYmVyKTtcbiAgfVxuICBmdW5jdGlvbiBpc1NhZmVJbnRlZ2VyKG51bWJlcikge1xuICAgIGlmIChOdW1iZXJJc0Zpbml0ZShudW1iZXIpKSB7XG4gICAgICB2YXIgaW50ZWdyYWwgPSB0b0ludGVnZXIobnVtYmVyKTtcbiAgICAgIGlmIChpbnRlZ3JhbCA9PT0gbnVtYmVyKVxuICAgICAgICByZXR1cm4gJGFicyhpbnRlZ3JhbCkgPD0gTUFYX1NBRkVfSU5URUdFUjtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsTnVtYmVyKGdsb2JhbCkge1xuICAgIHZhciBOdW1iZXIgPSBnbG9iYWwuTnVtYmVyO1xuICAgIG1heWJlQWRkQ29uc3RzKE51bWJlciwgWydNQVhfU0FGRV9JTlRFR0VSJywgTUFYX1NBRkVfSU5URUdFUiwgJ01JTl9TQUZFX0lOVEVHRVInLCBNSU5fU0FGRV9JTlRFR0VSLCAnRVBTSUxPTicsIEVQU0lMT05dKTtcbiAgICBtYXliZUFkZEZ1bmN0aW9ucyhOdW1iZXIsIFsnaXNGaW5pdGUnLCBOdW1iZXJJc0Zpbml0ZSwgJ2lzSW50ZWdlcicsIGlzSW50ZWdlciwgJ2lzTmFOJywgTnVtYmVySXNOYU4sICdpc1NhZmVJbnRlZ2VyJywgaXNTYWZlSW50ZWdlcl0pO1xuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxOdW1iZXIpO1xuICByZXR1cm4ge1xuICAgIGdldCBNQVhfU0FGRV9JTlRFR0VSKCkge1xuICAgICAgcmV0dXJuIE1BWF9TQUZFX0lOVEVHRVI7XG4gICAgfSxcbiAgICBnZXQgTUlOX1NBRkVfSU5URUdFUigpIHtcbiAgICAgIHJldHVybiBNSU5fU0FGRV9JTlRFR0VSO1xuICAgIH0sXG4gICAgZ2V0IEVQU0lMT04oKSB7XG4gICAgICByZXR1cm4gRVBTSUxPTjtcbiAgICB9LFxuICAgIGdldCBpc0Zpbml0ZSgpIHtcbiAgICAgIHJldHVybiBOdW1iZXJJc0Zpbml0ZTtcbiAgICB9LFxuICAgIGdldCBpc0ludGVnZXIoKSB7XG4gICAgICByZXR1cm4gaXNJbnRlZ2VyO1xuICAgIH0sXG4gICAgZ2V0IGlzTmFOKCkge1xuICAgICAgcmV0dXJuIE51bWJlcklzTmFOO1xuICAgIH0sXG4gICAgZ2V0IGlzU2FmZUludGVnZXIoKSB7XG4gICAgICByZXR1cm4gaXNTYWZlSW50ZWdlcjtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbE51bWJlcigpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbE51bWJlcjtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvZnJvdW5kLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9mcm91bmQuanNcIjtcbiAgdmFyICRpc0Zpbml0ZSA9IGlzRmluaXRlO1xuICB2YXIgJGlzTmFOID0gaXNOYU47XG4gIHZhciAkX18wID0gTWF0aCxcbiAgICAgIExOMiA9ICRfXzAuTE4yLFxuICAgICAgYWJzID0gJF9fMC5hYnMsXG4gICAgICBmbG9vciA9ICRfXzAuZmxvb3IsXG4gICAgICBsb2cgPSAkX18wLmxvZyxcbiAgICAgIG1pbiA9ICRfXzAubWluLFxuICAgICAgcG93ID0gJF9fMC5wb3c7XG4gIGZ1bmN0aW9uIHBhY2tJRUVFNzU0KHYsIGViaXRzLCBmYml0cykge1xuICAgIHZhciBiaWFzID0gKDEgPDwgKGViaXRzIC0gMSkpIC0gMSxcbiAgICAgICAgcyxcbiAgICAgICAgZSxcbiAgICAgICAgZixcbiAgICAgICAgbG4sXG4gICAgICAgIGksXG4gICAgICAgIGJpdHMsXG4gICAgICAgIHN0cixcbiAgICAgICAgYnl0ZXM7XG4gICAgZnVuY3Rpb24gcm91bmRUb0V2ZW4obikge1xuICAgICAgdmFyIHcgPSBmbG9vcihuKSxcbiAgICAgICAgICBmID0gbiAtIHc7XG4gICAgICBpZiAoZiA8IDAuNSlcbiAgICAgICAgcmV0dXJuIHc7XG4gICAgICBpZiAoZiA+IDAuNSlcbiAgICAgICAgcmV0dXJuIHcgKyAxO1xuICAgICAgcmV0dXJuIHcgJSAyID8gdyArIDEgOiB3O1xuICAgIH1cbiAgICBpZiAodiAhPT0gdikge1xuICAgICAgZSA9ICgxIDw8IGViaXRzKSAtIDE7XG4gICAgICBmID0gcG93KDIsIGZiaXRzIC0gMSk7XG4gICAgICBzID0gMDtcbiAgICB9IGVsc2UgaWYgKHYgPT09IEluZmluaXR5IHx8IHYgPT09IC1JbmZpbml0eSkge1xuICAgICAgZSA9ICgxIDw8IGViaXRzKSAtIDE7XG4gICAgICBmID0gMDtcbiAgICAgIHMgPSAodiA8IDApID8gMSA6IDA7XG4gICAgfSBlbHNlIGlmICh2ID09PSAwKSB7XG4gICAgICBlID0gMDtcbiAgICAgIGYgPSAwO1xuICAgICAgcyA9ICgxIC8gdiA9PT0gLUluZmluaXR5KSA/IDEgOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBzID0gdiA8IDA7XG4gICAgICB2ID0gYWJzKHYpO1xuICAgICAgaWYgKHYgPj0gcG93KDIsIDEgLSBiaWFzKSkge1xuICAgICAgICBlID0gbWluKGZsb29yKGxvZyh2KSAvIExOMiksIDEwMjMpO1xuICAgICAgICBmID0gcm91bmRUb0V2ZW4odiAvIHBvdygyLCBlKSAqIHBvdygyLCBmYml0cykpO1xuICAgICAgICBpZiAoZiAvIHBvdygyLCBmYml0cykgPj0gMikge1xuICAgICAgICAgIGUgPSBlICsgMTtcbiAgICAgICAgICBmID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZSA+IGJpYXMpIHtcbiAgICAgICAgICBlID0gKDEgPDwgZWJpdHMpIC0gMTtcbiAgICAgICAgICBmID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlID0gZSArIGJpYXM7XG4gICAgICAgICAgZiA9IGYgLSBwb3coMiwgZmJpdHMpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlID0gMDtcbiAgICAgICAgZiA9IHJvdW5kVG9FdmVuKHYgLyBwb3coMiwgMSAtIGJpYXMgLSBmYml0cykpO1xuICAgICAgfVxuICAgIH1cbiAgICBiaXRzID0gW107XG4gICAgZm9yIChpID0gZmJpdHM7IGk7IGkgLT0gMSkge1xuICAgICAgYml0cy5wdXNoKGYgJSAyID8gMSA6IDApO1xuICAgICAgZiA9IGZsb29yKGYgLyAyKTtcbiAgICB9XG4gICAgZm9yIChpID0gZWJpdHM7IGk7IGkgLT0gMSkge1xuICAgICAgYml0cy5wdXNoKGUgJSAyID8gMSA6IDApO1xuICAgICAgZSA9IGZsb29yKGUgLyAyKTtcbiAgICB9XG4gICAgYml0cy5wdXNoKHMgPyAxIDogMCk7XG4gICAgYml0cy5yZXZlcnNlKCk7XG4gICAgc3RyID0gYml0cy5qb2luKCcnKTtcbiAgICBieXRlcyA9IFtdO1xuICAgIHdoaWxlIChzdHIubGVuZ3RoKSB7XG4gICAgICBieXRlcy5wdXNoKHBhcnNlSW50KHN0ci5zdWJzdHJpbmcoMCwgOCksIDIpKTtcbiAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoOCk7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbiAgfVxuICBmdW5jdGlvbiB1bnBhY2tJRUVFNzU0KGJ5dGVzLCBlYml0cywgZmJpdHMpIHtcbiAgICB2YXIgYml0cyA9IFtdLFxuICAgICAgICBpLFxuICAgICAgICBqLFxuICAgICAgICBiLFxuICAgICAgICBzdHIsXG4gICAgICAgIGJpYXMsXG4gICAgICAgIHMsXG4gICAgICAgIGUsXG4gICAgICAgIGY7XG4gICAgZm9yIChpID0gYnl0ZXMubGVuZ3RoOyBpOyBpIC09IDEpIHtcbiAgICAgIGIgPSBieXRlc1tpIC0gMV07XG4gICAgICBmb3IgKGogPSA4OyBqOyBqIC09IDEpIHtcbiAgICAgICAgYml0cy5wdXNoKGIgJSAyID8gMSA6IDApO1xuICAgICAgICBiID0gYiA+PiAxO1xuICAgICAgfVxuICAgIH1cbiAgICBiaXRzLnJldmVyc2UoKTtcbiAgICBzdHIgPSBiaXRzLmpvaW4oJycpO1xuICAgIGJpYXMgPSAoMSA8PCAoZWJpdHMgLSAxKSkgLSAxO1xuICAgIHMgPSBwYXJzZUludChzdHIuc3Vic3RyaW5nKDAsIDEpLCAyKSA/IC0xIDogMTtcbiAgICBlID0gcGFyc2VJbnQoc3RyLnN1YnN0cmluZygxLCAxICsgZWJpdHMpLCAyKTtcbiAgICBmID0gcGFyc2VJbnQoc3RyLnN1YnN0cmluZygxICsgZWJpdHMpLCAyKTtcbiAgICBpZiAoZSA9PT0gKDEgPDwgZWJpdHMpIC0gMSkge1xuICAgICAgcmV0dXJuIGYgIT09IDAgPyBOYU4gOiBzICogSW5maW5pdHk7XG4gICAgfSBlbHNlIGlmIChlID4gMCkge1xuICAgICAgcmV0dXJuIHMgKiBwb3coMiwgZSAtIGJpYXMpICogKDEgKyBmIC8gcG93KDIsIGZiaXRzKSk7XG4gICAgfSBlbHNlIGlmIChmICE9PSAwKSB7XG4gICAgICByZXR1cm4gcyAqIHBvdygyLCAtKGJpYXMgLSAxKSkgKiAoZiAvIHBvdygyLCBmYml0cykpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcyA8IDAgPyAtMCA6IDA7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHVucGFja0YzMihiKSB7XG4gICAgcmV0dXJuIHVucGFja0lFRUU3NTQoYiwgOCwgMjMpO1xuICB9XG4gIGZ1bmN0aW9uIHBhY2tGMzIodikge1xuICAgIHJldHVybiBwYWNrSUVFRTc1NCh2LCA4LCAyMyk7XG4gIH1cbiAgZnVuY3Rpb24gZnJvdW5kKHgpIHtcbiAgICBpZiAoeCA9PT0gMCB8fCAhJGlzRmluaXRlKHgpIHx8ICRpc05hTih4KSkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIHJldHVybiB1bnBhY2tGMzIocGFja0YzMihOdW1iZXIoeCkpKTtcbiAgfVxuICByZXR1cm4ge2dldCBmcm91bmQoKSB7XG4gICAgICByZXR1cm4gZnJvdW5kO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWF0aC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWF0aC5qc1wiO1xuICB2YXIganNGcm91bmQgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9mcm91bmQuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWF0aC5qc1wiKSkuZnJvdW5kO1xuICB2YXIgJF9fMyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hdGguanNcIikpLFxuICAgICAgbWF5YmVBZGRGdW5jdGlvbnMgPSAkX18zLm1heWJlQWRkRnVuY3Rpb25zLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzMucmVnaXN0ZXJQb2x5ZmlsbCxcbiAgICAgIHRvVWludDMyID0gJF9fMy50b1VpbnQzMjtcbiAgdmFyICRpc0Zpbml0ZSA9IGlzRmluaXRlO1xuICB2YXIgJGlzTmFOID0gaXNOYU47XG4gIHZhciAkX18wID0gTWF0aCxcbiAgICAgIGFicyA9ICRfXzAuYWJzLFxuICAgICAgY2VpbCA9ICRfXzAuY2VpbCxcbiAgICAgIGV4cCA9ICRfXzAuZXhwLFxuICAgICAgZmxvb3IgPSAkX18wLmZsb29yLFxuICAgICAgbG9nID0gJF9fMC5sb2csXG4gICAgICBwb3cgPSAkX18wLnBvdyxcbiAgICAgIHNxcnQgPSAkX18wLnNxcnQ7XG4gIGZ1bmN0aW9uIGNsejMyKHgpIHtcbiAgICB4ID0gdG9VaW50MzIoK3gpO1xuICAgIGlmICh4ID09IDApXG4gICAgICByZXR1cm4gMzI7XG4gICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgaWYgKCh4ICYgMHhGRkZGMDAwMCkgPT09IDApIHtcbiAgICAgIHggPDw9IDE2O1xuICAgICAgcmVzdWx0ICs9IDE2O1xuICAgIH1cbiAgICA7XG4gICAgaWYgKCh4ICYgMHhGRjAwMDAwMCkgPT09IDApIHtcbiAgICAgIHggPDw9IDg7XG4gICAgICByZXN1bHQgKz0gODtcbiAgICB9XG4gICAgO1xuICAgIGlmICgoeCAmIDB4RjAwMDAwMDApID09PSAwKSB7XG4gICAgICB4IDw8PSA0O1xuICAgICAgcmVzdWx0ICs9IDQ7XG4gICAgfVxuICAgIDtcbiAgICBpZiAoKHggJiAweEMwMDAwMDAwKSA9PT0gMCkge1xuICAgICAgeCA8PD0gMjtcbiAgICAgIHJlc3VsdCArPSAyO1xuICAgIH1cbiAgICA7XG4gICAgaWYgKCh4ICYgMHg4MDAwMDAwMCkgPT09IDApIHtcbiAgICAgIHggPDw9IDE7XG4gICAgICByZXN1bHQgKz0gMTtcbiAgICB9XG4gICAgO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gaW11bCh4LCB5KSB7XG4gICAgeCA9IHRvVWludDMyKCt4KTtcbiAgICB5ID0gdG9VaW50MzIoK3kpO1xuICAgIHZhciB4aCA9ICh4ID4+PiAxNikgJiAweGZmZmY7XG4gICAgdmFyIHhsID0geCAmIDB4ZmZmZjtcbiAgICB2YXIgeWggPSAoeSA+Pj4gMTYpICYgMHhmZmZmO1xuICAgIHZhciB5bCA9IHkgJiAweGZmZmY7XG4gICAgcmV0dXJuIHhsICogeWwgKyAoKCh4aCAqIHlsICsgeGwgKiB5aCkgPDwgMTYpID4+PiAwKSB8IDA7XG4gIH1cbiAgZnVuY3Rpb24gc2lnbih4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID4gMClcbiAgICAgIHJldHVybiAxO1xuICAgIGlmICh4IDwgMClcbiAgICAgIHJldHVybiAtMTtcbiAgICByZXR1cm4geDtcbiAgfVxuICBmdW5jdGlvbiBsb2cxMCh4KSB7XG4gICAgcmV0dXJuIGxvZyh4KSAqIDAuNDM0Mjk0NDgxOTAzMjUxODI4O1xuICB9XG4gIGZ1bmN0aW9uIGxvZzIoeCkge1xuICAgIHJldHVybiBsb2coeCkgKiAxLjQ0MjY5NTA0MDg4ODk2MzQwNztcbiAgfVxuICBmdW5jdGlvbiBsb2cxcCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4IDwgLTEgfHwgJGlzTmFOKHgpKSB7XG4gICAgICByZXR1cm4gTmFOO1xuICAgIH1cbiAgICBpZiAoeCA9PT0gMCB8fCB4ID09PSBJbmZpbml0eSkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmICh4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgdmFyIG4gPSA1MDtcbiAgICBpZiAoeCA8IDAgfHwgeCA+IDEpIHtcbiAgICAgIHJldHVybiBsb2coMSArIHgpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IG47IGkrKykge1xuICAgICAgaWYgKChpICUgMikgPT09IDApIHtcbiAgICAgICAgcmVzdWx0IC09IHBvdyh4LCBpKSAvIGk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgKz0gcG93KHgsIGkpIC8gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBleHBtMSh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID09PSAtSW5maW5pdHkpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKCEkaXNGaW5pdGUoeCkgfHwgeCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIHJldHVybiBleHAoeCkgLSAxO1xuICB9XG4gIGZ1bmN0aW9uIGNvc2goeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmICgkaXNOYU4oeCkpIHtcbiAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIGlmICghJGlzRmluaXRlKHgpKSB7XG4gICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgfVxuICAgIGlmICh4IDwgMCkge1xuICAgICAgeCA9IC14O1xuICAgIH1cbiAgICBpZiAoeCA+IDIxKSB7XG4gICAgICByZXR1cm4gZXhwKHgpIC8gMjtcbiAgICB9XG4gICAgcmV0dXJuIChleHAoeCkgKyBleHAoLXgpKSAvIDI7XG4gIH1cbiAgZnVuY3Rpb24gc2luaCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICghJGlzRmluaXRlKHgpIHx8IHggPT09IDApIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICByZXR1cm4gKGV4cCh4KSAtIGV4cCgteCkpIC8gMjtcbiAgfVxuICBmdW5jdGlvbiB0YW5oKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKHggPT09IDApXG4gICAgICByZXR1cm4geDtcbiAgICBpZiAoISRpc0Zpbml0ZSh4KSlcbiAgICAgIHJldHVybiBzaWduKHgpO1xuICAgIHZhciBleHAxID0gZXhwKHgpO1xuICAgIHZhciBleHAyID0gZXhwKC14KTtcbiAgICByZXR1cm4gKGV4cDEgLSBleHAyKSAvIChleHAxICsgZXhwMik7XG4gIH1cbiAgZnVuY3Rpb24gYWNvc2goeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA8IDEpXG4gICAgICByZXR1cm4gTmFOO1xuICAgIGlmICghJGlzRmluaXRlKHgpKVxuICAgICAgcmV0dXJuIHg7XG4gICAgcmV0dXJuIGxvZyh4ICsgc3FydCh4ICsgMSkgKiBzcXJ0KHggLSAxKSk7XG4gIH1cbiAgZnVuY3Rpb24gYXNpbmgoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA9PT0gMCB8fCAhJGlzRmluaXRlKHgpKVxuICAgICAgcmV0dXJuIHg7XG4gICAgaWYgKHggPiAwKVxuICAgICAgcmV0dXJuIGxvZyh4ICsgc3FydCh4ICogeCArIDEpKTtcbiAgICByZXR1cm4gLWxvZygteCArIHNxcnQoeCAqIHggKyAxKSk7XG4gIH1cbiAgZnVuY3Rpb24gYXRhbmgoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtSW5maW5pdHk7XG4gICAgfVxuICAgIGlmICh4ID09PSAxKSB7XG4gICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgfVxuICAgIGlmICh4ID09PSAwKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYgKCRpc05hTih4KSB8fCB4IDwgLTEgfHwgeCA+IDEpIHtcbiAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIHJldHVybiAwLjUgKiBsb2coKDEgKyB4KSAvICgxIC0geCkpO1xuICB9XG4gIGZ1bmN0aW9uIGh5cG90KHgsIHkpIHtcbiAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIHZhciBtYXggPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuID0gYXJndW1lbnRzW2ldO1xuICAgICAgbiA9ICtuO1xuICAgICAgaWYgKG4gPT09IEluZmluaXR5IHx8IG4gPT09IC1JbmZpbml0eSlcbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgICAgbiA9IGFicyhuKTtcbiAgICAgIGlmIChuID4gbWF4KVxuICAgICAgICBtYXggPSBuO1xuICAgICAgYXJnc1tpXSA9IG47XG4gICAgfVxuICAgIGlmIChtYXggPT09IDApXG4gICAgICBtYXggPSAxO1xuICAgIHZhciBzdW0gPSAwO1xuICAgIHZhciBjb21wZW5zYXRpb24gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuID0gYXJnc1tpXSAvIG1heDtcbiAgICAgIHZhciBzdW1tYW5kID0gbiAqIG4gLSBjb21wZW5zYXRpb247XG4gICAgICB2YXIgcHJlbGltaW5hcnkgPSBzdW0gKyBzdW1tYW5kO1xuICAgICAgY29tcGVuc2F0aW9uID0gKHByZWxpbWluYXJ5IC0gc3VtKSAtIHN1bW1hbmQ7XG4gICAgICBzdW0gPSBwcmVsaW1pbmFyeTtcbiAgICB9XG4gICAgcmV0dXJuIHNxcnQoc3VtKSAqIG1heDtcbiAgfVxuICBmdW5jdGlvbiB0cnVuYyh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID4gMClcbiAgICAgIHJldHVybiBmbG9vcih4KTtcbiAgICBpZiAoeCA8IDApXG4gICAgICByZXR1cm4gY2VpbCh4KTtcbiAgICByZXR1cm4geDtcbiAgfVxuICB2YXIgZnJvdW5kLFxuICAgICAgZjMyO1xuICBpZiAodHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGYzMiA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XG4gICAgZnJvdW5kID0gZnVuY3Rpb24oeCkge1xuICAgICAgZjMyWzBdID0gTnVtYmVyKHgpO1xuICAgICAgcmV0dXJuIGYzMlswXTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGZyb3VuZCA9IGpzRnJvdW5kO1xuICB9XG4gIGZ1bmN0aW9uIGNicnQoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA9PT0gMClcbiAgICAgIHJldHVybiB4O1xuICAgIHZhciBuZWdhdGUgPSB4IDwgMDtcbiAgICBpZiAobmVnYXRlKVxuICAgICAgeCA9IC14O1xuICAgIHZhciByZXN1bHQgPSBwb3coeCwgMSAvIDMpO1xuICAgIHJldHVybiBuZWdhdGUgPyAtcmVzdWx0IDogcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsTWF0aChnbG9iYWwpIHtcbiAgICB2YXIgTWF0aCA9IGdsb2JhbC5NYXRoO1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKE1hdGgsIFsnYWNvc2gnLCBhY29zaCwgJ2FzaW5oJywgYXNpbmgsICdhdGFuaCcsIGF0YW5oLCAnY2JydCcsIGNicnQsICdjbHozMicsIGNsejMyLCAnY29zaCcsIGNvc2gsICdleHBtMScsIGV4cG0xLCAnZnJvdW5kJywgZnJvdW5kLCAnaHlwb3QnLCBoeXBvdCwgJ2ltdWwnLCBpbXVsLCAnbG9nMTAnLCBsb2cxMCwgJ2xvZzFwJywgbG9nMXAsICdsb2cyJywgbG9nMiwgJ3NpZ24nLCBzaWduLCAnc2luaCcsIHNpbmgsICd0YW5oJywgdGFuaCwgJ3RydW5jJywgdHJ1bmNdKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsTWF0aCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IGNsejMyKCkge1xuICAgICAgcmV0dXJuIGNsejMyO1xuICAgIH0sXG4gICAgZ2V0IGltdWwoKSB7XG4gICAgICByZXR1cm4gaW11bDtcbiAgICB9LFxuICAgIGdldCBzaWduKCkge1xuICAgICAgcmV0dXJuIHNpZ247XG4gICAgfSxcbiAgICBnZXQgbG9nMTAoKSB7XG4gICAgICByZXR1cm4gbG9nMTA7XG4gICAgfSxcbiAgICBnZXQgbG9nMigpIHtcbiAgICAgIHJldHVybiBsb2cyO1xuICAgIH0sXG4gICAgZ2V0IGxvZzFwKCkge1xuICAgICAgcmV0dXJuIGxvZzFwO1xuICAgIH0sXG4gICAgZ2V0IGV4cG0xKCkge1xuICAgICAgcmV0dXJuIGV4cG0xO1xuICAgIH0sXG4gICAgZ2V0IGNvc2goKSB7XG4gICAgICByZXR1cm4gY29zaDtcbiAgICB9LFxuICAgIGdldCBzaW5oKCkge1xuICAgICAgcmV0dXJuIHNpbmg7XG4gICAgfSxcbiAgICBnZXQgdGFuaCgpIHtcbiAgICAgIHJldHVybiB0YW5oO1xuICAgIH0sXG4gICAgZ2V0IGFjb3NoKCkge1xuICAgICAgcmV0dXJuIGFjb3NoO1xuICAgIH0sXG4gICAgZ2V0IGFzaW5oKCkge1xuICAgICAgcmV0dXJuIGFzaW5oO1xuICAgIH0sXG4gICAgZ2V0IGF0YW5oKCkge1xuICAgICAgcmV0dXJuIGF0YW5oO1xuICAgIH0sXG4gICAgZ2V0IGh5cG90KCkge1xuICAgICAgcmV0dXJuIGh5cG90O1xuICAgIH0sXG4gICAgZ2V0IHRydW5jKCkge1xuICAgICAgcmV0dXJuIHRydW5jO1xuICAgIH0sXG4gICAgZ2V0IGZyb3VuZCgpIHtcbiAgICAgIHJldHVybiBmcm91bmQ7XG4gICAgfSxcbiAgICBnZXQgY2JydCgpIHtcbiAgICAgIHJldHVybiBjYnJ0O1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsTWF0aCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbE1hdGg7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hdGguanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCI7XG4gIHZhciAkX181ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL3ByaXZhdGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha01hcC5qc1wiKSksXG4gICAgICBjcmVhdGVQcml2YXRlU3ltYm9sID0gJF9fNS5jcmVhdGVQcml2YXRlU3ltYm9sLFxuICAgICAgZGVsZXRlUHJpdmF0ZSA9ICRfXzUuZGVsZXRlUHJpdmF0ZSxcbiAgICAgIGdldFByaXZhdGUgPSAkX181LmdldFByaXZhdGUsXG4gICAgICBoYXNQcml2YXRlID0gJF9fNS5oYXNQcml2YXRlLFxuICAgICAgc2V0UHJpdmF0ZSA9ICRfXzUuc2V0UHJpdmF0ZTtcbiAgdmFyICRfXzYgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vZnJvemVuLWRhdGEuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha01hcC5qc1wiKSksXG4gICAgICBkZWxldGVGcm96ZW4gPSAkX182LmRlbGV0ZUZyb3plbixcbiAgICAgIGdldEZyb3plbiA9ICRfXzYuZ2V0RnJvemVuLFxuICAgICAgaGFzRnJvemVuID0gJF9fNi5oYXNGcm96ZW4sXG4gICAgICBzZXRGcm96ZW4gPSAkX182LnNldEZyb3plbjtcbiAgdmFyICRfXzcgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCIpKSxcbiAgICAgIGlzT2JqZWN0ID0gJF9fNy5pc09iamVjdCxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX183LnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBoYXNOYXRpdmVTeW1ib2wgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtNYXAuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkX18yID0gT2JqZWN0LFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18yLmRlZmluZVByb3BlcnR5LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJF9fMi5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBpc0V4dGVuc2libGUgPSAkX18yLmlzRXh0ZW5zaWJsZTtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciBzZW50aW5lbCA9IHt9O1xuICB2YXIgV2Vha01hcCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFdlYWtNYXAoKSB7XG4gICAgICB0aGlzLm5hbWVfID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICAgICAgdGhpcy5mcm96ZW5EYXRhXyA9IFtdO1xuICAgIH1cbiAgICByZXR1cm4gKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoV2Vha01hcCwge1xuICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSlcbiAgICAgICAgICB0aHJvdyBuZXcgJFR5cGVFcnJvcigna2V5IG11c3QgYmUgYW4gb2JqZWN0Jyk7XG4gICAgICAgIGlmICghaXNFeHRlbnNpYmxlKGtleSkpIHtcbiAgICAgICAgICBzZXRGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywga2V5LCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0UHJpdmF0ZShrZXksIHRoaXMubmFtZV8sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KGtleSkpXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBnZXRGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywga2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2V0UHJpdmF0ZShrZXksIHRoaXMubmFtZV8pO1xuICAgICAgfSxcbiAgICAgIGRlbGV0ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghaXNFeHRlbnNpYmxlKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gZGVsZXRlRnJvemVuKHRoaXMuZnJvemVuRGF0YV8sIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlbGV0ZVByaXZhdGUoa2V5LCB0aGlzLm5hbWVfKTtcbiAgICAgIH0sXG4gICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KGtleSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGhhc0Zyb3plbih0aGlzLmZyb3plbkRhdGFfLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNQcml2YXRlKGtleSwgdGhpcy5uYW1lXyk7XG4gICAgICB9XG4gICAgfSwge30pO1xuICB9KCk7XG4gIGZ1bmN0aW9uIG5lZWRzUG9seWZpbGwoZ2xvYmFsKSB7XG4gICAgdmFyICRfXzQgPSBnbG9iYWwsXG4gICAgICAgIFdlYWtNYXAgPSAkX180LldlYWtNYXAsXG4gICAgICAgIFN5bWJvbCA9ICRfXzQuU3ltYm9sO1xuICAgIGlmICghV2Vha01hcCB8fCAhaGFzTmF0aXZlU3ltYm9sKCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdmFyIG8gPSB7fTtcbiAgICAgIHZhciB3bSA9IG5ldyBXZWFrTWFwKFtbbywgZmFsc2VdXSk7XG4gICAgICByZXR1cm4gd20uZ2V0KG8pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxXZWFrTWFwKGdsb2JhbCkge1xuICAgIGlmIChuZWVkc1BvbHlmaWxsKGdsb2JhbCkpIHtcbiAgICAgIGdsb2JhbC5XZWFrTWFwID0gV2Vha01hcDtcbiAgICB9XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbFdlYWtNYXApO1xuICByZXR1cm4ge1xuICAgIGdldCBXZWFrTWFwKCkge1xuICAgICAgcmV0dXJuIFdlYWtNYXA7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxXZWFrTWFwKCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsV2Vha01hcDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha01hcC5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIjtcbiAgdmFyICRfXzUgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrU2V0LmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX181LmNyZWF0ZVByaXZhdGVTeW1ib2wsXG4gICAgICBkZWxldGVQcml2YXRlID0gJF9fNS5kZWxldGVQcml2YXRlLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzUuZ2V0UHJpdmF0ZSxcbiAgICAgIGhhc1ByaXZhdGUgPSAkX181Lmhhc1ByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fNS5zZXRQcml2YXRlO1xuICB2YXIgJF9fNiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9mcm96ZW4tZGF0YS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrU2V0LmpzXCIpKSxcbiAgICAgIGRlbGV0ZUZyb3plbiA9ICRfXzYuZGVsZXRlRnJvemVuLFxuICAgICAgZ2V0RnJvemVuID0gJF9fNi5nZXRGcm96ZW4sXG4gICAgICBzZXRGcm96ZW4gPSAkX182LnNldEZyb3plbjtcbiAgdmFyICRfXzcgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrU2V0LmpzXCIpKSxcbiAgICAgIGlzT2JqZWN0ID0gJF9fNy5pc09iamVjdCxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX183LnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBoYXNOYXRpdmVTeW1ib2wgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkX18yID0gT2JqZWN0LFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18yLmRlZmluZVByb3BlcnR5LFxuICAgICAgaXNFeHRlbnNpYmxlID0gJF9fMi5pc0V4dGVuc2libGU7XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgV2Vha1NldCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFdlYWtTZXQoKSB7XG4gICAgICB0aGlzLm5hbWVfID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICAgICAgdGhpcy5mcm96ZW5EYXRhXyA9IFtdO1xuICAgIH1cbiAgICByZXR1cm4gKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoV2Vha1NldCwge1xuICAgICAgYWRkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KHZhbHVlKSlcbiAgICAgICAgICB0aHJvdyBuZXcgJFR5cGVFcnJvcigndmFsdWUgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUodmFsdWUpKSB7XG4gICAgICAgICAgc2V0RnJvemVuKHRoaXMuZnJvemVuRGF0YV8sIHZhbHVlLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0UHJpdmF0ZSh2YWx1ZSwgdGhpcy5uYW1lXywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgZGVsZXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KHZhbHVlKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghaXNFeHRlbnNpYmxlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBkZWxldGVGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWxldGVQcml2YXRlKHZhbHVlLCB0aGlzLm5hbWVfKTtcbiAgICAgIH0sXG4gICAgICBoYXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghaXNPYmplY3QodmFsdWUpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEZyb3plbih0aGlzLmZyb3plbkRhdGFfLCB2YWx1ZSkgPT09IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNQcml2YXRlKHZhbHVlLCB0aGlzLm5hbWVfKTtcbiAgICAgIH1cbiAgICB9LCB7fSk7XG4gIH0oKTtcbiAgZnVuY3Rpb24gbmVlZHNQb2x5ZmlsbChnbG9iYWwpIHtcbiAgICB2YXIgJF9fNCA9IGdsb2JhbCxcbiAgICAgICAgV2Vha1NldCA9ICRfXzQuV2Vha1NldCxcbiAgICAgICAgU3ltYm9sID0gJF9fNC5TeW1ib2w7XG4gICAgaWYgKCFXZWFrU2V0IHx8ICFoYXNOYXRpdmVTeW1ib2woKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB2YXIgbyA9IHt9O1xuICAgICAgdmFyIHdtID0gbmV3IFdlYWtTZXQoW1tvXV0pO1xuICAgICAgcmV0dXJuICF3bS5oYXMobyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFdlYWtTZXQoZ2xvYmFsKSB7XG4gICAgaWYgKG5lZWRzUG9seWZpbGwoZ2xvYmFsKSkge1xuICAgICAgZ2xvYmFsLldlYWtTZXQgPSBXZWFrU2V0O1xuICAgIH1cbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsV2Vha1NldCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IFdlYWtTZXQoKSB7XG4gICAgICByZXR1cm4gV2Vha1NldDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFdlYWtTZXQoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxXZWFrU2V0O1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrU2V0LmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvcG9seWZpbGxzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9wb2x5ZmlsbHMuanNcIjtcbiAgdmFyIHBvbHlmaWxsQWxsID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvcG9seWZpbGxzLmpzXCIpKS5wb2x5ZmlsbEFsbDtcbiAgcG9seWZpbGxBbGwoUmVmbGVjdC5nbG9iYWwpO1xuICB2YXIgc2V0dXBHbG9iYWxzID0gJHRyYWNldXJSdW50aW1lLnNldHVwR2xvYmFscztcbiAgJHRyYWNldXJSdW50aW1lLnNldHVwR2xvYmFscyA9IGZ1bmN0aW9uKGdsb2JhbCkge1xuICAgIHNldHVwR2xvYmFscyhnbG9iYWwpO1xuICAgIHBvbHlmaWxsQWxsKGdsb2JhbCk7XG4gIH07XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9wb2x5ZmlsbHMuanNcIiArICcnKTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJwQkd2QXBcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByaW50aW5nKSB7XG4gIGZ1bmN0aW9uIENvbG9yKCkge1xuICAgIC8vIFRPRE9cbiAgfVxuICBcbiAgc3ByaW50aW5nLkNvbG9yID0gQ29sb3JcbiAgcmV0dXJuIHNwcmludGluZ1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByaW50aW5nKSB7XG4gIC8qKlxuICAgKiAjIyBDb25zdGFudHNcbiAgKi9cblxuICAvKiFcbiAgICogSW50ZXJuYWwga2V5IHVzZWQgdG8gdW5sb2NrICYgcnVuIGludGVybmFsIG1ldGhvZHMuXG4gICAqXG4gICAqIEBuYW1lIElOVEVSTkFMX0tFWVxuICAqL1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc3ByaW50aW5nLCAnSU5URVJOQUxfS0VZJywge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6IFN5bWJvbCgnSW50ZXJuYWxBUEknKSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcblxuICAvKiFcbiAgICogSW50ZXJuYWwgbWV0aG9kIGZvciB2YWxpZGF0aW5nIGEgZ2l2ZW4gYGtleWBcbiAgICpcbiAgICogQGZ1bmN0aW9uIFZBTElEQVRFX0tFWVxuICAgKiBAcGFyYW0ga2V5XG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAqL1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc3ByaW50aW5nLCAnVkFMSURBVEVfS0VZJywge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHN5bWJvbCwgZXJyKSB7XG4gICAgICBpZihzeW1ib2wgIT09IHNwcmludGluZy5JTlRFUk5BTF9LRVkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgfSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcblxuICAvKlxuICAgKiBAbmFtZSB2ZXJzaW9uXG4gICovXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzcHJpbnRpbmcsICd2ZXJzaW9uJywge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6ICcwLjAuMScsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG5cbiAgcmV0dXJuIHNwcmludGluZ1xufSIsIlwidXNlIHN0cmljdFwiO1xuIWZ1bmN0aW9uKCkge1xuICByZXF1aXJlKCd0cmFjZXVyL2Jpbi90cmFjZXVyLXJ1bnRpbWUnKTtcbiAgdmFyIHNwcmludGluZyA9IHt9O1xuICBzcHJpbnRpbmcgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpKHNwcmludGluZyk7XG4gIHNwcmludGluZyA9IHJlcXVpcmUoJy4vd29ybGQnKShzcHJpbnRpbmcpO1xuICBzcHJpbnRpbmcgPSByZXF1aXJlKCcuL2NvbG9yJykoc3ByaW50aW5nKTtcbiAgc3ByaW50aW5nID0gcmVxdWlyZSgnLi90aGluZ3MnKShzcHJpbnRpbmcpO1xuICBzcHJpbnRpbmcgPSByZXF1aXJlKCcuL3RoaW5ncy5zaGFwZXMnKShzcHJpbnRpbmcpO1xuICBzcHJpbnRpbmcgPSByZXF1aXJlKCcuL3RoaW5ncy5zaGFwZXMucmVjdGFuZ2xlcycpKHNwcmludGluZyk7XG4gIFNxdWFyZS5wcm90b3R5cGUgPSBuZXcgc3ByaW50aW5nLlJlY3RhbmdsZTtcbiAgU3F1YXJlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNxdWFyZTtcbiAgU3F1YXJlLnByb3RvdHlwZS51YmVyID0gc3ByaW50aW5nLlJlY3RhbmdsZS5wcm90b3R5cGU7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdTcHJpbnRpbmcnLCB7XG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBzcHJpbnRpbmcsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xufSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJpbnRpbmcpIHtcbiAgLyoqXG4gICAqICMjIFRoaW5nc1xuICAgKi9cblxuICAvKipcbiAgICogU29tZXRoaW5nIHRoYXQgaXMgY29udGFpbmVkIHdpdGhpbiB0aGUgW1dvcmxkXSgjdGhlLXdvcmxkKS5cbiAgICpcbiAgICogQGZ1bmN0aW9uIFRoaW5nXG4gICAqIEBwYXJhbSB7U3ltYm9sfSBzeW1ib2wgU3ltYm9sIHdoaWNoLCBmb3IgdGhlIGNvbnN0cnVjdG9yIHRvIGJlIGNhbGxhYmxlLCBtdXN0IGJlIHRoZSBoaWRkZW4gU3ByaW50aW5nLklOVEVSTkFMX0tFWS4gKipSZXF1aXJlZCoqLlxuICAgKi9cbiAgZnVuY3Rpb24gVGhpbmcoc3ltYm9sKSB7XG4gICAgc3ByaW50aW5nLlZBTElEQVRFX0tFWShzeW1ib2wsICduZXcgVGhpbmcoKTogSWxsZWdhbCBjb25zdHJ1Y3Rpb24gb2YgYWJzdHJhY3QgY2xhc3MgVGhpbmcuJylcbiAgfVxuXG4gIHNwcmludGluZy5UaGluZyA9IFRoaW5nXG4gIHJldHVybiBzcHJpbnRpbmdcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmludGluZykge1xuICAvKipcbiAgICogIyMgU2hhcGVzXG4gICAqL1xuXG4gIFNoYXBlLnByb3RvdHlwZSA9IG5ldyBzcHJpbnRpbmcuVGhpbmcoc3ByaW50aW5nLklOVEVSTkFMX0tFWSlcbiAgU2hhcGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU2hhcGVcbiAgU2hhcGUucHJvdG90eXBlLnViZXIgPSBzcHJpbnRpbmcuVGhpbmcucHJvdG90eXBlXG5cbiAgLyohXG4gICAqIEEgU2hhcGUgaXMgYSBbVGhpbmddKCN0aGluZ3MpIHdpdGggYSBzdHJva2UgYW5kIGZpbGwuXG4gICAqXG4gICAqIEBmdW5jdGlvbiBTaGFwZVxuICAgKiBAc2VlIFRoaW5nXG4gICAqIEBwYXJhbSB7U3ltYm9sfSBrZXkgW1NwcmludGluZy5JTlRFUk5BTF9LRVldKCNzcHJpbnRpbmdpbnRlcm5hbF9rZXkpLiAqKlJlcXVpcmVkKiouXG4gICAqIEBwYXJhbSB7Q29sb3IgfCBTdHJpbmd9IHN0cm9rZSBUaGUgc3Ryb2tlIChvdXRsaW5lKSBjb2xvciBvZiB0aGUgU2hhcGUuIEluc3RhbmNlIG9mIHNwcmludGluZy5Db2xvciBvciBoZXggc3RyaW5nLiAqKkRlZmF1bHRzIHRvIGBcIiMwMDAwMDBcImAqKi5cbiAgICogQHBhcmFtIHtDb2xvciB8IFN0cmluZ30gZmlsbCAgIFRoZSBmaWxsIChpbnNpZGUpIGNvbG9yIG9mIHRoZSBTaGFwZS4gSW5zdGFuY2Ugb2Ygc3ByaW50aW5nLkNvbG9yIG9yIGhleCBzdHJpbmcuICoqRGVmYXVsdHMgdG8gYFwiI0ZGRkZGRlwiYCoqLlxuICAgKi9cbiAgZnVuY3Rpb24gU2hhcGUoc3ltYm9sLCBzdHJva2UgPSAnIzAwMDAwMCcsIGZpbGwgPSAnI0ZGRkZGRicpIHtcbiAgICBzcHJpbnRpbmcuVkFMSURBVEVfS0VZKHN5bWJvbCwgJ25ldyBTaGFwZSgpOiBJbGxlZ2FsIGNvbnN0cnVjdGlvbiBvZiBhYnN0cmFjdCBjbGFzcyBTaGFwZS4nKVxuXG4gICAgaWYoIShzdHJva2UgaW5zdGFuY2VvZiBzcHJpbnRpbmcuQ29sb3IgfHwgdHlwZW9mIHN0cm9rZSA9PT0gJ3N0cmluZycpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbmV3IFNoYXBlKCk6IGFyZyAyIG11c3QgYmUgYSBTcHJpbnRpbmcuQ29sb3Igb3Igc3RyaW5nJylcbiAgICBpZighKGZpbGwgaW5zdGFuY2VvZiBzcHJpbnRpbmcuQ29sb3IgfHwgdHlwZW9mIGZpbGwgPT09ICdzdHJpbmcnKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25ldyBTaGFwZSgpOiBhcmcgMyBtdXN0IGJlIGEgU3ByaW50aW5nLkNvbG9yIG9yIHN0cmluZycpXG4gICAgdGhpcy5zdHJva2UgPSBzdHJva2UsIHRoaXMuZmlsbCA9IGZpbGxcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3cyB0aGlzIFNoYXBlIHRvIHRoZSBzY3JlZW4uXG4gICAqXG4gICAqIEBmdW5jdGlvbiBTaGFwZS5fZHJhd1xuICAgKiBAcGFyYW0ge1N5bWJvbH0ga2V5IFtTcHJpbnRpbmcuSU5URVJOQUxfS0VZXSgjc3ByaW50aW5naW50ZXJuYWxfa2V5KS4gKipSZXF1aXJlZCoqLlxuICAgKi9cbiAgU2hhcGUuX2RyYXcgPSBmdW5jdGlvbihzeW1ib2wpIHtcbiAgICBpZigheCBpbnN0YW5jZW9mIE51bWJlcilcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NoYXBlLmRyYXcoKTogYXJnIDIgbXVzdCBiZSBhIE51bWJlci4nKVxuICAgIGlmKCF5IGluc3RhbmNlb2YgTnVtYmVyKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2hhcGUuZHJhdygpOiBhcmcgMyBtdXN0IGJlIGEgTnVtYmVyLicpXG5cbiAgICBzcHJpbnRpbmcuVkFMSURBVEVfS0VZKHN5bWJvbCwgJ1NoYXBlLmRyYXcgaXMgcHJpdmF0ZSBhbmQgc2hvdWxkIG5vdCBiZSBjYWxsZWQuJylcbiAgfVxuXG4gIHNwcmludGluZy5TaGFwZSA9IFNoYXBlXG4gIHJldHVybiBzcHJpbnRpbmdcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmludGluZykgeyBcbiAgLyoqXG4gICAqICMjIFJlY3RhbmdsZXMgYW5kIFNxdWFyZXNcbiAgICovXG5cbiAgUmVjdGFuZ2xlLnByb3RvdHlwZSA9IG5ldyBzcHJpbnRpbmcuU2hhcGUoc3ByaW50aW5nLklOVEVSTkFMX0tFWSlcbiAgUmVjdGFuZ2xlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlY3RhbmdsZVxuICBSZWN0YW5nbGUucHJvdG90eXBlLnViZXIgPSBzcHJpbnRpbmcuU2hhcGUucHJvdG90eXBlXG5cbiAgLyoqXG4gICAqIEEgUmVjdGFuZ2xlIGlzIGEgW1NoYXBlXSgjc2hhcGVzKSB3aXRoIGEgd2lkdGggYW5kIGEgaGVpZ2h0LlxuICAgKlxuICAgKiBgYGBcbiAgICogbGV0IHJlY3QgPSBuZXcgU3ByaW50aW5nLlJlY3RhbmdsZSgxMDAsIDEwMClcbiAgICogd29ybGQuYWRkKHJlY3QsIDI1LCAyNSkpXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggICoqRGVmYXVsdCoqOiBgNTBgLlxuICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0ICoqRGVmYXVsdCoqOiBgNTBgLlxuICAgKiBAcGFyYW0ge0NvbG9yfSAgc3Ryb2tlICBUaGUgb3V0bGluZSBjb2xvciBvZiB0LWhlIFNoYXBlLiAqKkRlZmF1bHQqKjogYFwiIzAwMDAwMFwiYFxuICAgKiBAcGFyYW0ge0NvbG9yfSAgZmlsbCAgICBUaGUgaW5zaWRlICBjb2xvciBvZiB0aGUgU2hhcGUuICoqRGVmYXVsdCoqOiBgXCIjRkZGRkZGXCJgXG4gICAqL1xuICBmdW5jdGlvbiBSZWN0YW5nbGUod2lkdGggPSA1MCwgaGVpZ2h0ID0gNTAsIHN0cm9rZSwgZmlsbCkge1xuICAgIHRoaXMudWJlci5jb25zdHJ1Y3RvcihzcHJpbnRpbmcuSU5URVJOQUxfS0VZLCBzdHJva2UsIGZpbGwpXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCB0aGlzLnViZXIpIC8vIFVwZGF0ZSBvdXIgcHJvcGVydGllcyB0byBiZSB0aGUgc2FtZSBhcyBvdXIgdWJlclxuXG4gICAgaWYoIXdpZHRoIGluc3RhbmNlb2YgTnVtYmVyKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbmV3IFJlY3RhbmdsZSgpOiBhcmcgMSBtdXN0IGJlIGEgTnVtYmVyLicpXG4gICAgaWYoIWhlaWdodCBpbnN0YW5jZW9mIE51bWJlcilcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25ldyBSZWN0YW5nbGUoKTogYXJnIDIgbXVzdCBiZSBhIE51bWJlci4nKVxuICAgIHRoaXMud2lkdGggPSB3aWR0aCwgdGhpcy5oZWlnaHQgPSBoZWlnaHRcbiAgfVxuXG4gIFJlY3RhbmdsZS5wcm90b3R5cGUuX2RyYXcgPSBmdW5jdGlvbihrZXkpIHtcbiAgICB1YmVyLl9kcmF3KGtleSlcblxuICAgIC8vIEBUT0RPXG4gIH1cblxuICBzcHJpbnRpbmcuUmVjdGFuZ2xlID0gUmVjdGFuZ2xlXG5cbiAgLyoqXG4gICogQSBTcXVhcmUgaXMgYSBSZWN0YW5nbGUgYnV0IHdpdGggc2lkZSBsZW5ndGggKHJhdGhlciB0aGFuIHdpZHRoIGFuZCBoZWlnaHQpLlxuICAqXG4gICogYGBgXG4gICogbGV0IG15U3F1YXJlID0gbmV3IFNwcmludGluZy5TcXVhcmUoMTAwKVxuICAqIHdvcmxkLmFkZChteVNxdWFyZSlcbiAgKiBgYGBcbiAgKlxuICAqIEBzZWUgUmVjdGFuZ2xlXG4gICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCAqKkRlZmF1bHQqKjogYDUwYFxuICAqIEBwYXJhbSB7Q29sb3J9ICBzdHJva2UgKipEZWZhdWx0Kio6IGAjMDAwMDAwYFxuICAqIEBwYXJhbSB7Q29sb3J9ICBmaWxsICAgKipEZWZhdWx0Kio6IGAjRkZGRkZGYFxuICAqL1xuICBmdW5jdGlvbiBTcXVhcmUobGVuZ3RoID0gNTAsIHN0cm9rZSwgZmlsbCkge1xuICAgIHRoaXMudWJlci5jb25zdHJ1Y3RvcihsZW5ndGgsIGxlbmd0aCwgc3Ryb2tlLCBmaWxsKVxuICAgIE9iamVjdC5hc3NpZ24odGhpcywgdGhpcy51YmVyKSAvLyBVcGRhdGUgb3VyIHByb3BlcnRpZXMgdG8gYmUgdGhlIHNhbWUgYXMgb3VyIHViZXJcbiAgfVxuXG4gIFNxdWFyZS5wcm90b3R5cGUuX2RyYXcgPSBmdW5jdGlvbihzeW1ib2wsIHgsIHkpIHtcbiAgICB0aGlzLnViZXIuX2RyYXcoc3ltYm9sLCB4LCB5KVxuICB9XG5cbiAgc3ByaW50aW5nLlNxdWFyZSA9IFNxdWFyZVxuXG4gIHJldHVybiBzcHJpbnRpbmdcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmludGluZykge1xuICAvKipcbiAgICogIyMgVGhlIFdvcmxkXG4gICovXG5cbiAgLyoqXG4gICAqIFRoZSBXb3JsZCBjb250YWlucyBhbGwgdGhlIFRoaW5ncy5cbiAgICpcbiAgICogYGBganNcbiAgICogbGV0IHdvcmxkID0gbmV3IFNwcmludGluZy5Xb3JsZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd29ybGQnKSlcbiAgICogYGBgXG4gICAqXG4gICAqIEBmdW5jdGlvbiBXb3JsZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IERPTSBlbGVtZW50IHRvIGRyYXcgdG8uICoqUmVxdWlyZWQqKi5cbiAgICovXG4gIGZ1bmN0aW9uIFdvcmxkKGVsZW1lbnQpIHtcbiAgICBjb25zb2xlLmxvZyh0eXBlb2YgZWxlbWVudClcblxuICAgIGlmKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IHx8IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCduZXcgV29ybGQoKTogYXJnIDEgbXVzdCBiZSBhbiBIVE1MRWxlbWVudCBvciBzdHJpbmcuJylcblxuICAgIHRoaXMuZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCkgOiBlbGVtZW50XG4gICAgdGhpcy50aGluZ3MgID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgW1RoaW5nXSgjdGhpbmdzKSB0byB0aGUgW1dvcmxkXSgjdGhlLXdvcmxkKS5cbiAgICpcbiAgICogYGBganNcbiAgICogd29ybGQuYWRkKG5ldyBTcHJpbnRpbmcuU3F1YXJlKDEwMCksIDIwLCAzMClcbiAgICogYGBgXG4gICAqXG4gICAqIEBmdW5jdGlvbiBXb3JsZC5hZGRcbiAgICogQHBhcmFtIHtUaGluZ30gc29tZXRoaW5nIFRoZSBbdGhpbmddKCN0aGluZ3MpIHRvIGFkZCB0byBbV29ybGRdKCN0aGUtd29ybGQpLiAqKlJlcXVpcmVkKiouXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB4IHgtcG9zaXRpb24gb2YgVGhpbmcuICoqRGVmYXVsdCoqOiBgMGAuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB5IHktcG9zaXRpb24gb2YgVGhpbmcuICoqRGVmYXVsdCoqOiBgMGAuXG4gICAqL1xuICBXb3JsZC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oc29tZXRoaW5nLCB4ID0gMCwgeSA9IDApIHtcbiAgICBpZighc29tZXRoaW5nIGluc3RhbmNlb2Ygc3ByaW50aW5nLlRoaW5nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignV29ybGQuYWRkKCk6IGFyZyAxIG11c3QgYmUgYSBTcHJpbnRpbmcuVGhpbmcuJylcbiAgICBpZigheCBpbnN0YW5jZW9mIE51bWJlcilcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1dvcmxkLmFkZCgpOiBhcmcgMiBtdXN0IGJlIGEgTnVtYmVyLicpXG4gICAgaWYoIXkgaW5zdGFuY2VvZiBOdW1iZXIpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdXb3JsZC5hZGQoKTogYXJnIDMgbXVzdCBiZSBhIE51bWJlci4nKVxuXG4gICAgdGhpcy50aGluZ3MucHVzaCh7aW5zdDogc29tZXRoaW5nLCB4LCB5fSlcbiAgfVxuXG4gIC8qIVxuICAgKiBEcmF3cyBldmVyeSBbVGhpbmddKCN0aGluZ3MpIGluIHRoZSBbV29ybGRdKCN0aGUtd29ybGQpLlxuICAgKlxuICAgKiBAZnVuY3Rpb24gV29ybGQuX2RyYXdcbiAgICogQHBhcmFtIHtTeW1ib2x9IGtleSBbU3ByaW50aW5nLklOVEVSTkFMX0tFWV0oI3NwcmludGluZ2ludGVybmFsX2tleSkuICoqUmVxdWlyZWQqKi5cbiAgICovXG4gIFdvcmxkLnByb3RvdHlwZS5fZHJhdyA9IGZ1bmN0aW9uKHN5bWJvbCkge1xuICAgIHNwcmludGluZy5WQUxJREFURV9LRVkoc3ltYm9sLCAnV29ybGQuX2RyYXcoKTogV29ybGQuX2RyYXcoKSBpcyBwcml2YXRlIGFuZCBzaG91bGQgbm90IGJlIGNhbGxlZC4nKVxuXG4gICAgdGhpcy50aGluZ3MuZm9yRWFjaChmdW5jdGlvbih0aGluZykge1xuICAgICAgdGhpbmcuaW5zdC5kcmF3KHRoaW5nLngsIHRoaW5nLnkpXG4gICAgfSlcbiAgfVxuXG4gIHNwcmludGluZy5Xb3JsZCA9IFdvcmxkXG4gIHJldHVybiBzcHJpbnRpbmdcbn0iXX0=

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzcHJpbnRpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIWZ1bmN0aW9uKCkge1xuICByZXF1aXJlKCd0cmFjZXVyL2Jpbi90cmFjZXVyLXJ1bnRpbWUnKVxuXG4gIGxldCBzcHJpbnRpbmcgPSB7fVxuICBzcHJpbnRpbmcgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpKHNwcmludGluZylcbiAgc3ByaW50aW5nID0gcmVxdWlyZSgnLi93b3JsZCcpKHNwcmludGluZylcbiAgc3ByaW50aW5nID0gcmVxdWlyZSgnLi9jb2xvcicpKHNwcmludGluZylcbiAgc3ByaW50aW5nID0gcmVxdWlyZSgnLi90aGluZ3MnKShzcHJpbnRpbmcpXG4gIHNwcmludGluZyA9IHJlcXVpcmUoJy4vdGhpbmdzLnNoYXBlcycpKHNwcmludGluZylcbiAgc3ByaW50aW5nID0gcmVxdWlyZSgnLi90aGluZ3Muc2hhcGVzLnJlY3RhbmdsZXMnKShzcHJpbnRpbmcpXG5cbiAgU3F1YXJlLnByb3RvdHlwZSA9IG5ldyBzcHJpbnRpbmcuUmVjdGFuZ2xlXG4gIFNxdWFyZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTcXVhcmVcbiAgU3F1YXJlLnByb3RvdHlwZS51YmVyID0gc3ByaW50aW5nLlJlY3RhbmdsZS5wcm90b3R5cGVcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LCAnU3ByaW50aW5nJywge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogc3ByaW50aW5nLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufSgpXG4iXSwiZmlsZSI6InNwcmludGluZy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
