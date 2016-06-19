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
"use strict";
window.Sprinting = (function(S) {
  require('traceur/bin/traceur-runtime');
  var World = function() {
    function World(element) {
      var width = arguments[1] !== (void 0) ? arguments[1] : 800;
      var height = arguments[2] !== (void 0) ? arguments[2] : 600;
      var $__5 = this;
      switch ((typeof element === 'undefined' ? 'undefined' : $traceurRuntime.typeof(element))) {
        case 'string':
          if (element = document.querySelector(element)) {} else
            throw TypeError('element must be a CSS Selector or an HTMLElement');
          break;
        case 'undefined':
          throw TypeError('element must be a CSS Selector or an HTMLElement');
          break;
        default:
          if (!element instanceof HTMLElement)
            throw TypeError('element must be a CSS Selector or an HTMLElement');
          break;
      }
      if (typeof width !== 'number')
        throw TypeError('width must be a Number');
      if (typeof height !== 'number')
        throw TypeError('height must be a Number');
      this.width = width;
      this.height = height;
      this.el = element;
      this.el.style.width = this.w + 'px';
      this.el.style.height = this.h + 'px';
      this.el.style.cursor = 'default';
      this.el.style.outline = 'initial';
      this.el.setAttribute('tabindex', 0);
      this.canvas.setAttribute('width', this.w);
      this.canvas.setAttribute('height', this.h);
      this.el.addEventListener('contextmenu', function(e) {
        if (!$__5.focus)
          return;
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
      this.ctx = this.canvas.getContext('2d', {alpha: true});
      this.things = [];
      this.subLoops = [];
      this.initLoop();
      this.focus = true;
      this.el.addEventListener('blur', function(e) {
        $__5.focus = false;
      });
      this.el.addEventListener('focus', function(e) {
        $__5.focus = true;
        $__5.things.forEach(function(thing) {
          if (thing._el) {
            $__5.el.removeChild(thing._el);
            delete thing._el;
            thing._observer.disconnect();
            delete thing._observer;
          }
        });
      });
      this.new = true;
    }
    return ($traceurRuntime.createClass)(World, {
      get w() {
        return this.width;
      },
      set w(w) {
        this.width = w;
      },
      get h() {
        return this.height;
      },
      set h(h) {
        this.height = h;
      },
      get el() {
        return this.canvas;
      },
      set el(el) {
        this.canvas = el;
      },
      add: function(thing) {
        this.things.push(thing);
        return this;
      },
      draw: function() {
        var $__5 = this;
        if (this.focus || this.new) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.things.forEach(function(thing) {
            world.ctx.save();
            {
              world.ctx.translate(thing.x, thing.y);
              if (thing.r)
                world.ctx.rotate(thing.r * Math.PI / 180);
              world.ctx.translate(-thing.width * thing.rx, -thing.height * thing.ry);
            }
            thing.draw($__5);
            world.ctx.restore();
          });
          if (this.new)
            delete this.new;
        } else {
          this.things.forEach(function(thing) {
            if (!thing._el) {
              Object.defineProperty(thing, '_el', {
                configurable: true,
                writable: true,
                value: document.createElement(thing.constructor.name)
              });
              Object.defineProperty(thing, '_observer', {
                configurable: true,
                writable: true,
                value: new MutationObserver(function(mutation) {
                  var attr = mutation[0].attributeName;
                  thing[attr] = thing._el.getAttribute(attr);
                  $__5.new = true;
                  $__5.draw();
                })
              });
              var el = thing._el;
              var observer = thing._observer;
              for (var attr in thing) {
                thing._el.setAttribute(attr, thing[attr]);
              }
              world.el.appendChild(thing._el);
              observer.observe(el, {attributes: true});
            }
          });
        }
        return this;
      },
      initLoop: function() {
        var tick = function() {
          var $__5 = this;
          this.draw();
          if (this.focus)
            this.subLoops.forEach(function(loop) {
              return loop();
            });
          window.setTimeout(function() {
            return window.requestAnimationFrame(tick.bind($__5));
          }, this.msPerTick);
        };
        tick.call(this);
      },
      setFrameRate: function(fps) {
        this.msPerTick = 1000 / fps;
        return this;
      },
      drawLoop: function(fn) {
        this.subLoops.push(fn);
        return this;
      },
      scale: function() {
        this.el.style.width = '100%';
        this.el.style.height = '100%';
        this.el.style.objectFit = 'contain';
        return this;
      }
    }, {});
  }();
  var Thing = function() {
    function Thing() {
      var quiet = arguments[0] !== (void 0) ? arguments[0] : false;
      if (!quiet)
        console.warn('Things should never be constructed directly!');
      this.x = 0;
      this.y = 0;
      this.r = 0;
      this.rx = 0.5;
      this.ry = 0.5;
    }
    return ($traceurRuntime.createClass)(Thing, {draw: function() {
        throw Error('Things cannot be drawn unless extended.');
      }}, {});
  }();
  var Shape = function($__super) {
    function Shape() {
      var stroke = arguments[0] !== (void 0) ? arguments[0] : '#000';
      var fill = arguments[1] !== (void 0) ? arguments[1] : 'transparent';
      var strokeWidth = arguments[2] !== (void 0) ? arguments[2] : 1;
      var quiet = arguments[3] !== (void 0) ? arguments[3] : false;
      $traceurRuntime.superConstructor(Shape).call(this, true);
      if (!quiet)
        console.warn('Shapes should never be constructed directly!');
      if (!stroke instanceof String)
        throw TypeError('stroke must be a String');
      this.stroke = stroke;
      if (!fill instanceof String)
        throw TypeError('fill must be a String');
      this.fill = fill;
      if (!strokeWidth instanceof Number)
        throw TypeError('strokeWidth must be a Number');
      this.strokeWidth = strokeWidth;
    }
    return ($traceurRuntime.createClass)(Shape, {draw: function() {
        throw Error('Shapes cannot be drawn unless extended.');
      }}, {}, $__super);
  }(Thing);
  var SizedShape = function($__super) {
    function SizedShape() {
      var width = arguments[0] !== (void 0) ? arguments[0] : 50;
      var height = arguments[1] !== (void 0) ? arguments[1] : 50;
      var stroke = arguments[2] !== (void 0) ? arguments[2] : '#000';
      var fill = arguments[3] !== (void 0) ? arguments[3] : 'transparent';
      var strokeWidth = arguments[4] !== (void 0) ? arguments[4] : 1;
      var quiet = arguments[5] !== (void 0) ? arguments[5] : false;
      $traceurRuntime.superConstructor(SizedShape).call(this, stroke, fill, strokeWidth, quiet);
      if (!(typeof width === 'number'))
        throw new TypeError('width must be a Number');
      this.width = width;
      if (!(typeof height === 'number'))
        throw new TypeError('height must be a Number');
      this.height = height;
    }
    return ($traceurRuntime.createClass)(SizedShape, {}, {}, $__super);
  }(Shape);
  var Rectangle = function($__super) {
    function Rectangle() {
      var width = arguments[0] !== (void 0) ? arguments[0] : 100;
      var height = arguments[1] !== (void 0) ? arguments[1] : 75;
      var stroke = arguments[2] !== (void 0) ? arguments[2] : '#000';
      var fill = arguments[3] !== (void 0) ? arguments[3] : 'transparent';
      var strokeWidth = arguments[4] !== (void 0) ? arguments[4] : 1;
      $traceurRuntime.superConstructor(Rectangle).call(this, width, height, stroke, fill, strokeWidth, true);
    }
    return ($traceurRuntime.createClass)(Rectangle, {draw: function(world) {
        if (!world instanceof World)
          throw TypeError('world must be a World');
        world.ctx.strokeStyle = this.stroke;
        world.ctx.fillStyle = this.fill;
        world.ctx.lineWidth = this.strokeWidth;
        world.ctx.fillRect(0, 0, this.width, this.height);
        world.ctx.strokeRect(0, 0, this.width, this.height);
      }}, {}, $__super);
  }(SizedShape);
  var Circle = function($__super) {
    function Circle() {
      var width = arguments[0] !== (void 0) ? arguments[0] : 100;
      var height = arguments[1] !== (void 0) ? arguments[1] : 100;
      var stroke = arguments[2] !== (void 0) ? arguments[2] : '#000';
      var fill = arguments[3] !== (void 0) ? arguments[3] : 'transparent';
      var strokeWidth = arguments[4] !== (void 0) ? arguments[4] : 1;
      $traceurRuntime.superConstructor(Circle).call(this, width, height, stroke, fill, strokeWidth, true);
    }
    return ($traceurRuntime.createClass)(Circle, {draw: function(world) {
        if (!world instanceof World)
          throw TypeError('world must be a World');
        var specialConst = .5522848,
            cpOffsetX = (this.width / 2) * specialConst,
            cpOffsetY = (this.height / 2) * specialConst,
            greatestX = this.width,
            greatestY = this.height,
            centerX = this.width / 2,
            centerY = this.height / 2;
        world.ctx.strokeStyle = this.stroke;
        world.ctx.fillStyle = this.fill;
        world.ctx.lineWidth = this.strokeWidth;
        world.ctx.beginPath();
        world.ctx.moveTo(0, centerY);
        world.ctx.bezierCurveTo(0, centerY - cpOffsetY, centerX - cpOffsetX, 0, centerX, 0);
        world.ctx.bezierCurveTo(centerX + cpOffsetX, 0, greatestX, centerY - cpOffsetY, greatestX, centerY);
        world.ctx.bezierCurveTo(greatestX, centerY + cpOffsetY, centerX + cpOffsetX, greatestY, centerX, greatestY);
        world.ctx.bezierCurveTo(centerX - cpOffsetX, greatestY, 0, centerY + cpOffsetY, 0, centerY);
        world.ctx.fill();
        world.ctx.stroke();
      }}, {}, $__super);
  }(SizedShape);
  var Img = function($__super) {
    function Img(src) {
      var width = arguments[1] !== (void 0) ? arguments[1] : 'auto';
      var height = arguments[2] !== (void 0) ? arguments[2] : 'auto';
      var $__5,
          $__6,
          $__7,
          $__8;
      $traceurRuntime.superConstructor(Img).call(this, true);
      Object.defineProperty(this, '_src', {
        writable: true,
        value: src
      });
      Object.defineProperty(this, 'load', {value: function() {
          var $__5;
          Object.defineProperty(this, 'img', {
            writable: true,
            value: new Image()
          });
          this.loaded = false;
          this.img.addEventListener('load', ($__5 = this, function() {
            return $__5.loaded = true;
          }));
          this.img.src = src;
          this._src = src;
          this.src = src;
        }});
      this.load();
      if (!src instanceof String)
        throw TypeError('src must be a String');
      this.src = src;
      this.loaded = false;
      if (typeof width !== 'number' && width !== 'auto')
        throw TypeError('width must be a Number or "auto"');
      Object.defineProperty(this, '_width', {
        value: width,
        writable: true
      });
      if (typeof width !== 'number' && height !== 'auto')
        throw TypeError('height must be a Number or "auto"');
      Object.defineProperty(this, '_height', {
        value: height,
        writable: true
      });
      Object.defineProperty(this, 'width', {
        get: ($__5 = this, function() {
          return $__5._width === 'auto' ? $__5.img.width : $__5._width;
        }),
        set: ($__6 = this, function(w) {
          return $__6._width = w;
        }),
        enumerable: true
      });
      Object.defineProperty(this, 'height', {
        get: ($__7 = this, function() {
          return $__7._height === 'auto' ? $__7.img.height : $__7._height;
        }),
        set: ($__8 = this, function(h) {
          return $__8._height = h;
        }),
        enumerable: true
      });
    }
    return ($traceurRuntime.createClass)(Img, {draw: function(world) {
        if (!world instanceof World)
          throw TypeError('world must be a World');
        if (this._src !== this.src)
          this.loaded = false;
        if (this.loaded) {
          world.ctx.drawImage(this.img, 0, 0, this.width, this.height);
        } else {
          this.load();
        }
      }}, {}, $__super);
  }(Thing);
  var pointer = {
    x: 0,
    y: 0,
    down: function(which) {
      return false;
    }
  };
  S.pointer = pointer;
  S.touch = pointer;
  S.mouse = pointer;
  S.World = World;
  S.Thing = Thing;
  S.Shape = Shape;
  S.Rectangle = Rectangle;
  S.Circle = Circle;
  S.Img = Img;
  return S;
}({}));



},{"traceur/bin/traceur-runtime":3}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2FsZXgvc3ByaW50aW5nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hbGV4L3NwcmludGluZy9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiL2hvbWUvYWxleC9zcHJpbnRpbmcvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2FsZXgvc3ByaW50aW5nL25vZGVfbW9kdWxlcy90cmFjZXVyL2Jpbi90cmFjZXVyLXJ1bnRpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJwQkd2QXBcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBpZiAoZ2xvYmFsLiR0cmFjZXVyUnVudGltZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBmdW5jdGlvbiBzZXR1cEdsb2JhbHMoZ2xvYmFsKSB7XG4gICAgZ2xvYmFsLlJlZmxlY3QgPSBnbG9iYWwuUmVmbGVjdCB8fCB7fTtcbiAgICBnbG9iYWwuUmVmbGVjdC5nbG9iYWwgPSBnbG9iYWwuUmVmbGVjdC5nbG9iYWwgfHwgZ2xvYmFsO1xuICB9XG4gIHNldHVwR2xvYmFscyhnbG9iYWwpO1xuICB2YXIgdHlwZU9mID0gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiB0eXBlb2YgeDtcbiAgfTtcbiAgZ2xvYmFsLiR0cmFjZXVyUnVudGltZSA9IHtcbiAgICBvcHRpb25zOiB7fSxcbiAgICBzZXR1cEdsb2JhbHM6IHNldHVwR2xvYmFscyxcbiAgICB0eXBlb2Y6IHR5cGVPZlxuICB9O1xufSkodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB0aGlzKTtcbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gYnVpbGRGcm9tRW5jb2RlZFBhcnRzKG9wdF9zY2hlbWUsIG9wdF91c2VySW5mbywgb3B0X2RvbWFpbiwgb3B0X3BvcnQsIG9wdF9wYXRoLCBvcHRfcXVlcnlEYXRhLCBvcHRfZnJhZ21lbnQpIHtcbiAgICB2YXIgb3V0ID0gW107XG4gICAgaWYgKG9wdF9zY2hlbWUpIHtcbiAgICAgIG91dC5wdXNoKG9wdF9zY2hlbWUsICc6Jyk7XG4gICAgfVxuICAgIGlmIChvcHRfZG9tYWluKSB7XG4gICAgICBvdXQucHVzaCgnLy8nKTtcbiAgICAgIGlmIChvcHRfdXNlckluZm8pIHtcbiAgICAgICAgb3V0LnB1c2gob3B0X3VzZXJJbmZvLCAnQCcpO1xuICAgICAgfVxuICAgICAgb3V0LnB1c2gob3B0X2RvbWFpbik7XG4gICAgICBpZiAob3B0X3BvcnQpIHtcbiAgICAgICAgb3V0LnB1c2goJzonLCBvcHRfcG9ydCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRfcGF0aCkge1xuICAgICAgb3V0LnB1c2gob3B0X3BhdGgpO1xuICAgIH1cbiAgICBpZiAob3B0X3F1ZXJ5RGF0YSkge1xuICAgICAgb3V0LnB1c2goJz8nLCBvcHRfcXVlcnlEYXRhKTtcbiAgICB9XG4gICAgaWYgKG9wdF9mcmFnbWVudCkge1xuICAgICAgb3V0LnB1c2goJyMnLCBvcHRfZnJhZ21lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0LmpvaW4oJycpO1xuICB9XG4gIHZhciBzcGxpdFJlID0gbmV3IFJlZ0V4cCgnXicgKyAnKD86JyArICcoW146Lz8jLl0rKScgKyAnOik/JyArICcoPzovLycgKyAnKD86KFteLz8jXSopQCk/JyArICcoW1xcXFx3XFxcXGRcXFxcLVxcXFx1MDEwMC1cXFxcdWZmZmYuJV0qKScgKyAnKD86OihbMC05XSspKT8nICsgJyk/JyArICcoW14/I10rKT8nICsgJyg/OlxcXFw/KFteI10qKSk/JyArICcoPzojKC4qKSk/JyArICckJyk7XG4gIHZhciBDb21wb25lbnRJbmRleCA9IHtcbiAgICBTQ0hFTUU6IDEsXG4gICAgVVNFUl9JTkZPOiAyLFxuICAgIERPTUFJTjogMyxcbiAgICBQT1JUOiA0LFxuICAgIFBBVEg6IDUsXG4gICAgUVVFUllfREFUQTogNixcbiAgICBGUkFHTUVOVDogN1xuICB9O1xuICBmdW5jdGlvbiBzcGxpdCh1cmkpIHtcbiAgICByZXR1cm4gKHVyaS5tYXRjaChzcGxpdFJlKSk7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlRG90U2VnbWVudHMocGF0aCkge1xuICAgIGlmIChwYXRoID09PSAnLycpXG4gICAgICByZXR1cm4gJy8nO1xuICAgIHZhciBsZWFkaW5nU2xhc2ggPSBwYXRoWzBdID09PSAnLycgPyAnLycgOiAnJztcbiAgICB2YXIgdHJhaWxpbmdTbGFzaCA9IHBhdGguc2xpY2UoLTEpID09PSAnLycgPyAnLycgOiAnJztcbiAgICB2YXIgc2VnbWVudHMgPSBwYXRoLnNwbGl0KCcvJyk7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIHZhciB1cCA9IDA7XG4gICAgZm9yICh2YXIgcG9zID0gMDsgcG9zIDwgc2VnbWVudHMubGVuZ3RoOyBwb3MrKykge1xuICAgICAgdmFyIHNlZ21lbnQgPSBzZWdtZW50c1twb3NdO1xuICAgICAgc3dpdGNoIChzZWdtZW50KSB7XG4gICAgICAgIGNhc2UgJyc6XG4gICAgICAgIGNhc2UgJy4nOlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcuLic6XG4gICAgICAgICAgaWYgKG91dC5sZW5ndGgpXG4gICAgICAgICAgICBvdXQucG9wKCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdXArKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBvdXQucHVzaChzZWdtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFsZWFkaW5nU2xhc2gpIHtcbiAgICAgIHdoaWxlICh1cC0tID4gMCkge1xuICAgICAgICBvdXQudW5zaGlmdCgnLi4nKTtcbiAgICAgIH1cbiAgICAgIGlmIChvdXQubGVuZ3RoID09PSAwKVxuICAgICAgICBvdXQucHVzaCgnLicpO1xuICAgIH1cbiAgICByZXR1cm4gbGVhZGluZ1NsYXNoICsgb3V0LmpvaW4oJy8nKSArIHRyYWlsaW5nU2xhc2g7XG4gIH1cbiAgZnVuY3Rpb24gam9pbkFuZENhbm9uaWNhbGl6ZVBhdGgocGFydHMpIHtcbiAgICB2YXIgcGF0aCA9IHBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdIHx8ICcnO1xuICAgIHBhdGggPSByZW1vdmVEb3RTZWdtZW50cyhwYXRoKTtcbiAgICBwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXSA9IHBhdGg7XG4gICAgcmV0dXJuIGJ1aWxkRnJvbUVuY29kZWRQYXJ0cyhwYXJ0c1tDb21wb25lbnRJbmRleC5TQ0hFTUVdLCBwYXJ0c1tDb21wb25lbnRJbmRleC5VU0VSX0lORk9dLCBwYXJ0c1tDb21wb25lbnRJbmRleC5ET01BSU5dLCBwYXJ0c1tDb21wb25lbnRJbmRleC5QT1JUXSwgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF0sIHBhcnRzW0NvbXBvbmVudEluZGV4LlFVRVJZX0RBVEFdLCBwYXJ0c1tDb21wb25lbnRJbmRleC5GUkFHTUVOVF0pO1xuICB9XG4gIGZ1bmN0aW9uIGNhbm9uaWNhbGl6ZVVybCh1cmwpIHtcbiAgICB2YXIgcGFydHMgPSBzcGxpdCh1cmwpO1xuICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gIH1cbiAgZnVuY3Rpb24gcmVzb2x2ZVVybChiYXNlLCB1cmwpIHtcbiAgICB2YXIgcGFydHMgPSBzcGxpdCh1cmwpO1xuICAgIHZhciBiYXNlUGFydHMgPSBzcGxpdChiYXNlKTtcbiAgICBpZiAocGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSkge1xuICAgICAgcmV0dXJuIGpvaW5BbmRDYW5vbmljYWxpemVQYXRoKHBhcnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSA9IGJhc2VQYXJ0c1tDb21wb25lbnRJbmRleC5TQ0hFTUVdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gQ29tcG9uZW50SW5kZXguU0NIRU1FOyBpIDw9IENvbXBvbmVudEluZGV4LlBPUlQ7IGkrKykge1xuICAgICAgaWYgKCFwYXJ0c1tpXSkge1xuICAgICAgICBwYXJ0c1tpXSA9IGJhc2VQYXJ0c1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdWzBdID09ICcvJykge1xuICAgICAgcmV0dXJuIGpvaW5BbmRDYW5vbmljYWxpemVQYXRoKHBhcnRzKTtcbiAgICB9XG4gICAgdmFyIHBhdGggPSBiYXNlUGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF07XG4gICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpO1xuICAgIHBhdGggPSBwYXRoLnNsaWNlKDAsIGluZGV4ICsgMSkgKyBwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXTtcbiAgICBwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXSA9IHBhdGg7XG4gICAgcmV0dXJuIGpvaW5BbmRDYW5vbmljYWxpemVQYXRoKHBhcnRzKTtcbiAgfVxuICBmdW5jdGlvbiBpc0Fic29sdXRlKG5hbWUpIHtcbiAgICBpZiAoIW5hbWUpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hbWVbMF0gPT09ICcvJylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHZhciBwYXJ0cyA9IHNwbGl0KG5hbWUpO1xuICAgIGlmIChwYXJ0c1tDb21wb25lbnRJbmRleC5TQ0hFTUVdKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gICR0cmFjZXVyUnVudGltZS5jYW5vbmljYWxpemVVcmwgPSBjYW5vbmljYWxpemVVcmw7XG4gICR0cmFjZXVyUnVudGltZS5pc0Fic29sdXRlID0gaXNBYnNvbHV0ZTtcbiAgJHRyYWNldXJSdW50aW1lLnJlbW92ZURvdFNlZ21lbnRzID0gcmVtb3ZlRG90U2VnbWVudHM7XG4gICR0cmFjZXVyUnVudGltZS5yZXNvbHZlVXJsID0gcmVzb2x2ZVVybDtcbn0pKCk7XG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyICRfXzMgPSAkdHJhY2V1clJ1bnRpbWUsXG4gICAgICBjYW5vbmljYWxpemVVcmwgPSAkX18zLmNhbm9uaWNhbGl6ZVVybCxcbiAgICAgIHJlc29sdmVVcmwgPSAkX18zLnJlc29sdmVVcmwsXG4gICAgICBpc0Fic29sdXRlID0gJF9fMy5pc0Fic29sdXRlO1xuICB2YXIgbW9kdWxlSW5zdGFudGlhdG9ycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHZhciBiYXNlVVJMO1xuICBpZiAoZ2xvYmFsLmxvY2F0aW9uICYmIGdsb2JhbC5sb2NhdGlvbi5ocmVmKVxuICAgIGJhc2VVUkwgPSByZXNvbHZlVXJsKGdsb2JhbC5sb2NhdGlvbi5ocmVmLCAnLi8nKTtcbiAgZWxzZVxuICAgIGJhc2VVUkwgPSAnJztcbiAgZnVuY3Rpb24gVW5jb2F0ZWRNb2R1bGVFbnRyeSh1cmwsIHVuY29hdGVkTW9kdWxlKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy52YWx1ZV8gPSB1bmNvYXRlZE1vZHVsZTtcbiAgfVxuICBmdW5jdGlvbiBNb2R1bGVFdmFsdWF0aW9uRXJyb3IoZXJyb25lb3VzTW9kdWxlTmFtZSwgY2F1c2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWUgKyAnOiAnICsgdGhpcy5zdHJpcENhdXNlKGNhdXNlKSArICcgaW4gJyArIGVycm9uZW91c01vZHVsZU5hbWU7XG4gICAgaWYgKCEoY2F1c2UgaW5zdGFuY2VvZiBNb2R1bGVFdmFsdWF0aW9uRXJyb3IpICYmIGNhdXNlLnN0YWNrKVxuICAgICAgdGhpcy5zdGFjayA9IHRoaXMuc3RyaXBTdGFjayhjYXVzZS5zdGFjayk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5zdGFjayA9ICcnO1xuICB9XG4gIE1vZHVsZUV2YWx1YXRpb25FcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG4gIE1vZHVsZUV2YWx1YXRpb25FcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2R1bGVFdmFsdWF0aW9uRXJyb3I7XG4gIE1vZHVsZUV2YWx1YXRpb25FcnJvci5wcm90b3R5cGUuc3RyaXBFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKC8uKkVycm9yOi8sIHRoaXMuY29uc3RydWN0b3IubmFtZSArICc6Jyk7XG4gIH07XG4gIE1vZHVsZUV2YWx1YXRpb25FcnJvci5wcm90b3R5cGUuc3RyaXBDYXVzZSA9IGZ1bmN0aW9uKGNhdXNlKSB7XG4gICAgaWYgKCFjYXVzZSlcbiAgICAgIHJldHVybiAnJztcbiAgICBpZiAoIWNhdXNlLm1lc3NhZ2UpXG4gICAgICByZXR1cm4gY2F1c2UgKyAnJztcbiAgICByZXR1cm4gdGhpcy5zdHJpcEVycm9yKGNhdXNlLm1lc3NhZ2UpO1xuICB9O1xuICBNb2R1bGVFdmFsdWF0aW9uRXJyb3IucHJvdG90eXBlLmxvYWRlZEJ5ID0gZnVuY3Rpb24obW9kdWxlTmFtZSkge1xuICAgIHRoaXMuc3RhY2sgKz0gJ1xcbiBsb2FkZWQgYnkgJyArIG1vZHVsZU5hbWU7XG4gIH07XG4gIE1vZHVsZUV2YWx1YXRpb25FcnJvci5wcm90b3R5cGUuc3RyaXBTdGFjayA9IGZ1bmN0aW9uKGNhdXNlU3RhY2spIHtcbiAgICB2YXIgc3RhY2sgPSBbXTtcbiAgICBjYXVzZVN0YWNrLnNwbGl0KCdcXG4nKS5zb21lKGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICBpZiAoL1VuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yLy50ZXN0KGZyYW1lKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBzdGFjay5wdXNoKGZyYW1lKTtcbiAgICB9KTtcbiAgICBzdGFja1swXSA9IHRoaXMuc3RyaXBFcnJvcihzdGFja1swXSk7XG4gICAgcmV0dXJuIHN0YWNrLmpvaW4oJ1xcbicpO1xuICB9O1xuICBmdW5jdGlvbiBiZWZvcmVMaW5lcyhsaW5lcywgbnVtYmVyKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBmaXJzdCA9IG51bWJlciAtIDM7XG4gICAgaWYgKGZpcnN0IDwgMClcbiAgICAgIGZpcnN0ID0gMDtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBudW1iZXI7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2gobGluZXNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIGFmdGVyTGluZXMobGluZXMsIG51bWJlcikge1xuICAgIHZhciBsYXN0ID0gbnVtYmVyICsgMTtcbiAgICBpZiAobGFzdCA+IGxpbmVzLmxlbmd0aCAtIDEpXG4gICAgICBsYXN0ID0gbGluZXMubGVuZ3RoIC0gMTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IG51bWJlcjsgaSA8PSBsYXN0OyBpKyspIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxpbmVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBjb2x1bW5TcGFjaW5nKGNvbHVtbnMpIHtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2x1bW5zIC0gMTsgaSsrKSB7XG4gICAgICByZXN1bHQgKz0gJy0nO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yKHVybCwgZnVuYykge1xuICAgIFVuY29hdGVkTW9kdWxlRW50cnkuY2FsbCh0aGlzLCB1cmwsIG51bGwpO1xuICAgIHRoaXMuZnVuYyA9IGZ1bmM7XG4gIH1cbiAgVW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVbmNvYXRlZE1vZHVsZUVudHJ5LnByb3RvdHlwZSk7XG4gIFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yLnByb3RvdHlwZS5nZXRVbmNvYXRlZE1vZHVsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciAkX18yID0gdGhpcztcbiAgICBpZiAodGhpcy52YWx1ZV8pXG4gICAgICByZXR1cm4gdGhpcy52YWx1ZV87XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZWxhdGl2ZVJlcXVpcmU7XG4gICAgICBpZiAodHlwZW9mICR0cmFjZXVyUnVudGltZSAhPT0gdW5kZWZpbmVkICYmICR0cmFjZXVyUnVudGltZS5yZXF1aXJlKSB7XG4gICAgICAgIHJlbGF0aXZlUmVxdWlyZSA9ICR0cmFjZXVyUnVudGltZS5yZXF1aXJlLmJpbmQobnVsbCwgdGhpcy51cmwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudmFsdWVfID0gdGhpcy5mdW5jLmNhbGwoZ2xvYmFsLCByZWxhdGl2ZVJlcXVpcmUpO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBpZiAoZXggaW5zdGFuY2VvZiBNb2R1bGVFdmFsdWF0aW9uRXJyb3IpIHtcbiAgICAgICAgZXgubG9hZGVkQnkodGhpcy51cmwpO1xuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICAgIGlmIChleC5zdGFjaykge1xuICAgICAgICB2YXIgbGluZXMgPSB0aGlzLmZ1bmMudG9TdHJpbmcoKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgIHZhciBldmFsZWQgPSBbXTtcbiAgICAgICAgZXguc3RhY2suc3BsaXQoJ1xcbicpLnNvbWUoZnVuY3Rpb24oZnJhbWUsIGluZGV4KSB7XG4gICAgICAgICAgaWYgKGZyYW1lLmluZGV4T2YoJ1VuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yLmdldFVuY29hdGVkTW9kdWxlJykgPiAwKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgdmFyIG0gPSAvKGF0XFxzW15cXHNdKlxccykuKj46KFxcZCopOihcXGQqKVxcKS8uZXhlYyhmcmFtZSk7XG4gICAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgIHZhciBsaW5lID0gcGFyc2VJbnQobVsyXSwgMTApO1xuICAgICAgICAgICAgZXZhbGVkID0gZXZhbGVkLmNvbmNhdChiZWZvcmVMaW5lcyhsaW5lcywgbGluZSkpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAxKSB7XG4gICAgICAgICAgICAgIGV2YWxlZC5wdXNoKGNvbHVtblNwYWNpbmcobVszXSkgKyAnXiAnICsgJF9fMi51cmwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZXZhbGVkLnB1c2goY29sdW1uU3BhY2luZyhtWzNdKSArICdeJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBldmFsZWQgPSBldmFsZWQuY29uY2F0KGFmdGVyTGluZXMobGluZXMsIGxpbmUpKTtcbiAgICAgICAgICAgIGV2YWxlZC5wdXNoKCc9ID0gPSA9ID0gPSA9ID0gPScpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmFsZWQucHVzaChmcmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZXguc3RhY2sgPSBldmFsZWQuam9pbignXFxuJyk7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgTW9kdWxlRXZhbHVhdGlvbkVycm9yKHRoaXMudXJsLCBleCk7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBnZXRVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihuYW1lKSB7XG4gICAgaWYgKCFuYW1lKVxuICAgICAgcmV0dXJuO1xuICAgIHZhciB1cmwgPSBNb2R1bGVTdG9yZS5ub3JtYWxpemUobmFtZSk7XG4gICAgcmV0dXJuIG1vZHVsZUluc3RhbnRpYXRvcnNbdXJsXTtcbiAgfVxuICA7XG4gIHZhciBtb2R1bGVJbnN0YW5jZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2YXIgbGl2ZU1vZHVsZVNlbnRpbmVsID0ge307XG4gIGZ1bmN0aW9uIE1vZHVsZSh1bmNvYXRlZE1vZHVsZSkge1xuICAgIHZhciBpc0xpdmUgPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIGNvYXRlZE1vZHVsZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModW5jb2F0ZWRNb2R1bGUpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGdldHRlcixcbiAgICAgICAgICB2YWx1ZTtcbiAgICAgIGlmIChpc0xpdmUgPT09IGxpdmVNb2R1bGVTZW50aW5lbCkge1xuICAgICAgICB2YXIgZGVzY3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHVuY29hdGVkTW9kdWxlLCBuYW1lKTtcbiAgICAgICAgaWYgKGRlc2NyLmdldClcbiAgICAgICAgICBnZXR0ZXIgPSBkZXNjci5nZXQ7XG4gICAgICB9XG4gICAgICBpZiAoIWdldHRlcikge1xuICAgICAgICB2YWx1ZSA9IHVuY29hdGVkTW9kdWxlW25hbWVdO1xuICAgICAgICBnZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29hdGVkTW9kdWxlLCBuYW1lLCB7XG4gICAgICAgIGdldDogZ2V0dGVyLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBPYmplY3QucHJldmVudEV4dGVuc2lvbnMoY29hdGVkTW9kdWxlKTtcbiAgICByZXR1cm4gY29hdGVkTW9kdWxlO1xuICB9XG4gIHZhciBNb2R1bGVTdG9yZSA9IHtcbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uKG5hbWUsIHJlZmVyZXJOYW1lLCByZWZlcmVyQWRkcmVzcykge1xuICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbW9kdWxlIG5hbWUgbXVzdCBiZSBhIHN0cmluZywgbm90ICcgKyB0eXBlb2YgbmFtZSk7XG4gICAgICBpZiAoaXNBYnNvbHV0ZShuYW1lKSlcbiAgICAgICAgcmV0dXJuIGNhbm9uaWNhbGl6ZVVybChuYW1lKTtcbiAgICAgIGlmICgvW15cXC5dXFwvXFwuXFwuXFwvLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5hbWUgZW1iZWRzIC8uLi86ICcgKyBuYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChuYW1lWzBdID09PSAnLicgJiYgcmVmZXJlck5hbWUpXG4gICAgICAgIHJldHVybiByZXNvbHZlVXJsKHJlZmVyZXJOYW1lLCBuYW1lKTtcbiAgICAgIHJldHVybiBjYW5vbmljYWxpemVVcmwobmFtZSk7XG4gICAgfSxcbiAgICBnZXQ6IGZ1bmN0aW9uKG5vcm1hbGl6ZWROYW1lKSB7XG4gICAgICB2YXIgbSA9IGdldFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yKG5vcm1hbGl6ZWROYW1lKTtcbiAgICAgIGlmICghbSlcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHZhciBtb2R1bGVJbnN0YW5jZSA9IG1vZHVsZUluc3RhbmNlc1ttLnVybF07XG4gICAgICBpZiAobW9kdWxlSW5zdGFuY2UpXG4gICAgICAgIHJldHVybiBtb2R1bGVJbnN0YW5jZTtcbiAgICAgIG1vZHVsZUluc3RhbmNlID0gTW9kdWxlKG0uZ2V0VW5jb2F0ZWRNb2R1bGUoKSwgbGl2ZU1vZHVsZVNlbnRpbmVsKTtcbiAgICAgIHJldHVybiBtb2R1bGVJbnN0YW5jZXNbbS51cmxdID0gbW9kdWxlSW5zdGFuY2U7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG5vcm1hbGl6ZWROYW1lLCBtb2R1bGUpIHtcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gU3RyaW5nKG5vcm1hbGl6ZWROYW1lKTtcbiAgICAgIG1vZHVsZUluc3RhbnRpYXRvcnNbbm9ybWFsaXplZE5hbWVdID0gbmV3IFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yKG5vcm1hbGl6ZWROYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICAgIH0pO1xuICAgICAgbW9kdWxlSW5zdGFuY2VzW25vcm1hbGl6ZWROYW1lXSA9IG1vZHVsZTtcbiAgICB9LFxuICAgIGdldCBiYXNlVVJMKCkge1xuICAgICAgcmV0dXJuIGJhc2VVUkw7XG4gICAgfSxcbiAgICBzZXQgYmFzZVVSTCh2KSB7XG4gICAgICBiYXNlVVJMID0gU3RyaW5nKHYpO1xuICAgIH0sXG4gICAgcmVnaXN0ZXJNb2R1bGU6IGZ1bmN0aW9uKG5hbWUsIGRlcHMsIGZ1bmMpIHtcbiAgICAgIHZhciBub3JtYWxpemVkTmFtZSA9IE1vZHVsZVN0b3JlLm5vcm1hbGl6ZShuYW1lKTtcbiAgICAgIGlmIChtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkdXBsaWNhdGUgbW9kdWxlIG5hbWVkICcgKyBub3JtYWxpemVkTmFtZSk7XG4gICAgICBtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSA9IG5ldyBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSwgZnVuYyk7XG4gICAgfSxcbiAgICBidW5kbGVTdG9yZTogT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24obmFtZSwgZGVwcywgZnVuYykge1xuICAgICAgaWYgKCFkZXBzIHx8ICFkZXBzLmxlbmd0aCAmJiAhZnVuYy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1vZHVsZShuYW1lLCBkZXBzLCBmdW5jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVuZGxlU3RvcmVbbmFtZV0gPSB7XG4gICAgICAgICAgZGVwczogZGVwcyxcbiAgICAgICAgICBleGVjdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkX18yID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGRlcE1hcCA9IHt9O1xuICAgICAgICAgICAgZGVwcy5mb3JFYWNoKGZ1bmN0aW9uKGRlcCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRlcE1hcFtkZXBdID0gJF9fMltpbmRleF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZWdpc3RyeUVudHJ5ID0gZnVuYy5jYWxsKHRoaXMsIGRlcE1hcCk7XG4gICAgICAgICAgICByZWdpc3RyeUVudHJ5LmV4ZWN1dGUuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiByZWdpc3RyeUVudHJ5LmV4cG9ydHM7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0QW5vbnltb3VzTW9kdWxlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICByZXR1cm4gbmV3IE1vZHVsZShmdW5jKCksIGxpdmVNb2R1bGVTZW50aW5lbCk7XG4gICAgfVxuICB9O1xuICB2YXIgbW9kdWxlU3RvcmVNb2R1bGUgPSBuZXcgTW9kdWxlKHtNb2R1bGVTdG9yZTogTW9kdWxlU3RvcmV9KTtcbiAgTW9kdWxlU3RvcmUuc2V0KCdAdHJhY2V1ci9zcmMvcnVudGltZS9Nb2R1bGVTdG9yZS5qcycsIG1vZHVsZVN0b3JlTW9kdWxlKTtcbiAgdmFyIHNldHVwR2xvYmFscyA9ICR0cmFjZXVyUnVudGltZS5zZXR1cEdsb2JhbHM7XG4gICR0cmFjZXVyUnVudGltZS5zZXR1cEdsb2JhbHMgPSBmdW5jdGlvbihnbG9iYWwpIHtcbiAgICBzZXR1cEdsb2JhbHMoZ2xvYmFsKTtcbiAgfTtcbiAgJHRyYWNldXJSdW50aW1lLk1vZHVsZVN0b3JlID0gTW9kdWxlU3RvcmU7XG4gICR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZSA9IE1vZHVsZVN0b3JlLnJlZ2lzdGVyTW9kdWxlLmJpbmQoTW9kdWxlU3RvcmUpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlID0gTW9kdWxlU3RvcmUuZ2V0O1xuICAkdHJhY2V1clJ1bnRpbWUuc2V0TW9kdWxlID0gTW9kdWxlU3RvcmUuc2V0O1xuICAkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZSA9IE1vZHVsZVN0b3JlLm5vcm1hbGl6ZTtcbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9uZXctdW5pcXVlLXN0cmluZy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9uZXctdW5pcXVlLXN0cmluZy5qc1wiO1xuICB2YXIgcmFuZG9tID0gTWF0aC5yYW5kb207XG4gIHZhciBjb3VudGVyID0gRGF0ZS5ub3coKSAlIDFlOTtcbiAgZnVuY3Rpb24gbmV3VW5pcXVlU3RyaW5nKCkge1xuICAgIHJldHVybiAnX18kJyArIChyYW5kb20oKSAqIDFlOSA+Pj4gMSkgKyAnJCcgKyArK2NvdW50ZXIgKyAnJF9fJztcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIG5ld1VuaXF1ZVN0cmluZztcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2hhcy1uYXRpdmUtc3ltYm9scy5qc1wiO1xuICB2YXIgdiA9ICEhT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAmJiB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nO1xuICBmdW5jdGlvbiBoYXNOYXRpdmVTeW1ib2woKSB7XG4gICAgcmV0dXJuIHY7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBoYXNOYXRpdmVTeW1ib2w7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3ltYm9scy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N5bWJvbHMuanNcIjtcbiAgdmFyIG5ld1VuaXF1ZVN0cmluZyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9uZXctdW5pcXVlLXN0cmluZy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3ltYm9scy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGhhc05hdGl2ZVN5bWJvbCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9oYXMtbmF0aXZlLXN5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N5bWJvbHMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgdmFyICRmcmVlemUgPSBPYmplY3QuZnJlZXplO1xuICB2YXIgJGdldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgdmFyICRrZXlzID0gT2JqZWN0LmtleXM7XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICBmdW5jdGlvbiBub25FbnVtKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9O1xuICB9XG4gIHZhciBzeW1ib2xJbnRlcm5hbFByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEYXRhUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgdmFyIHN5bWJvbFZhbHVlcyA9ICRjcmVhdGUobnVsbCk7XG4gIHZhciBTeW1ib2xJbXBsID0gZnVuY3Rpb24gU3ltYm9sKGRlc2NyaXB0aW9uKSB7XG4gICAgdmFyIHZhbHVlID0gbmV3IFN5bWJvbFZhbHVlKGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU3ltYm9sSW1wbCkpXG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgdGhyb3cgbmV3ICRUeXBlRXJyb3IoJ1N5bWJvbCBjYW5ub3QgYmUgbmV3XFwnZWQnKTtcbiAgfTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbEltcGwucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbEltcGwpKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbEltcGwucHJvdG90eXBlLCAndG9TdHJpbmcnLCBub25FbnVtKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gIH0pKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbEltcGwucHJvdG90eXBlLCAndmFsdWVPZicsIG5vbkVudW0oZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghc3ltYm9sVmFsdWUpXG4gICAgICB0aHJvdyAkVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIHJldHVybiBzeW1ib2xWYWx1ZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgfSkpO1xuICBmdW5jdGlvbiBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbikge1xuICAgIHZhciBrZXkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGF0YVByb3BlcnR5LCB7dmFsdWU6IHRoaXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eSwge3ZhbHVlOiBrZXl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eSwge3ZhbHVlOiBkZXNjcmlwdGlvbn0pO1xuICAgICRmcmVlemUodGhpcyk7XG4gICAgc3ltYm9sVmFsdWVzW2tleV0gPSB0aGlzO1xuICB9XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sSW1wbCkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndG9TdHJpbmcnLCB7XG4gICAgdmFsdWU6IFN5bWJvbEltcGwucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG4gIH0pO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndmFsdWVPZicsIHtcbiAgICB2YWx1ZTogU3ltYm9sSW1wbC5wcm90b3R5cGUudmFsdWVPZixcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGZyZWV6ZShTeW1ib2xWYWx1ZS5wcm90b3R5cGUpO1xuICBmdW5jdGlvbiBpc1N5bWJvbFN0cmluZyhzKSB7XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlc1tzXTtcbiAgfVxuICBmdW5jdGlvbiByZW1vdmVTeW1ib2xLZXlzKGFycmF5KSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFpc1N5bWJvbFN0cmluZyhhcnJheVtpXSkpIHtcbiAgICAgICAgcnYucHVzaChhcnJheVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfVxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCkge1xuICAgIHJldHVybiByZW1vdmVTeW1ib2xLZXlzKCRnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCkpO1xuICB9XG4gIGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgcmV0dXJuIHJlbW92ZVN5bWJvbEtleXMoJGtleXMob2JqZWN0KSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iamVjdCkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIHZhciBuYW1lcyA9ICRnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHN5bWJvbCA9IHN5bWJvbFZhbHVlc1tuYW1lc1tpXV07XG4gICAgICBpZiAoc3ltYm9sKSB7XG4gICAgICAgIHJ2LnB1c2goc3ltYm9sKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsU3ltYm9sKGdsb2JhbCkge1xuICAgIHZhciBPYmplY3QgPSBnbG9iYWwuT2JqZWN0O1xuICAgIGlmICghaGFzTmF0aXZlU3ltYm9sKCkpIHtcbiAgICAgIGdsb2JhbC5TeW1ib2wgPSBTeW1ib2xJbXBsO1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICAgICAgT2JqZWN0LmtleXMgPSBrZXlzO1xuICAgICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2dldE93blByb3BlcnR5U3ltYm9scycsIG5vbkVudW0oZ2V0T3duUHJvcGVydHlTeW1ib2xzKSk7XG4gICAgfVxuICAgIGlmICghZ2xvYmFsLlN5bWJvbC5pdGVyYXRvcikge1xuICAgICAgZ2xvYmFsLlN5bWJvbC5pdGVyYXRvciA9IGdsb2JhbC5TeW1ib2woJ1N5bWJvbC5pdGVyYXRvcicpO1xuICAgIH1cbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wub2JzZXJ2ZXIpIHtcbiAgICAgIGdsb2JhbC5TeW1ib2wub2JzZXJ2ZXIgPSBnbG9iYWwuU3ltYm9sKCdTeW1ib2wub2JzZXJ2ZXInKTtcbiAgICB9XG4gIH1cbiAgdmFyIGcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6ICh2b2lkIDApO1xuICBwb2x5ZmlsbFN5bWJvbChnKTtcbiAgdmFyIHR5cGVPZiA9IGhhc05hdGl2ZVN5bWJvbCgpID8gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiB0eXBlb2YgeDtcbiAgfSA6IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4geCBpbnN0YW5jZW9mIFN5bWJvbFZhbHVlID8gJ3N5bWJvbCcgOiB0eXBlb2YgeDtcbiAgfTtcbiAgcmV0dXJuIHtnZXQgdHlwZW9mKCkge1xuICAgICAgcmV0dXJuIHR5cGVPZjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy90eXBlb2YuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy90eXBlb2YuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfc3ltYm9sc180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vc3ltYm9scy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvdHlwZW9mLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3N5bWJvbHNfNDZfanNfXy50eXBlb2Y7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3N5bWJvbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3ltYm9scy5qc1wiO1xuICB2YXIgdCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvdHlwZW9mLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3ltYm9scy5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLnR5cGVvZiA9IHQ7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVDbGFzcy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUNsYXNzLmpzXCI7XG4gIHZhciAkT2JqZWN0ID0gT2JqZWN0O1xuICB2YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgdmFyICRfXzEgPSBPYmplY3QsXG4gICAgICBjcmVhdGUgPSAkX18xLmNyZWF0ZSxcbiAgICAgIGRlZmluZVByb3BlcnRpZXMgPSAkX18xLmRlZmluZVByb3BlcnRpZXMsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzEuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAkX18xLmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGdldE93blByb3BlcnR5TmFtZXMgPSAkX18xLmdldE93blByb3BlcnR5TmFtZXMsXG4gICAgICBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSAkX18xLmdldE93blByb3BlcnR5U3ltYm9scztcbiAgZnVuY3Rpb24gZm9yRWFjaFByb3BlcnR5S2V5KG9iamVjdCwgZikge1xuICAgIGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KS5mb3JFYWNoKGYpO1xuICAgIGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICAgIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpLmZvckVhY2goZik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdldERlc2NyaXB0b3JzKG9iamVjdCkge1xuICAgIHZhciBkZXNjcmlwdG9ycyA9IHt9O1xuICAgIGZvckVhY2hQcm9wZXJ0eUtleShvYmplY3QsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgZGVzY3JpcHRvcnNba2V5XSA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIGtleSk7XG4gICAgICBkZXNjcmlwdG9yc1trZXldLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVzY3JpcHRvcnM7XG4gIH1cbiAgdmFyIG5vbkVudW0gPSB7ZW51bWVyYWJsZTogZmFsc2V9O1xuICBmdW5jdGlvbiBtYWtlUHJvcGVydGllc05vbkVudW1lcmFibGUob2JqZWN0KSB7XG4gICAgZm9yRWFjaFByb3BlcnR5S2V5KG9iamVjdCwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBkZWZpbmVQcm9wZXJ0eShvYmplY3QsIGtleSwgbm9uRW51bSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlQ2xhc3MoY3Rvciwgb2JqZWN0LCBzdGF0aWNPYmplY3QsIHN1cGVyQ2xhc3MpIHtcbiAgICBkZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjb25zdHJ1Y3RvcicsIHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgaWYgKHR5cGVvZiBzdXBlckNsYXNzID09PSAnZnVuY3Rpb24nKVxuICAgICAgICBjdG9yLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGNyZWF0ZShnZXRQcm90b1BhcmVudChzdXBlckNsYXNzKSwgZ2V0RGVzY3JpcHRvcnMob2JqZWN0KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ha2VQcm9wZXJ0aWVzTm9uRW51bWVyYWJsZShvYmplY3QpO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBvYmplY3Q7XG4gICAgfVxuICAgIGRlZmluZVByb3BlcnR5KGN0b3IsICdwcm90b3R5cGUnLCB7XG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmluZVByb3BlcnRpZXMoY3RvciwgZ2V0RGVzY3JpcHRvcnMoc3RhdGljT2JqZWN0KSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0UHJvdG9QYXJlbnQoc3VwZXJDbGFzcykge1xuICAgIGlmICh0eXBlb2Ygc3VwZXJDbGFzcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIHByb3RvdHlwZSA9IHN1cGVyQ2xhc3MucHJvdG90eXBlO1xuICAgICAgaWYgKCRPYmplY3QocHJvdG90eXBlKSA9PT0gcHJvdG90eXBlIHx8IHByb3RvdHlwZSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIHN1cGVyQ2xhc3MucHJvdG90eXBlO1xuICAgICAgdGhyb3cgbmV3ICRUeXBlRXJyb3IoJ3N1cGVyIHByb3RvdHlwZSBtdXN0IGJlIGFuIE9iamVjdCBvciBudWxsJyk7XG4gICAgfVxuICAgIGlmIChzdXBlckNsYXNzID09PSBudWxsKVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgdGhyb3cgbmV3ICRUeXBlRXJyb3IoKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzICsgXCIuXCIpKTtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUNsYXNzO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyQ29uc3RydWN0b3IuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zdXBlckNvbnN0cnVjdG9yLmpzXCI7XG4gIGZ1bmN0aW9uIHN1cGVyQ29uc3RydWN0b3IoY3Rvcikge1xuICAgIHJldHVybiBjdG9yLl9fcHJvdG9fXztcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIHN1cGVyQ29uc3RydWN0b3I7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJEZXNjcmlwdG9yLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJEZXNjcmlwdG9yLmpzXCI7XG4gIHZhciAkX18wID0gT2JqZWN0LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJF9fMC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBnZXRQcm90b3R5cGVPZiA9ICRfXzAuZ2V0UHJvdG90eXBlT2Y7XG4gIGZ1bmN0aW9uIHN1cGVyRGVzY3JpcHRvcihob21lT2JqZWN0LCBuYW1lKSB7XG4gICAgdmFyIHByb3RvID0gZ2V0UHJvdG90eXBlT2YoaG9tZU9iamVjdCk7XG4gICAgZG8ge1xuICAgICAgdmFyIHJlc3VsdCA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90bywgbmFtZSk7XG4gICAgICBpZiAocmVzdWx0KVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgcHJvdG8gPSBnZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgfSB3aGlsZSAocHJvdG8pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBzdXBlckRlc2NyaXB0b3I7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJHZXQuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zdXBlckdldC5qc1wiO1xuICB2YXIgc3VwZXJEZXNjcmlwdG9yID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vc3VwZXJEZXNjcmlwdG9yLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zdXBlckdldC5qc1wiKSkuZGVmYXVsdDtcbiAgZnVuY3Rpb24gc3VwZXJHZXQoc2VsZiwgaG9tZU9iamVjdCwgbmFtZSkge1xuICAgIHZhciBkZXNjcmlwdG9yID0gc3VwZXJEZXNjcmlwdG9yKGhvbWVPYmplY3QsIG5hbWUpO1xuICAgIGlmIChkZXNjcmlwdG9yKSB7XG4gICAgICB2YXIgdmFsdWUgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgICAgaWYgKHZhbHVlKVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICBpZiAoIWRlc2NyaXB0b3IuZ2V0KVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICByZXR1cm4gZGVzY3JpcHRvci5nZXQuY2FsbChzZWxmKTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIHN1cGVyR2V0O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3N1cGVyU2V0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJTZXQuanNcIjtcbiAgdmFyIHN1cGVyRGVzY3JpcHRvciA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3N1cGVyRGVzY3JpcHRvci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3VwZXJTZXQuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICBmdW5jdGlvbiBzdXBlclNldChzZWxmLCBob21lT2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBkZXNjcmlwdG9yID0gc3VwZXJEZXNjcmlwdG9yKGhvbWVPYmplY3QsIG5hbWUpO1xuICAgIGlmIChkZXNjcmlwdG9yICYmIGRlc2NyaXB0b3Iuc2V0KSB7XG4gICAgICBkZXNjcmlwdG9yLnNldC5jYWxsKHNlbGYsIHZhbHVlKTtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgdGhyb3cgJFR5cGVFcnJvcigoXCJzdXBlciBoYXMgbm8gc2V0dGVyICdcIiArIG5hbWUgKyBcIicuXCIpKTtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIHN1cGVyU2V0O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9jbGFzc2VzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NsYXNzZXMuanNcIjtcbiAgdmFyIGNyZWF0ZUNsYXNzID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jcmVhdGVDbGFzcy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NsYXNzZXMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBzdXBlckNvbnN0cnVjdG9yID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zdXBlckNvbnN0cnVjdG9yLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvY2xhc3Nlcy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIHN1cGVyR2V0ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zdXBlckdldC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2NsYXNzZXMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBzdXBlclNldCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvc3VwZXJTZXQuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9jbGFzc2VzLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MgPSBjcmVhdGVDbGFzcztcbiAgJHRyYWNldXJSdW50aW1lLnN1cGVyQ29uc3RydWN0b3IgPSBzdXBlckNvbnN0cnVjdG9yO1xuICAkdHJhY2V1clJ1bnRpbWUuc3VwZXJHZXQgPSBzdXBlckdldDtcbiAgJHRyYWNldXJSdW50aW1lLnN1cGVyU2V0ID0gc3VwZXJTZXQ7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9leHBvcnRTdGFyLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZXhwb3J0U3Rhci5qc1wiO1xuICB2YXIgJF9fMSA9IE9iamVjdCxcbiAgICAgIGRlZmluZVByb3BlcnR5ID0gJF9fMS5kZWZpbmVQcm9wZXJ0eSxcbiAgICAgIGdldE93blByb3BlcnR5TmFtZXMgPSAkX18xLmdldE93blByb3BlcnR5TmFtZXM7XG4gIGZ1bmN0aW9uIGV4cG9ydFN0YXIob2JqZWN0KSB7XG4gICAgdmFyICRfXzIgPSBhcmd1bWVudHMsXG4gICAgICAgICRfXzMgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgdmFyIG1vZCA9ICRfXzJbaV07XG4gICAgICAgICAgdmFyIG5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhtb2QpO1xuICAgICAgICAgIHZhciAkX181ID0gZnVuY3Rpb24oaikge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tqXTtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnX19lc01vZHVsZScgfHwgbmFtZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCB7XG4gICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZFtuYW1lXTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAgICAgJF9fNjtcbiAgICAgICAgICAkX180OiBmb3IgKHZhciBqID0gMDsgaiA8IG5hbWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAkX182ID0gJF9fNShqKTtcbiAgICAgICAgICAgIHN3aXRjaCAoJF9fNikge1xuICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgY29udGludWUgJF9fNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICRfXzMoaSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBleHBvcnRTdGFyO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9leHBvcnRTdGFyLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2V4cG9ydFN0YXIuanNcIjtcbiAgdmFyIGV4cG9ydFN0YXIgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2V4cG9ydFN0YXIuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9leHBvcnRTdGFyLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuZXhwb3J0U3RhciA9IGV4cG9ydFN0YXI7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS1zeW1ib2wuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS1zeW1ib2wuanNcIjtcbiAgdmFyIG5ld1VuaXF1ZVN0cmluZyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL25ldy11bmlxdWUtc3RyaW5nLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS1zeW1ib2wuanNcIikpLmRlZmF1bHQ7XG4gIHZhciAkU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyA/IFN5bWJvbCA6IHVuZGVmaW5lZDtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuICB2YXIgJGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4gIHZhciBwcml2YXRlTmFtZXMgPSAkY3JlYXRlKG51bGwpO1xuICBmdW5jdGlvbiBpc1ByaXZhdGVTeW1ib2wocykge1xuICAgIHJldHVybiBwcml2YXRlTmFtZXNbc107XG4gIH1cbiAgO1xuICBmdW5jdGlvbiBjcmVhdGVQcml2YXRlU3ltYm9sKCkge1xuICAgIHZhciBzID0gKCRTeW1ib2wgfHwgbmV3VW5pcXVlU3RyaW5nKSgpO1xuICAgIHByaXZhdGVOYW1lc1tzXSA9IHRydWU7XG4gICAgcmV0dXJuIHM7XG4gIH1cbiAgO1xuICBmdW5jdGlvbiBoYXNQcml2YXRlKG9iaiwgc3ltKSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBzeW0pO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gZGVsZXRlUHJpdmF0ZShvYmosIHN5bSkge1xuICAgIGlmICghaGFzUHJpdmF0ZShvYmosIHN5bSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZGVsZXRlIG9ialtzeW1dO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gc2V0UHJpdmF0ZShvYmosIHN5bSwgdmFsKSB7XG4gICAgb2JqW3N5bV0gPSB2YWw7XG4gIH1cbiAgO1xuICBmdW5jdGlvbiBnZXRQcml2YXRlKG9iaiwgc3ltKSB7XG4gICAgdmFyIHZhbCA9IG9ialtzeW1dO1xuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBzeW0pID8gdmFsIDogdW5kZWZpbmVkO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBpZiAoJGdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIHtcbiAgICAgICAgdmFyIHJ2ID0gW107XG4gICAgICAgIHZhciBzeW1ib2xzID0gJGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgc3ltYm9sID0gc3ltYm9sc1tpXTtcbiAgICAgICAgICBpZiAoIWlzUHJpdmF0ZVN5bWJvbChzeW1ib2wpKSB7XG4gICAgICAgICAgICBydi5wdXNoKHN5bWJvbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0IGlzUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBpc1ByaXZhdGVTeW1ib2w7XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlUHJpdmF0ZVN5bWJvbCgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVQcml2YXRlU3ltYm9sO1xuICAgIH0sXG4gICAgZ2V0IGhhc1ByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gaGFzUHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBkZWxldGVQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZVByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgc2V0UHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBzZXRQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGdldFByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gZ2V0UHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBpbml0KCkge1xuICAgICAgcmV0dXJuIGluaXQ7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcml2YXRlLXdlYWstbWFwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUtd2Vhay1tYXAuanNcIjtcbiAgdmFyICRXZWFrTWFwID0gdHlwZW9mIFdlYWtNYXAgPT09ICdmdW5jdGlvbicgPyBXZWFrTWFwIDogdW5kZWZpbmVkO1xuICBmdW5jdGlvbiBpc1ByaXZhdGVTeW1ib2wocykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVQcml2YXRlU3ltYm9sKCkge1xuICAgIHJldHVybiBuZXcgJFdlYWtNYXAoKTtcbiAgfVxuICBmdW5jdGlvbiBoYXNQcml2YXRlKG9iaiwgc3ltKSB7XG4gICAgcmV0dXJuIHN5bS5oYXMob2JqKTtcbiAgfVxuICBmdW5jdGlvbiBkZWxldGVQcml2YXRlKG9iaiwgc3ltKSB7XG4gICAgcmV0dXJuIHN5bS5kZWxldGUob2JqKTtcbiAgfVxuICBmdW5jdGlvbiBzZXRQcml2YXRlKG9iaiwgc3ltLCB2YWwpIHtcbiAgICBzeW0uc2V0KG9iaiwgdmFsKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRQcml2YXRlKG9iaiwgc3ltKSB7XG4gICAgcmV0dXJuIHN5bS5nZXQob2JqKTtcbiAgfVxuICBmdW5jdGlvbiBpbml0KCkge31cbiAgcmV0dXJuIHtcbiAgICBnZXQgaXNQcml2YXRlU3ltYm9sKCkge1xuICAgICAgcmV0dXJuIGlzUHJpdmF0ZVN5bWJvbDtcbiAgICB9LFxuICAgIGdldCBjcmVhdGVQcml2YXRlU3ltYm9sKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVByaXZhdGVTeW1ib2w7XG4gICAgfSxcbiAgICBnZXQgaGFzUHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBoYXNQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGRlbGV0ZVByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gZGVsZXRlUHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBzZXRQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIHNldFByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgZ2V0UHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBnZXRQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGluaXQoKSB7XG4gICAgICByZXR1cm4gaW5pdDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3ByaXZhdGUuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS5qc1wiO1xuICB2YXIgc3ltID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vcHJpdmF0ZS1zeW1ib2wuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcml2YXRlLmpzXCIpKTtcbiAgdmFyIHdlYWsgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9wcml2YXRlLXdlYWstbWFwLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJpdmF0ZS5qc1wiKSk7XG4gIHZhciBoYXNXZWFrTWFwID0gdHlwZW9mIFdlYWtNYXAgPT09ICdmdW5jdGlvbic7XG4gIHZhciBtID0gaGFzV2Vha01hcCA/IHdlYWsgOiBzeW07XG4gIHZhciBpc1ByaXZhdGVTeW1ib2wgPSBtLmlzUHJpdmF0ZVN5bWJvbDtcbiAgdmFyIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSBtLmNyZWF0ZVByaXZhdGVTeW1ib2w7XG4gIHZhciBoYXNQcml2YXRlID0gbS5oYXNQcml2YXRlO1xuICB2YXIgZGVsZXRlUHJpdmF0ZSA9IG0uZGVsZXRlUHJpdmF0ZTtcbiAgdmFyIHNldFByaXZhdGUgPSBtLnNldFByaXZhdGU7XG4gIHZhciBnZXRQcml2YXRlID0gbS5nZXRQcml2YXRlO1xuICBtLmluaXQoKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgaXNQcml2YXRlU3ltYm9sKCkge1xuICAgICAgcmV0dXJuIGlzUHJpdmF0ZVN5bWJvbDtcbiAgICB9LFxuICAgIGdldCBjcmVhdGVQcml2YXRlU3ltYm9sKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVByaXZhdGVTeW1ib2w7XG4gICAgfSxcbiAgICBnZXQgaGFzUHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBoYXNQcml2YXRlO1xuICAgIH0sXG4gICAgZ2V0IGRlbGV0ZVByaXZhdGUoKSB7XG4gICAgICByZXR1cm4gZGVsZXRlUHJpdmF0ZTtcbiAgICB9LFxuICAgIGdldCBzZXRQcml2YXRlKCkge1xuICAgICAgcmV0dXJuIHNldFByaXZhdGU7XG4gICAgfSxcbiAgICBnZXQgZ2V0UHJpdmF0ZSgpIHtcbiAgICAgIHJldHVybiBnZXRQcml2YXRlO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9wcm9wZXJUYWlsQ2FsbHMuanNcIjtcbiAgdmFyICRfXzAgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvcHJvcGVyVGFpbENhbGxzLmpzXCIpKSxcbiAgICAgIGdldFByaXZhdGUgPSAkX18wLmdldFByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fMC5zZXRQcml2YXRlLFxuICAgICAgY3JlYXRlUHJpdmF0ZVN5bWJvbCA9ICRfXzAuY3JlYXRlUHJpdmF0ZVN5bWJvbDtcbiAgdmFyICRhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsLmJpbmQoRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5KTtcbiAgdmFyIENPTlRJTlVBVElPTl9UWVBFID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdmFyIGlzVGFpbFJlY3Vyc2l2ZU5hbWUgPSBudWxsO1xuICBmdW5jdGlvbiBjcmVhdGVDb250aW51YXRpb24ob3BlcmFuZCwgdGhpc0FyZywgYXJnc0FycmF5KSB7XG4gICAgcmV0dXJuIFtDT05USU5VQVRJT05fVFlQRSwgb3BlcmFuZCwgdGhpc0FyZywgYXJnc0FycmF5XTtcbiAgfVxuICBmdW5jdGlvbiBpc0NvbnRpbnVhdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ICYmIG9iamVjdFswXSA9PT0gQ09OVElOVUFUSU9OX1RZUEU7XG4gIH1cbiAgZnVuY3Rpb24gJGJpbmQob3BlcmFuZCwgdGhpc0FyZywgYXJncykge1xuICAgIHZhciBhcmdBcnJheSA9IFt0aGlzQXJnXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ0FycmF5W2kgKyAxXSA9IGFyZ3NbaV07XG4gICAgfVxuICAgIHZhciBmdW5jID0gJGFwcGx5KEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLCBvcGVyYW5kLCBhcmdBcnJheSk7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgZnVuY3Rpb24gJGNvbnN0cnVjdChmdW5jLCBhcmdBcnJheSkge1xuICAgIHZhciBvYmplY3QgPSBuZXcgKCRiaW5kKGZ1bmMsIG51bGwsIGFyZ0FycmF5KSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBpc1RhaWxSZWN1cnNpdmUoZnVuYykge1xuICAgIHJldHVybiAhIWdldFByaXZhdGUoZnVuYywgaXNUYWlsUmVjdXJzaXZlTmFtZSk7XG4gIH1cbiAgZnVuY3Rpb24gdGFpbENhbGwoZnVuYywgdGhpc0FyZywgYXJnQXJyYXkpIHtcbiAgICB2YXIgY29udGludWF0aW9uID0gYXJnQXJyYXlbMF07XG4gICAgaWYgKGlzQ29udGludWF0aW9uKGNvbnRpbnVhdGlvbikpIHtcbiAgICAgIGNvbnRpbnVhdGlvbiA9ICRhcHBseShmdW5jLCB0aGlzQXJnLCBjb250aW51YXRpb25bM10pO1xuICAgICAgcmV0dXJuIGNvbnRpbnVhdGlvbjtcbiAgICB9XG4gICAgY29udGludWF0aW9uID0gY3JlYXRlQ29udGludWF0aW9uKGZ1bmMsIHRoaXNBcmcsIGFyZ0FycmF5KTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGlzVGFpbFJlY3Vyc2l2ZShmdW5jKSkge1xuICAgICAgICBjb250aW51YXRpb24gPSAkYXBwbHkoZnVuYywgY29udGludWF0aW9uWzJdLCBbY29udGludWF0aW9uXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51YXRpb24gPSAkYXBwbHkoZnVuYywgY29udGludWF0aW9uWzJdLCBjb250aW51YXRpb25bM10pO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0NvbnRpbnVhdGlvbihjb250aW51YXRpb24pKSB7XG4gICAgICAgIHJldHVybiBjb250aW51YXRpb247XG4gICAgICB9XG4gICAgICBmdW5jID0gY29udGludWF0aW9uWzFdO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjb25zdHJ1Y3QoKSB7XG4gICAgdmFyIG9iamVjdDtcbiAgICBpZiAoaXNUYWlsUmVjdXJzaXZlKHRoaXMpKSB7XG4gICAgICBvYmplY3QgPSAkY29uc3RydWN0KHRoaXMsIFtjcmVhdGVDb250aW51YXRpb24obnVsbCwgbnVsbCwgYXJndW1lbnRzKV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3QgPSAkY29uc3RydWN0KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbiAgZnVuY3Rpb24gc2V0dXBQcm9wZXJUYWlsQ2FsbHMoKSB7XG4gICAgaXNUYWlsUmVjdXJzaXZlTmFtZSA9IGNyZWF0ZVByaXZhdGVTeW1ib2woKTtcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbCA9IGluaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24oZnVuY3Rpb24gY2FsbCh0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdGFpbENhbGwoZnVuY3Rpb24odGhpc0FyZykge1xuICAgICAgICB2YXIgYXJnQXJyYXkgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBhcmdBcnJheVtpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNvbnRpbnVhdGlvbiA9IGNyZWF0ZUNvbnRpbnVhdGlvbih0aGlzLCB0aGlzQXJnLCBhcmdBcnJheSk7XG4gICAgICAgIHJldHVybiBjb250aW51YXRpb247XG4gICAgICB9LCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkgPSBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uKGZ1bmN0aW9uIGFwcGx5KHRoaXNBcmcsIGFyZ0FycmF5KSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdGFpbENhbGwoZnVuY3Rpb24odGhpc0FyZywgYXJnQXJyYXkpIHtcbiAgICAgICAgdmFyIGNvbnRpbnVhdGlvbiA9IGNyZWF0ZUNvbnRpbnVhdGlvbih0aGlzLCB0aGlzQXJnLCBhcmdBcnJheSk7XG4gICAgICAgIHJldHVybiBjb250aW51YXRpb247XG4gICAgICB9LCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uKGZ1bmMpIHtcbiAgICBpZiAoaXNUYWlsUmVjdXJzaXZlTmFtZSA9PT0gbnVsbCkge1xuICAgICAgc2V0dXBQcm9wZXJUYWlsQ2FsbHMoKTtcbiAgICB9XG4gICAgc2V0UHJpdmF0ZShmdW5jLCBpc1RhaWxSZWN1cnNpdmVOYW1lLCB0cnVlKTtcbiAgICByZXR1cm4gZnVuYztcbiAgfVxuICByZXR1cm4ge1xuICAgIGdldCBjcmVhdGVDb250aW51YXRpb24oKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQ29udGludWF0aW9uO1xuICAgIH0sXG4gICAgZ2V0IHRhaWxDYWxsKCkge1xuICAgICAgcmV0dXJuIHRhaWxDYWxsO1xuICAgIH0sXG4gICAgZ2V0IGNvbnN0cnVjdCgpIHtcbiAgICAgIHJldHVybiBjb25zdHJ1Y3Q7XG4gICAgfSxcbiAgICBnZXQgaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbi5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3Byb3BlclRhaWxDYWxscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdFRhaWxSZWN1cnNpdmVGdW5jdGlvbi5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXy5pbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NhbGwuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jYWxsLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3Byb3BlclRhaWxDYWxsc180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vcHJvcGVyVGFpbENhbGxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jYWxsLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3Byb3BlclRhaWxDYWxsc180Nl9qc19fLnRhaWxDYWxsO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NvbnRpbnVhdGlvbi5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NvbnRpbnVhdGlvbi5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3Byb3BlclRhaWxDYWxscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY29udGludWF0aW9uLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X3Byb3BlclRhaWxDYWxsc180Nl9qc19fLmNyZWF0ZUNvbnRpbnVhdGlvbjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jb25zdHJ1Y3QuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jb25zdHJ1Y3QuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfcHJvcGVyVGFpbENhbGxzXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9wcm9wZXJUYWlsQ2FsbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NvbnN0cnVjdC5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19wcm9wZXJUYWlsQ2FsbHNfNDZfanNfXy5jb25zdHJ1Y3Q7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3Byb3BlclRhaWxDYWxscy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcm9wZXJUYWlsQ2FsbHMuanNcIjtcbiAgdmFyIGluaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2luaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcm9wZXJUYWlsQ2FsbHMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjYWxsID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jYWxsLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcHJvcGVyVGFpbENhbGxzLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgY29udGludWF0aW9uID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jb250aW51YXRpb24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wcm9wZXJUYWlsQ2FsbHMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjb25zdHJ1Y3QgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2NvbnN0cnVjdC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3Byb3BlclRhaWxDYWxscy5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLmluaXRUYWlsUmVjdXJzaXZlRnVuY3Rpb24gPSBpbml0VGFpbFJlY3Vyc2l2ZUZ1bmN0aW9uO1xuICAkdHJhY2V1clJ1bnRpbWUuY2FsbCA9IGNhbGw7XG4gICR0cmFjZXVyUnVudGltZS5jb250aW51YXRpb24gPSBjb250aW51YXRpb247XG4gICR0cmFjZXVyUnVudGltZS5jb25zdHJ1Y3QgPSBjb25zdHJ1Y3Q7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcmVsYXRpdmVSZXF1aXJlLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3JlbGF0aXZlUmVxdWlyZS5qc1wiO1xuICB2YXIgcGF0aDtcbiAgZnVuY3Rpb24gcmVsYXRpdmVSZXF1aXJlKGNhbGxlclBhdGgsIHJlcXVpcmVkUGF0aCkge1xuICAgIHBhdGggPSBwYXRoIHx8IHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJyAmJiByZXF1aXJlKCdwYXRoJyk7XG4gICAgZnVuY3Rpb24gaXNEaXJlY3RvcnkocGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGguc2xpY2UoLTEpID09PSAnLyc7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzQWJzb2x1dGUocGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGhbMF0gPT09ICcvJztcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNSZWxhdGl2ZShwYXRoKSB7XG4gICAgICByZXR1cm4gcGF0aFswXSA9PT0gJy4nO1xuICAgIH1cbiAgICBpZiAoaXNEaXJlY3RvcnkocmVxdWlyZWRQYXRoKSB8fCBpc0Fic29sdXRlKHJlcXVpcmVkUGF0aCkpXG4gICAgICByZXR1cm47XG4gICAgcmV0dXJuIGlzUmVsYXRpdmUocmVxdWlyZWRQYXRoKSA/IHJlcXVpcmUocGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShjYWxsZXJQYXRoKSwgcmVxdWlyZWRQYXRoKSkgOiByZXF1aXJlKHJlcXVpcmVkUGF0aCk7XG4gIH1cbiAgJHRyYWNldXJSdW50aW1lLnJlcXVpcmUgPSByZWxhdGl2ZVJlcXVpcmU7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvY2hlY2tPYmplY3RDb2VyY2libGUuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvY2hlY2tPYmplY3RDb2VyY2libGUuanNcIjtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIGZ1bmN0aW9uIGNoZWNrT2JqZWN0Q29lcmNpYmxlKHYpIHtcbiAgICBpZiAodiA9PT0gbnVsbCB8fCB2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCdWYWx1ZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIGFuIE9iamVjdCcpO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIGNoZWNrT2JqZWN0Q29lcmNpYmxlO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwcmVhZC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwcmVhZC5qc1wiO1xuICB2YXIgY2hlY2tPYmplY3RDb2VyY2libGUgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vY2hlY2tPYmplY3RDb2VyY2libGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwcmVhZC5qc1wiKSkuZGVmYXVsdDtcbiAgZnVuY3Rpb24gc3ByZWFkKCkge1xuICAgIHZhciBydiA9IFtdLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgaXRlclJlc3VsdDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlVG9TcHJlYWQgPSBjaGVja09iamVjdENvZXJjaWJsZShhcmd1bWVudHNbaV0pO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZVRvU3ByZWFkW1N5bWJvbC5pdGVyYXRvcl0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IHNwcmVhZCBub24taXRlcmFibGUgb2JqZWN0LicpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXIgPSB2YWx1ZVRvU3ByZWFkW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICAgIHdoaWxlICghKGl0ZXJSZXN1bHQgPSBpdGVyLm5leHQoKSkuZG9uZSkge1xuICAgICAgICBydltqKytdID0gaXRlclJlc3VsdC52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gc3ByZWFkO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9zcHJlYWQuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3ByZWFkLmpzXCI7XG4gIHZhciBzcHJlYWQgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL3NwcmVhZC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3NwcmVhZC5qc1wiKSkuZGVmYXVsdDtcbiAgJHRyYWNldXJSdW50aW1lLnNwcmVhZCA9IHNwcmVhZDtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2l0ZXJhdG9yVG9BcnJheS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2l0ZXJhdG9yVG9BcnJheS5qc1wiO1xuICBmdW5jdGlvbiBpdGVyYXRvclRvQXJyYXkoaXRlcikge1xuICAgIHZhciBydiA9IFtdO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgdG1wO1xuICAgIHdoaWxlICghKHRtcCA9IGl0ZXIubmV4dCgpKS5kb25lKSB7XG4gICAgICBydltpKytdID0gdG1wLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBpdGVyYXRvclRvQXJyYXk7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2Rlc3RydWN0dXJpbmcuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZGVzdHJ1Y3R1cmluZy5qc1wiO1xuICB2YXIgaXRlcmF0b3JUb0FycmF5ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9pdGVyYXRvclRvQXJyYXkuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9kZXN0cnVjdHVyaW5nLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuaXRlcmF0b3JUb0FycmF5ID0gaXRlcmF0b3JUb0FycmF5O1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9hc3luYy5qc1wiO1xuICB2YXIgJF9fMTIgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmMuanNcIikpLFxuICAgICAgY3JlYXRlUHJpdmF0ZVN5bWJvbCA9ICRfXzEyLmNyZWF0ZVByaXZhdGVTeW1ib2wsXG4gICAgICBnZXRQcml2YXRlID0gJF9fMTIuZ2V0UHJpdmF0ZSxcbiAgICAgIHNldFByaXZhdGUgPSAkX18xMi5zZXRQcml2YXRlO1xuICB2YXIgJF9fMTEgPSBPYmplY3QsXG4gICAgICBjcmVhdGUgPSAkX18xMS5jcmVhdGUsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzExLmRlZmluZVByb3BlcnR5O1xuICB2YXIgb2JzZXJ2ZU5hbWUgPSBjcmVhdGVQcml2YXRlU3ltYm9sKCk7XG4gIGZ1bmN0aW9uIEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24oKSB7fVxuICBmdW5jdGlvbiBBc3luY0dlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cbiAgQXN5bmNHZW5lcmF0b3JGdW5jdGlvbi5wcm90b3R5cGUgPSBBc3luY0dlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICBBc3luY0dlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXN5bmNHZW5lcmF0b3JGdW5jdGlvbjtcbiAgZGVmaW5lUHJvcGVydHkoQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSwgJ2NvbnN0cnVjdG9yJywge2VudW1lcmFibGU6IGZhbHNlfSk7XG4gIHZhciBBc3luY0dlbmVyYXRvckNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBBc3luY0dlbmVyYXRvckNvbnRleHQob2JzZXJ2ZXIpIHtcbiAgICAgIHZhciAkX18yID0gdGhpcztcbiAgICAgIHRoaXMuZGVjb3JhdGVkT2JzZXJ2ZXIgPSBjcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3Iob2JzZXJ2ZXIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkX18yLmRvbmUgPSB0cnVlO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuaW5SZXR1cm4gPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKEFzeW5jR2VuZXJhdG9yQ29udGV4dCwge1xuICAgICAgdGhyb3c6IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmICghdGhpcy5pblJldHVybikge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeWllbGQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmRvbmUpIHtcbiAgICAgICAgICB0aGlzLmluUmV0dXJuID0gdHJ1ZTtcbiAgICAgICAgICB0aHJvdyB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLmRlY29yYXRlZE9ic2VydmVyLm5leHQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaW5SZXR1cm4gPSB0cnVlO1xuICAgICAgICAgIHRocm93IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICAgICAgfSxcbiAgICAgIHlpZWxkRm9yOiBmdW5jdGlvbihvYnNlcnZhYmxlKSB7XG4gICAgICAgIHZhciBjdHggPSB0aGlzO1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZUZvckVhY2gob2JzZXJ2YWJsZVtTeW1ib2wub2JzZXJ2ZXJdLmJpbmQob2JzZXJ2YWJsZSksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKGN0eC5kb25lKSB7XG4gICAgICAgICAgICB0aGlzLnJldHVybigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjdHguZGVjb3JhdGVkT2JzZXJ2ZXIubmV4dCh2YWx1ZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY3R4LmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgY3R4LmRvbmUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCB7fSk7XG4gIH0oKTtcbiAgQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGVbU3ltYm9sLm9ic2VydmVyXSA9IGZ1bmN0aW9uKG9ic2VydmVyKSB7XG4gICAgdmFyIG9ic2VydmUgPSBnZXRQcml2YXRlKHRoaXMsIG9ic2VydmVOYW1lKTtcbiAgICB2YXIgY3R4ID0gbmV3IEFzeW5jR2VuZXJhdG9yQ29udGV4dChvYnNlcnZlcik7XG4gICAgc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2ZShjdHgpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghY3R4LmRvbmUpIHtcbiAgICAgICAgY3R4LmRlY29yYXRlZE9ic2VydmVyLnJldHVybih2YWx1ZSk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIGlmICghY3R4LmRvbmUpIHtcbiAgICAgICAgY3R4LmRlY29yYXRlZE9ic2VydmVyLnRocm93KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3R4LmRlY29yYXRlZE9ic2VydmVyO1xuICB9O1xuICBkZWZpbmVQcm9wZXJ0eShBc3luY0dlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSwgU3ltYm9sLm9ic2VydmVyLCB7ZW51bWVyYWJsZTogZmFsc2V9KTtcbiAgZnVuY3Rpb24gaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb25PYmplY3QpIHtcbiAgICBmdW5jdGlvbk9iamVjdC5wcm90b3R5cGUgPSBjcmVhdGUoQXN5bmNHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUpO1xuICAgIGZ1bmN0aW9uT2JqZWN0Ll9fcHJvdG9fXyA9IEFzeW5jR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gICAgcmV0dXJuIGZ1bmN0aW9uT2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2Uob2JzZXJ2ZSwgZnVuY3Rpb25PYmplY3QpIHtcbiAgICBmb3IgKHZhciBhcmdzID0gW10sXG4gICAgICAgICRfXzEwID0gMjsgJF9fMTAgPCBhcmd1bWVudHMubGVuZ3RoOyAkX18xMCsrKVxuICAgICAgYXJnc1skX18xMCAtIDJdID0gYXJndW1lbnRzWyRfXzEwXTtcbiAgICB2YXIgb2JqZWN0ID0gY3JlYXRlKGZ1bmN0aW9uT2JqZWN0LnByb3RvdHlwZSk7XG4gICAgc2V0UHJpdmF0ZShvYmplY3QsIG9ic2VydmVOYW1lLCBvYnNlcnZlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIG9ic2VydmVGb3JFYWNoKG9ic2VydmUsIG5leHQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgZ2VuZXJhdG9yID0gb2JzZXJ2ZSh7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQuY2FsbChnZW5lcmF0b3IsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhyb3c6IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBzY2hlZHVsZShhc3luY0YpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luY0YpO1xuICB9XG4gIHZhciBnZW5lcmF0b3IgPSBTeW1ib2woKTtcbiAgdmFyIG9uRG9uZSA9IFN5bWJvbCgpO1xuICB2YXIgRGVjb3JhdGVkR2VuZXJhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRGVjb3JhdGVkR2VuZXJhdG9yKF9nZW5lcmF0b3IsIF9vbkRvbmUpIHtcbiAgICAgIHRoaXNbZ2VuZXJhdG9yXSA9IF9nZW5lcmF0b3I7XG4gICAgICB0aGlzW29uRG9uZV0gPSBfb25Eb25lO1xuICAgIH1cbiAgICByZXR1cm4gKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoRGVjb3JhdGVkR2VuZXJhdG9yLCB7XG4gICAgICBuZXh0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpc1tnZW5lcmF0b3JdLm5leHQodmFsdWUpO1xuICAgICAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQgJiYgcmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICB0aGlzW29uRG9uZV0uY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIHRocm93OiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICB0aGlzW29uRG9uZV0uY2FsbCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbZ2VuZXJhdG9yXS50aHJvdyhlcnJvcik7XG4gICAgICB9LFxuICAgICAgcmV0dXJuOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzW29uRG9uZV0uY2FsbCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbZ2VuZXJhdG9yXS5yZXR1cm4odmFsdWUpO1xuICAgICAgfVxuICAgIH0sIHt9KTtcbiAgfSgpO1xuICBmdW5jdGlvbiBjcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IoZ2VuZXJhdG9yLCBvbkRvbmUpIHtcbiAgICByZXR1cm4gbmV3IERlY29yYXRlZEdlbmVyYXRvcihnZW5lcmF0b3IsIG9uRG9uZSk7XG4gIH1cbiAgQXJyYXkucHJvdG90eXBlW1N5bWJvbC5vYnNlcnZlcl0gPSBmdW5jdGlvbihvYnNlcnZlcikge1xuICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgdmFyIGRlY29yYXRlZE9ic2VydmVyID0gY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yKG9ic2VydmVyLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkb25lID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB2YXIgJF9fNiA9IHRydWU7XG4gICAgdmFyICRfXzcgPSBmYWxzZTtcbiAgICB2YXIgJF9fOCA9IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgZm9yICh2YXIgJF9fNCA9IHZvaWQgMCxcbiAgICAgICAgICAkX18zID0gKHRoaXMpW1N5bWJvbC5pdGVyYXRvcl0oKTsgISgkX182ID0gKCRfXzQgPSAkX18zLm5leHQoKSkuZG9uZSk7ICRfXzYgPSB0cnVlKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9ICRfXzQudmFsdWU7XG4gICAgICAgIHtcbiAgICAgICAgICBkZWNvcmF0ZWRPYnNlcnZlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKCRfXzkpIHtcbiAgICAgICRfXzcgPSB0cnVlO1xuICAgICAgJF9fOCA9ICRfXzk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghJF9fNiAmJiAkX18zLnJldHVybiAhPSBudWxsKSB7XG4gICAgICAgICAgJF9fMy5yZXR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKCRfXzcpIHtcbiAgICAgICAgICB0aHJvdyAkX184O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGRlY29yYXRlZE9ic2VydmVyLnJldHVybigpO1xuICAgIHJldHVybiBkZWNvcmF0ZWRPYnNlcnZlcjtcbiAgfTtcbiAgZGVmaW5lUHJvcGVydHkoQXJyYXkucHJvdG90eXBlLCBTeW1ib2wub2JzZXJ2ZXIsIHtlbnVtZXJhYmxlOiBmYWxzZX0pO1xuICByZXR1cm4ge1xuICAgIGdldCBpbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbjtcbiAgICB9LFxuICAgIGdldCBjcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2U7XG4gICAgfSxcbiAgICBnZXQgb2JzZXJ2ZUZvckVhY2goKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2ZUZvckVhY2g7XG4gICAgfSxcbiAgICBnZXQgc2NoZWR1bGUoKSB7XG4gICAgICByZXR1cm4gc2NoZWR1bGU7XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlRGVjb3JhdGVkR2VuZXJhdG9yKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZURlY29yYXRlZEdlbmVyYXRvcjtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24uanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9pbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbi5qc1wiO1xuICB2YXIgJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19hc3luY180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vYXN5bmMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRBc3luY0dlbmVyYXRvckZ1bmN0aW9uLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18uaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb247XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlQXN5bmNHZW5lcmF0b3JJbnN0YW5jZS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2UuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2FzeW5jLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18uY3JlYXRlQXN5bmNHZW5lcmF0b3JJbnN0YW5jZTtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9vYnNlcnZlRm9yRWFjaC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL29ic2VydmVGb3JFYWNoLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3luYy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvb2JzZXJ2ZUZvckVhY2guanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXy5vYnNlcnZlRm9yRWFjaDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zY2hlZHVsZS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NjaGVkdWxlLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2FzeW5jXzQ2X2pzX18gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3luYy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc2NoZWR1bGUuanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXy5zY2hlZHVsZTtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2FzeW5jLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IuanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfYXN5bmNfNDZfanNfXy5jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3I7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2FzeW5jLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2FzeW5jLmpzXCI7XG4gIHZhciBpbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGNyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2UgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2NyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2UuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9hc3luYy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIG9ic2VydmVGb3JFYWNoID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9vYnNlcnZlRm9yRWFjaC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2FzeW5jLmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgc2NoZWR1bGUgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL3NjaGVkdWxlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvYXN5bmMuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2NyZWF0ZURlY29yYXRlZEdlbmVyYXRvci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2FzeW5jLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuaW5pdEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24gPSBpbml0QXN5bmNHZW5lcmF0b3JGdW5jdGlvbjtcbiAgJHRyYWNldXJSdW50aW1lLmNyZWF0ZUFzeW5jR2VuZXJhdG9ySW5zdGFuY2UgPSBjcmVhdGVBc3luY0dlbmVyYXRvckluc3RhbmNlO1xuICAkdHJhY2V1clJ1bnRpbWUub2JzZXJ2ZUZvckVhY2ggPSBvYnNlcnZlRm9yRWFjaDtcbiAgJHRyYWNldXJSdW50aW1lLnNjaGVkdWxlID0gc2NoZWR1bGU7XG4gICR0cmFjZXVyUnVudGltZS5jcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3IgPSBjcmVhdGVEZWNvcmF0ZWRHZW5lcmF0b3I7XG4gIHJldHVybiB7fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9nZW5lcmF0b3JzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZ2VuZXJhdG9ycy5qc1wiO1xuICB2YXIgJF9fMiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9wcml2YXRlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9nZW5lcmF0b3JzLmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX18yLmNyZWF0ZVByaXZhdGVTeW1ib2wsXG4gICAgICBnZXRQcml2YXRlID0gJF9fMi5nZXRQcml2YXRlLFxuICAgICAgc2V0UHJpdmF0ZSA9ICRfXzIuc2V0UHJpdmF0ZTtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciAkX18xID0gT2JqZWN0LFxuICAgICAgY3JlYXRlID0gJF9fMS5jcmVhdGUsXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzID0gJF9fMS5kZWZpbmVQcm9wZXJ0aWVzLFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xLmRlZmluZVByb3BlcnR5O1xuICBmdW5jdGlvbiBub25FbnVtKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9O1xuICB9XG4gIHZhciBTVF9ORVdCT1JOID0gMDtcbiAgdmFyIFNUX0VYRUNVVElORyA9IDE7XG4gIHZhciBTVF9TVVNQRU5ERUQgPSAyO1xuICB2YXIgU1RfQ0xPU0VEID0gMztcbiAgdmFyIEVORF9TVEFURSA9IC0yO1xuICB2YXIgUkVUSFJPV19TVEFURSA9IC0zO1xuICBmdW5jdGlvbiBnZXRJbnRlcm5hbEVycm9yKHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcignVHJhY2V1ciBjb21waWxlciBidWc6IGludmFsaWQgc3RhdGUgaW4gc3RhdGUgbWFjaGluZTogJyArIHN0YXRlKTtcbiAgfVxuICB2YXIgUkVUVVJOX1NFTlRJTkVMID0ge307XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckNvbnRleHQoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IDA7XG4gICAgdGhpcy5HU3RhdGUgPSBTVF9ORVdCT1JOO1xuICAgIHRoaXMuc3RvcmVkRXhjZXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZmluYWxseUZhbGxUaHJvdWdoID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc2VudF8gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm9sZFJldHVyblZhbHVlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudHJ5U3RhY2tfID0gW107XG4gIH1cbiAgR2VuZXJhdG9yQ29udGV4dC5wcm90b3R5cGUgPSB7XG4gICAgcHVzaFRyeTogZnVuY3Rpb24oY2F0Y2hTdGF0ZSwgZmluYWxseVN0YXRlKSB7XG4gICAgICBpZiAoZmluYWxseVN0YXRlICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBmaW5hbGx5RmFsbFRocm91Z2ggPSBudWxsO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlTdGFja18ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBpZiAodGhpcy50cnlTdGFja19baV0uY2F0Y2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZmluYWxseUZhbGxUaHJvdWdoID0gdGhpcy50cnlTdGFja19baV0uY2F0Y2g7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbmFsbHlGYWxsVGhyb3VnaCA9PT0gbnVsbClcbiAgICAgICAgICBmaW5hbGx5RmFsbFRocm91Z2ggPSBSRVRIUk9XX1NUQVRFO1xuICAgICAgICB0aGlzLnRyeVN0YWNrXy5wdXNoKHtcbiAgICAgICAgICBmaW5hbGx5OiBmaW5hbGx5U3RhdGUsXG4gICAgICAgICAgZmluYWxseUZhbGxUaHJvdWdoOiBmaW5hbGx5RmFsbFRocm91Z2hcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoY2F0Y2hTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnRyeVN0YWNrXy5wdXNoKHtjYXRjaDogY2F0Y2hTdGF0ZX0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgcG9wVHJ5OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudHJ5U3RhY2tfLnBvcCgpO1xuICAgIH0sXG4gICAgbWF5YmVVbmNhdGNoYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zdG9yZWRFeGNlcHRpb24gPT09IFJFVFVSTl9TRU5USU5FTCkge1xuICAgICAgICB0aHJvdyBSRVRVUk5fU0VOVElORUw7XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXQgc2VudCgpIHtcbiAgICAgIHRoaXMubWF5YmVUaHJvdygpO1xuICAgICAgcmV0dXJuIHRoaXMuc2VudF87XG4gICAgfSxcbiAgICBzZXQgc2VudCh2KSB7XG4gICAgICB0aGlzLnNlbnRfID0gdjtcbiAgICB9LFxuICAgIGdldCBzZW50SWdub3JlVGhyb3coKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW50XztcbiAgICB9LFxuICAgIG1heWJlVGhyb3c6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aW9uID09PSAndGhyb3cnKSB7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gJ25leHQnO1xuICAgICAgICB0aHJvdyB0aGlzLnNlbnRfO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZSkge1xuICAgICAgICBjYXNlIEVORF9TVEFURTpcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY2FzZSBSRVRIUk9XX1NUQVRFOlxuICAgICAgICAgIHRocm93IHRoaXMuc3RvcmVkRXhjZXB0aW9uO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IGdldEludGVybmFsRXJyb3IodGhpcy5zdGF0ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBoYW5kbGVFeGNlcHRpb246IGZ1bmN0aW9uKGV4KSB7XG4gICAgICB0aGlzLkdTdGF0ZSA9IFNUX0NMT1NFRDtcbiAgICAgIHRoaXMuc3RhdGUgPSBFTkRfU1RBVEU7XG4gICAgICB0aHJvdyBleDtcbiAgICB9LFxuICAgIHdyYXBZaWVsZFN0YXI6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XG4gICAgICB2YXIgY3R4ID0gdGhpcztcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0b3IubmV4dCh2KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhyb3c6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgIGlmIChlID09PSBSRVRVUk5fU0VOVElORUwpIHtcbiAgICAgICAgICAgIGlmIChpdGVyYXRvci5yZXR1cm4pIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gaXRlcmF0b3IucmV0dXJuKGN0eC5yZXR1cm5WYWx1ZSk7XG4gICAgICAgICAgICAgIGlmICghcmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICBjdHgucmV0dXJuVmFsdWUgPSBjdHgub2xkUmV0dXJuVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdHgucmV0dXJuVmFsdWUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXRlcmF0b3IudGhyb3cpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvci50aHJvdyhlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlcmF0b3IucmV0dXJuICYmIGl0ZXJhdG9yLnJldHVybigpO1xuICAgICAgICAgIHRocm93ICRUeXBlRXJyb3IoJ0lubmVyIGl0ZXJhdG9yIGRvZXMgbm90IGhhdmUgYSB0aHJvdyBtZXRob2QnKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIG5leHRPclRocm93KGN0eCwgbW92ZU5leHQsIGFjdGlvbiwgeCkge1xuICAgIHN3aXRjaCAoY3R4LkdTdGF0ZSkge1xuICAgICAgY2FzZSBTVF9FWEVDVVRJTkc6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigoXCJcXFwiXCIgKyBhY3Rpb24gKyBcIlxcXCIgb24gZXhlY3V0aW5nIGdlbmVyYXRvclwiKSk7XG4gICAgICBjYXNlIFNUX0NMT1NFRDpcbiAgICAgICAgaWYgKGFjdGlvbiA9PSAnbmV4dCcpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRvbmU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh4ID09PSBSRVRVUk5fU0VOVElORUwpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IGN0eC5yZXR1cm5WYWx1ZSxcbiAgICAgICAgICAgIGRvbmU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHRocm93IHg7XG4gICAgICBjYXNlIFNUX05FV0JPUk46XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICd0aHJvdycpIHtcbiAgICAgICAgICBjdHguR1N0YXRlID0gU1RfQ0xPU0VEO1xuICAgICAgICAgIGlmICh4ID09PSBSRVRVUk5fU0VOVElORUwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBjdHgucmV0dXJuVmFsdWUsXG4gICAgICAgICAgICAgIGRvbmU6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IHg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggIT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aHJvdyAkVHlwZUVycm9yKCdTZW50IHZhbHVlIHRvIG5ld2Jvcm4gZ2VuZXJhdG9yJyk7XG4gICAgICBjYXNlIFNUX1NVU1BFTkRFRDpcbiAgICAgICAgY3R4LkdTdGF0ZSA9IFNUX0VYRUNVVElORztcbiAgICAgICAgY3R4LmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgY3R4LnNlbnQgPSB4O1xuICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFsdWUgPSBtb3ZlTmV4dChjdHgpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGlmIChleCA9PT0gUkVUVVJOX1NFTlRJTkVMKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGN0eDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkb25lID0gdmFsdWUgPT09IGN0eDtcbiAgICAgICAgaWYgKGRvbmUpXG4gICAgICAgICAgdmFsdWUgPSBjdHgucmV0dXJuVmFsdWU7XG4gICAgICAgIGN0eC5HU3RhdGUgPSBkb25lID8gU1RfQ0xPU0VEIDogU1RfU1VTUEVOREVEO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICBkb25lOiBkb25lXG4gICAgICAgIH07XG4gICAgfVxuICB9XG4gIHZhciBjdHhOYW1lID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICB2YXIgbW92ZU5leHROYW1lID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvbigpIHt9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cbiAgR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gIGRlZmluZVByb3BlcnR5KEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKEdlbmVyYXRvckZ1bmN0aW9uKSk7XG4gIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsXG4gICAgbmV4dDogZnVuY3Rpb24odikge1xuICAgICAgcmV0dXJuIG5leHRPclRocm93KGdldFByaXZhdGUodGhpcywgY3R4TmFtZSksIGdldFByaXZhdGUodGhpcywgbW92ZU5leHROYW1lKSwgJ25leHQnLCB2KTtcbiAgICB9LFxuICAgIHRocm93OiBmdW5jdGlvbih2KSB7XG4gICAgICByZXR1cm4gbmV4dE9yVGhyb3coZ2V0UHJpdmF0ZSh0aGlzLCBjdHhOYW1lKSwgZ2V0UHJpdmF0ZSh0aGlzLCBtb3ZlTmV4dE5hbWUpLCAndGhyb3cnLCB2KTtcbiAgICB9LFxuICAgIHJldHVybjogZnVuY3Rpb24odikge1xuICAgICAgdmFyIGN0eCA9IGdldFByaXZhdGUodGhpcywgY3R4TmFtZSk7XG4gICAgICBjdHgub2xkUmV0dXJuVmFsdWUgPSBjdHgucmV0dXJuVmFsdWU7XG4gICAgICBjdHgucmV0dXJuVmFsdWUgPSB2O1xuICAgICAgcmV0dXJuIG5leHRPclRocm93KGN0eCwgZ2V0UHJpdmF0ZSh0aGlzLCBtb3ZlTmV4dE5hbWUpLCAndGhyb3cnLCBSRVRVUk5fU0VOVElORUwpO1xuICAgIH1cbiAgfTtcbiAgZGVmaW5lUHJvcGVydGllcyhHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge2VudW1lcmFibGU6IGZhbHNlfSxcbiAgICBuZXh0OiB7ZW51bWVyYWJsZTogZmFsc2V9LFxuICAgIHRocm93OiB7ZW51bWVyYWJsZTogZmFsc2V9LFxuICAgIHJldHVybjoge2VudW1lcmFibGU6IGZhbHNlfVxuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCBub25FbnVtKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9KSk7XG4gIGZ1bmN0aW9uIGNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGlubmVyRnVuY3Rpb24sIGZ1bmN0aW9uT2JqZWN0LCBzZWxmKSB7XG4gICAgdmFyIG1vdmVOZXh0ID0gZ2V0TW92ZU5leHQoaW5uZXJGdW5jdGlvbiwgc2VsZik7XG4gICAgdmFyIGN0eCA9IG5ldyBHZW5lcmF0b3JDb250ZXh0KCk7XG4gICAgdmFyIG9iamVjdCA9IGNyZWF0ZShmdW5jdGlvbk9iamVjdC5wcm90b3R5cGUpO1xuICAgIHNldFByaXZhdGUob2JqZWN0LCBjdHhOYW1lLCBjdHgpO1xuICAgIHNldFByaXZhdGUob2JqZWN0LCBtb3ZlTmV4dE5hbWUsIG1vdmVOZXh0KTtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIGluaXRHZW5lcmF0b3JGdW5jdGlvbihmdW5jdGlvbk9iamVjdCkge1xuICAgIGZ1bmN0aW9uT2JqZWN0LnByb3RvdHlwZSA9IGNyZWF0ZShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUpO1xuICAgIGZ1bmN0aW9uT2JqZWN0Ll9fcHJvdG9fXyA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICAgIHJldHVybiBmdW5jdGlvbk9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBBc3luY0Z1bmN0aW9uQ29udGV4dCgpIHtcbiAgICBHZW5lcmF0b3JDb250ZXh0LmNhbGwodGhpcyk7XG4gICAgdGhpcy5lcnIgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGN0eCA9IHRoaXM7XG4gICAgY3R4LnJlc3VsdCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgY3R4LnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgY3R4LnJlamVjdCA9IHJlamVjdDtcbiAgICB9KTtcbiAgfVxuICBBc3luY0Z1bmN0aW9uQ29udGV4dC5wcm90b3R5cGUgPSBjcmVhdGUoR2VuZXJhdG9yQ29udGV4dC5wcm90b3R5cGUpO1xuICBBc3luY0Z1bmN0aW9uQ29udGV4dC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLnN0YXRlKSB7XG4gICAgICBjYXNlIEVORF9TVEFURTpcbiAgICAgICAgdGhpcy5yZXNvbHZlKHRoaXMucmV0dXJuVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUkVUSFJPV19TVEFURTpcbiAgICAgICAgdGhpcy5yZWplY3QodGhpcy5zdG9yZWRFeGNlcHRpb24pO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMucmVqZWN0KGdldEludGVybmFsRXJyb3IodGhpcy5zdGF0ZSkpO1xuICAgIH1cbiAgfTtcbiAgQXN5bmNGdW5jdGlvbkNvbnRleHQucHJvdG90eXBlLmhhbmRsZUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUgPSBSRVRIUk9XX1NUQVRFO1xuICB9O1xuICBmdW5jdGlvbiBhc3luY1dyYXAoaW5uZXJGdW5jdGlvbiwgc2VsZikge1xuICAgIHZhciBtb3ZlTmV4dCA9IGdldE1vdmVOZXh0KGlubmVyRnVuY3Rpb24sIHNlbGYpO1xuICAgIHZhciBjdHggPSBuZXcgQXN5bmNGdW5jdGlvbkNvbnRleHQoKTtcbiAgICBjdHguY3JlYXRlQ2FsbGJhY2sgPSBmdW5jdGlvbihuZXdTdGF0ZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGN0eC5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgICBjdHgudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgbW92ZU5leHQoY3R4KTtcbiAgICAgIH07XG4gICAgfTtcbiAgICBjdHguZXJyYmFjayA9IGZ1bmN0aW9uKGVycikge1xuICAgICAgaGFuZGxlQ2F0Y2goY3R4LCBlcnIpO1xuICAgICAgbW92ZU5leHQoY3R4KTtcbiAgICB9O1xuICAgIG1vdmVOZXh0KGN0eCk7XG4gICAgcmV0dXJuIGN0eC5yZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0TW92ZU5leHQoaW5uZXJGdW5jdGlvbiwgc2VsZikge1xuICAgIHJldHVybiBmdW5jdGlvbihjdHgpIHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIGlubmVyRnVuY3Rpb24uY2FsbChzZWxmLCBjdHgpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGhhbmRsZUNhdGNoKGN0eCwgZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVDYXRjaChjdHgsIGV4KSB7XG4gICAgY3R4LnN0b3JlZEV4Y2VwdGlvbiA9IGV4O1xuICAgIHZhciBsYXN0ID0gY3R4LnRyeVN0YWNrX1tjdHgudHJ5U3RhY2tfLmxlbmd0aCAtIDFdO1xuICAgIGlmICghbGFzdCkge1xuICAgICAgY3R4LmhhbmRsZUV4Y2VwdGlvbihleCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN0eC5zdGF0ZSA9IGxhc3QuY2F0Y2ggIT09IHVuZGVmaW5lZCA/IGxhc3QuY2F0Y2ggOiBsYXN0LmZpbmFsbHk7XG4gICAgaWYgKGxhc3QuZmluYWxseUZhbGxUaHJvdWdoICE9PSB1bmRlZmluZWQpXG4gICAgICBjdHguZmluYWxseUZhbGxUaHJvdWdoID0gbGFzdC5maW5hbGx5RmFsbFRocm91Z2g7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBnZXQgY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoKSB7XG4gICAgICByZXR1cm4gY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2U7XG4gICAgfSxcbiAgICBnZXQgaW5pdEdlbmVyYXRvckZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGluaXRHZW5lcmF0b3JGdW5jdGlvbjtcbiAgICB9LFxuICAgIGdldCBhc3luY1dyYXAoKSB7XG4gICAgICByZXR1cm4gYXN5bmNXcmFwO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9hc3luY1dyYXAuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9hc3luY1dyYXAuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfZ2VuZXJhdG9yc180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vZ2VuZXJhdG9ycy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvYXN5bmNXcmFwLmpzXCIpKTtcbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2dlbmVyYXRvcnNfNDZfanNfXy5hc3luY1dyYXA7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdEdlbmVyYXRvckZ1bmN0aW9uLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvaW5pdEdlbmVyYXRvckZ1bmN0aW9uLmpzXCI7XG4gIHZhciAkX190cmFjZXVyXzQ1X3J1bnRpbWVfNjRfMF80Nl8wXzQ2XzExMV80N19zcmNfNDdfcnVudGltZV80N19tb2R1bGVzXzQ3X2dlbmVyYXRvcnNfNDZfanNfXyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2dlbmVyYXRvcnMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2luaXRHZW5lcmF0b3JGdW5jdGlvbi5qc1wiKSk7XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gJF9fdHJhY2V1cl80NV9ydW50aW1lXzY0XzBfNDZfMF80Nl8xMTFfNDdfc3JjXzQ3X3J1bnRpbWVfNDdfbW9kdWxlc180N19nZW5lcmF0b3JzXzQ2X2pzX18uaW5pdEdlbmVyYXRvckZ1bmN0aW9uO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2NyZWF0ZUdlbmVyYXRvckluc3RhbmNlLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UuanNcIjtcbiAgdmFyICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfZ2VuZXJhdG9yc180Nl9qc19fID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vZ2VuZXJhdG9ycy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UuanNcIikpO1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX3RyYWNldXJfNDVfcnVudGltZV82NF8wXzQ2XzBfNDZfMTExXzQ3X3NyY180N19ydW50aW1lXzQ3X21vZHVsZXNfNDdfZ2VuZXJhdG9yc180Nl9qc19fLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlO1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9nZW5lcmF0b3JzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2dlbmVyYXRvcnMuanNcIjtcbiAgdmFyIGFzeW5jV3JhcCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvYXN5bmNXcmFwLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZ2VuZXJhdG9ycy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGluaXRHZW5lcmF0b3JGdW5jdGlvbiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL21vZHVsZXMvaW5pdEdlbmVyYXRvckZ1bmN0aW9uLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvZ2VuZXJhdG9ycy5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyIGNyZWF0ZUdlbmVyYXRvckluc3RhbmNlID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2dlbmVyYXRvcnMuanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS5hc3luY1dyYXAgPSBhc3luY1dyYXA7XG4gICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24gPSBpbml0R2VuZXJhdG9yRnVuY3Rpb247XG4gICR0cmFjZXVyUnVudGltZS5jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZSA9IGNyZWF0ZUdlbmVyYXRvckluc3RhbmNlO1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3Bhd24uanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvbW9kdWxlcy9zcGF3bi5qc1wiO1xuICBmdW5jdGlvbiBzcGF3bihzZWxmLCBhcmdzLCBnZW4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBmdW5jdGlvbiBmdWxmaWxsKHYpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdGVwKGdlbi5uZXh0KHYpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHN0ZXAoZ2VuLnRocm93KHYpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gc3RlcChyZXMpIHtcbiAgICAgICAgaWYgKHJlcy5kb25lKSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXMudmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZShyZXMudmFsdWUpLnRoZW4oZnVsZmlsbCwgcmVqZWN0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGVwKChnZW4gPSBnZW4uYXBwbHkoc2VsZiwgYXJncykpLm5leHQoKSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHtnZXQgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBzcGF3bjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3Bhd24uanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvc3Bhd24uanNcIjtcbiAgdmFyIHNwYXduID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vbW9kdWxlcy9zcGF3bi5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3NwYXduLmpzXCIpKS5kZWZhdWx0O1xuICAkdHJhY2V1clJ1bnRpbWUuc3Bhd24gPSBzcGF3bjtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL2dldFRlbXBsYXRlT2JqZWN0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvZ2V0VGVtcGxhdGVPYmplY3QuanNcIjtcbiAgdmFyICRfXzEgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzEuZGVmaW5lUHJvcGVydHksXG4gICAgICBmcmVlemUgPSAkX18xLmZyZWV6ZTtcbiAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgZnVuY3Rpb24gZ2V0VGVtcGxhdGVPYmplY3QocmF3KSB7XG4gICAgdmFyIGNvb2tlZCA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIga2V5ID0gcmF3LmpvaW4oJyR7fScpO1xuICAgIHZhciB0ZW1wbGF0ZU9iamVjdCA9IG1hcFtrZXldO1xuICAgIGlmICh0ZW1wbGF0ZU9iamVjdClcbiAgICAgIHJldHVybiB0ZW1wbGF0ZU9iamVjdDtcbiAgICBpZiAoIWNvb2tlZCkge1xuICAgICAgY29va2VkID0gc2xpY2UuY2FsbChyYXcpO1xuICAgIH1cbiAgICByZXR1cm4gbWFwW2tleV0gPSBmcmVlemUoZGVmaW5lUHJvcGVydHkoY29va2VkLCAncmF3Jywge3ZhbHVlOiBmcmVlemUocmF3KX0pKTtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIGdldFRlbXBsYXRlT2JqZWN0O1xuICAgIH19O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS90ZW1wbGF0ZS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS90ZW1wbGF0ZS5qc1wiO1xuICB2YXIgZ2V0VGVtcGxhdGVPYmplY3QgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL2dldFRlbXBsYXRlT2JqZWN0LmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvdGVtcGxhdGUuanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS5nZXRUZW1wbGF0ZU9iamVjdCA9IGdldFRlbXBsYXRlT2JqZWN0O1xuICByZXR1cm4ge307XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL21vZHVsZXMvc3ByZWFkUHJvcGVydGllcy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9tb2R1bGVzL3NwcmVhZFByb3BlcnRpZXMuanNcIjtcbiAgdmFyICRfXzEgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzEuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgICAgZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMsXG4gICAgICBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9ICRfXzEucHJvcGVydHlJc0VudW1lcmFibGU7XG4gIGZ1bmN0aW9uIGNyZWF0ZURhdGFQcm9wZXJ0eShvLCBwLCB2KSB7XG4gICAgZGVmaW5lUHJvcGVydHkobywgcCwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiB2LFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBjb3B5RGF0YVByb3BlcnRpZXModGFyZ2V0LCBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGNvcHkgPSBmdW5jdGlvbihrZXlzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBrZXlzW2ldO1xuICAgICAgICBpZiAocHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgdmFyIHByb3BWYWx1ZSA9IHNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICBjcmVhdGVEYXRhUHJvcGVydHkodGFyZ2V0LCBuZXh0S2V5LCBwcm9wVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBjb3B5KGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKSk7XG4gICAgY29weShnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoc291cmNlKSk7XG4gIH1cbiAgdmFyICRfX2RlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gYXJndW1lbnRzWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb3B5RGF0YVByb3BlcnRpZXModGFyZ2V0LCBhcmd1bWVudHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9O1xuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX2RlZmF1bHQ7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL2pzeC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9qc3guanNcIjtcbiAgdmFyIHNwcmVhZFByb3BlcnRpZXMgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9tb2R1bGVzL3NwcmVhZFByb3BlcnRpZXMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9qc3guanNcIikpLmRlZmF1bHQ7XG4gICR0cmFjZXVyUnVudGltZS5zcHJlYWRQcm9wZXJ0aWVzID0gc3ByZWFkUHJvcGVydGllcztcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCI7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3N5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9jbGFzc2VzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vZXhwb3J0U3Rhci5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3Byb3BlclRhaWxDYWxscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3JlbGF0aXZlUmVxdWlyZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3NwcmVhZC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2Rlc3RydWN0dXJpbmcuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3luYy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2dlbmVyYXRvcnMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9ydW50aW1lLW1vZHVsZXMuanNcIikpO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9zcGF3bi5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3J1bnRpbWUtbW9kdWxlcy5qc1wiKSk7XG4gICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3RlbXBsYXRlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vanN4LmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIpKTtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcnVudGltZS1tb2R1bGVzLmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9mcm96ZW4tZGF0YS5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9mcm96ZW4tZGF0YS5qc1wiO1xuICBmdW5jdGlvbiBmaW5kSW5kZXgoYXJyLCBrZXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGFycltpXSA9PT0ga2V5KSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgZnVuY3Rpb24gc2V0RnJvemVuKGFyciwga2V5LCB2YWwpIHtcbiAgICB2YXIgaSA9IGZpbmRJbmRleChhcnIsIGtleSk7XG4gICAgaWYgKGkgPT09IC0xKSB7XG4gICAgICBhcnIucHVzaChrZXksIHZhbCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdldEZyb3plbihhcnIsIGtleSkge1xuICAgIHZhciBpID0gZmluZEluZGV4KGFyciwga2V5KTtcbiAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBhcnJbaSArIDFdO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIGhhc0Zyb3plbihhcnIsIGtleSkge1xuICAgIHJldHVybiBmaW5kSW5kZXgoYXJyLCBrZXkpICE9PSAtMTtcbiAgfVxuICBmdW5jdGlvbiBkZWxldGVGcm96ZW4oYXJyLCBrZXkpIHtcbiAgICB2YXIgaSA9IGZpbmRJbmRleChhcnIsIGtleSk7XG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICBhcnIuc3BsaWNlKGksIDIpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGdldCBzZXRGcm96ZW4oKSB7XG4gICAgICByZXR1cm4gc2V0RnJvemVuO1xuICAgIH0sXG4gICAgZ2V0IGdldEZyb3plbigpIHtcbiAgICAgIHJldHVybiBnZXRGcm96ZW47XG4gICAgfSxcbiAgICBnZXQgaGFzRnJvemVuKCkge1xuICAgICAgcmV0dXJuIGhhc0Zyb3plbjtcbiAgICB9LFxuICAgIGdldCBkZWxldGVGcm96ZW4oKSB7XG4gICAgICByZXR1cm4gZGVsZXRlRnJvemVuO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3V0aWxzLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiO1xuICB2YXIgJGNlaWwgPSBNYXRoLmNlaWw7XG4gIHZhciAkZmxvb3IgPSBNYXRoLmZsb29yO1xuICB2YXIgJGlzRmluaXRlID0gaXNGaW5pdGU7XG4gIHZhciAkaXNOYU4gPSBpc05hTjtcbiAgdmFyICRwb3cgPSBNYXRoLnBvdztcbiAgdmFyICRtaW4gPSBNYXRoLm1pbjtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciAkT2JqZWN0ID0gT2JqZWN0O1xuICBmdW5jdGlvbiB0b09iamVjdCh4KSB7XG4gICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgdGhyb3cgJFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICByZXR1cm4gJE9iamVjdCh4KTtcbiAgfVxuICBmdW5jdGlvbiB0b1VpbnQzMih4KSB7XG4gICAgcmV0dXJuIHggPj4+IDA7XG4gIH1cbiAgZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgIHJldHVybiB4ICYmICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHggPT09ICdmdW5jdGlvbicpO1xuICB9XG4gIGZ1bmN0aW9uIGlzQ2FsbGFibGUoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgfVxuICBmdW5jdGlvbiBpc051bWJlcih4KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVtYmVyJztcbiAgfVxuICBmdW5jdGlvbiB0b0ludGVnZXIoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoJGlzTmFOKHgpKVxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHggPT09IDAgfHwgISRpc0Zpbml0ZSh4KSlcbiAgICAgIHJldHVybiB4O1xuICAgIHJldHVybiB4ID4gMCA/ICRmbG9vcih4KSA6ICRjZWlsKHgpO1xuICB9XG4gIHZhciBNQVhfU0FGRV9MRU5HVEggPSAkcG93KDIsIDUzKSAtIDE7XG4gIGZ1bmN0aW9uIHRvTGVuZ3RoKHgpIHtcbiAgICB2YXIgbGVuID0gdG9JbnRlZ2VyKHgpO1xuICAgIHJldHVybiBsZW4gPCAwID8gMCA6ICRtaW4obGVuLCBNQVhfU0FGRV9MRU5HVEgpO1xuICB9XG4gIGZ1bmN0aW9uIGNoZWNrSXRlcmFibGUoeCkge1xuICAgIHJldHVybiAhaXNPYmplY3QoeCkgPyB1bmRlZmluZWQgOiB4W1N5bWJvbC5pdGVyYXRvcl07XG4gIH1cbiAgZnVuY3Rpb24gaXNDb25zdHJ1Y3Rvcih4KSB7XG4gICAgcmV0dXJuIGlzQ2FsbGFibGUoeCk7XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QodmFsdWUsIGRvbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZG9uZTogZG9uZVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCBkZXNjcikge1xuICAgIGlmICghKG5hbWUgaW4gb2JqZWN0KSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwgZGVzY3IpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBtYXliZURlZmluZU1ldGhvZChvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVEZWZpbmVDb25zdChvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFkZEZ1bmN0aW9ucyhvYmplY3QsIGZ1bmN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnVuY3Rpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgbmFtZSA9IGZ1bmN0aW9uc1tpXTtcbiAgICAgIHZhciB2YWx1ZSA9IGZ1bmN0aW9uc1tpICsgMV07XG4gICAgICBtYXliZURlZmluZU1ldGhvZChvYmplY3QsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVBZGRDb25zdHMob2JqZWN0LCBjb25zdHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnN0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIG5hbWUgPSBjb25zdHNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBjb25zdHNbaSArIDFdO1xuICAgICAgbWF5YmVEZWZpbmVDb25zdChvYmplY3QsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVBZGRJdGVyYXRvcihvYmplY3QsIGZ1bmMsIFN5bWJvbCkge1xuICAgIGlmICghU3ltYm9sIHx8ICFTeW1ib2wuaXRlcmF0b3IgfHwgb2JqZWN0W1N5bWJvbC5pdGVyYXRvcl0pXG4gICAgICByZXR1cm47XG4gICAgaWYgKG9iamVjdFsnQEBpdGVyYXRvciddKVxuICAgICAgZnVuYyA9IG9iamVjdFsnQEBpdGVyYXRvciddO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIFN5bWJvbC5pdGVyYXRvciwge1xuICAgICAgdmFsdWU6IGZ1bmMsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgdmFyIHBvbHlmaWxscyA9IFtdO1xuICBmdW5jdGlvbiByZWdpc3RlclBvbHlmaWxsKGZ1bmMpIHtcbiAgICBwb2x5ZmlsbHMucHVzaChmdW5jKTtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbEFsbChnbG9iYWwpIHtcbiAgICBwb2x5ZmlsbHMuZm9yRWFjaChmdW5jdGlvbihmKSB7XG4gICAgICByZXR1cm4gZihnbG9iYWwpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0IHRvT2JqZWN0KCkge1xuICAgICAgcmV0dXJuIHRvT2JqZWN0O1xuICAgIH0sXG4gICAgZ2V0IHRvVWludDMyKCkge1xuICAgICAgcmV0dXJuIHRvVWludDMyO1xuICAgIH0sXG4gICAgZ2V0IGlzT2JqZWN0KCkge1xuICAgICAgcmV0dXJuIGlzT2JqZWN0O1xuICAgIH0sXG4gICAgZ2V0IGlzQ2FsbGFibGUoKSB7XG4gICAgICByZXR1cm4gaXNDYWxsYWJsZTtcbiAgICB9LFxuICAgIGdldCBpc051bWJlcigpIHtcbiAgICAgIHJldHVybiBpc051bWJlcjtcbiAgICB9LFxuICAgIGdldCB0b0ludGVnZXIoKSB7XG4gICAgICByZXR1cm4gdG9JbnRlZ2VyO1xuICAgIH0sXG4gICAgZ2V0IHRvTGVuZ3RoKCkge1xuICAgICAgcmV0dXJuIHRvTGVuZ3RoO1xuICAgIH0sXG4gICAgZ2V0IGNoZWNrSXRlcmFibGUoKSB7XG4gICAgICByZXR1cm4gY2hlY2tJdGVyYWJsZTtcbiAgICB9LFxuICAgIGdldCBpc0NvbnN0cnVjdG9yKCkge1xuICAgICAgcmV0dXJuIGlzQ29uc3RydWN0b3I7XG4gICAgfSxcbiAgICBnZXQgY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoKSB7XG4gICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3Q7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVEZWZpbmUoKSB7XG4gICAgICByZXR1cm4gbWF5YmVEZWZpbmU7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVEZWZpbmVNZXRob2QoKSB7XG4gICAgICByZXR1cm4gbWF5YmVEZWZpbmVNZXRob2Q7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVEZWZpbmVDb25zdCgpIHtcbiAgICAgIHJldHVybiBtYXliZURlZmluZUNvbnN0O1xuICAgIH0sXG4gICAgZ2V0IG1heWJlQWRkRnVuY3Rpb25zKCkge1xuICAgICAgcmV0dXJuIG1heWJlQWRkRnVuY3Rpb25zO1xuICAgIH0sXG4gICAgZ2V0IG1heWJlQWRkQ29uc3RzKCkge1xuICAgICAgcmV0dXJuIG1heWJlQWRkQ29uc3RzO1xuICAgIH0sXG4gICAgZ2V0IG1heWJlQWRkSXRlcmF0b3IoKSB7XG4gICAgICByZXR1cm4gbWF5YmVBZGRJdGVyYXRvcjtcbiAgICB9LFxuICAgIGdldCByZWdpc3RlclBvbHlmaWxsKCkge1xuICAgICAgcmV0dXJuIHJlZ2lzdGVyUG9seWZpbGw7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxBbGwoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxBbGw7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWFwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIjtcbiAgdmFyICRfXzE2ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL3ByaXZhdGUuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWFwLmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX18xNi5jcmVhdGVQcml2YXRlU3ltYm9sLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzE2LmdldFByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fMTYuc2V0UHJpdmF0ZTtcbiAgdmFyICRfXzE3ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL2Zyb3plbi1kYXRhLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiKSksXG4gICAgICBkZWxldGVGcm96ZW4gPSAkX18xNy5kZWxldGVGcm96ZW4sXG4gICAgICBnZXRGcm96ZW4gPSAkX18xNy5nZXRGcm96ZW4sXG4gICAgICBzZXRGcm96ZW4gPSAkX18xNy5zZXRGcm96ZW47XG4gIHZhciAkX18xOCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiKSksXG4gICAgICBpc09iamVjdCA9ICRfXzE4LmlzT2JqZWN0LFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzE4LnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBoYXNOYXRpdmVTeW1ib2wgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vaGFzLW5hdGl2ZS1zeW1ib2xzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyICRfXzkgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzkuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAkX185LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGhhc093blByb3BlcnR5ID0gJF9fOS5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgIGlzRXh0ZW5zaWJsZSA9ICRfXzkuaXNFeHRlbnNpYmxlO1xuICB2YXIgZGVsZXRlZFNlbnRpbmVsID0ge307XG4gIHZhciBjb3VudGVyID0gMTtcbiAgdmFyIGhhc2hDb2RlTmFtZSA9IGNyZWF0ZVByaXZhdGVTeW1ib2woKTtcbiAgZnVuY3Rpb24gZ2V0SGFzaENvZGVGb3JPYmplY3Qob2JqKSB7XG4gICAgcmV0dXJuIGdldFByaXZhdGUob2JqLCBoYXNoQ29kZU5hbWUpO1xuICB9XG4gIGZ1bmN0aW9uIGdldE9yU2V0SGFzaENvZGVGb3JPYmplY3Qob2JqKSB7XG4gICAgdmFyIGhhc2ggPSBnZXRIYXNoQ29kZUZvck9iamVjdChvYmopO1xuICAgIGlmICghaGFzaCkge1xuICAgICAgaGFzaCA9IGNvdW50ZXIrKztcbiAgICAgIHNldFByaXZhdGUob2JqLCBoYXNoQ29kZU5hbWUsIGhhc2gpO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuICBmdW5jdGlvbiBsb29rdXBJbmRleChtYXAsIGtleSkge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIG1hcC5zdHJpbmdJbmRleF9ba2V5XTtcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0KGtleSkpIHtcbiAgICAgIGlmICghaXNFeHRlbnNpYmxlKGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGdldEZyb3plbihtYXAuZnJvemVuRGF0YV8sIGtleSk7XG4gICAgICB9XG4gICAgICB2YXIgaGMgPSBnZXRIYXNoQ29kZUZvck9iamVjdChrZXkpO1xuICAgICAgaWYgKGhjID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXAub2JqZWN0SW5kZXhfW2hjXTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcC5wcmltaXRpdmVJbmRleF9ba2V5XTtcbiAgfVxuICBmdW5jdGlvbiBpbml0TWFwKG1hcCkge1xuICAgIG1hcC5lbnRyaWVzXyA9IFtdO1xuICAgIG1hcC5vYmplY3RJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5zdHJpbmdJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5wcmltaXRpdmVJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5mcm96ZW5EYXRhXyA9IFtdO1xuICAgIG1hcC5kZWxldGVkQ291bnRfID0gMDtcbiAgfVxuICB2YXIgTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTWFwKCkge1xuICAgICAgdmFyICRfXzExLFxuICAgICAgICAgICRfXzEyO1xuICAgICAgdmFyIGl0ZXJhYmxlID0gYXJndW1lbnRzWzBdO1xuICAgICAgaWYgKCFpc09iamVjdCh0aGlzKSlcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTWFwIGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgdHlwZScpO1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ2VudHJpZXNfJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTWFwIGNhbiBub3QgYmUgcmVlbnRyYW50bHkgaW5pdGlhbGlzZWQnKTtcbiAgICAgIH1cbiAgICAgIGluaXRNYXAodGhpcyk7XG4gICAgICBpZiAoaXRlcmFibGUgIT09IG51bGwgJiYgaXRlcmFibGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgJF9fNSA9IHRydWU7XG4gICAgICAgIHZhciAkX182ID0gZmFsc2U7XG4gICAgICAgIHZhciAkX183ID0gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZvciAodmFyICRfXzMgPSB2b2lkIDAsXG4gICAgICAgICAgICAgICRfXzIgPSAoaXRlcmFibGUpW1N5bWJvbC5pdGVyYXRvcl0oKTsgISgkX181ID0gKCRfXzMgPSAkX18yLm5leHQoKSkuZG9uZSk7ICRfXzUgPSB0cnVlKSB7XG4gICAgICAgICAgICB2YXIgJF9fMTAgPSAkX18zLnZhbHVlLFxuICAgICAgICAgICAgICAgIGtleSA9ICgkX18xMSA9ICRfXzEwW1N5bWJvbC5pdGVyYXRvcl0oKSwgKCRfXzEyID0gJF9fMTEubmV4dCgpKS5kb25lID8gdm9pZCAwIDogJF9fMTIudmFsdWUpLFxuICAgICAgICAgICAgICAgIHZhbHVlID0gKCRfXzEyID0gJF9fMTEubmV4dCgpKS5kb25lID8gdm9pZCAwIDogJF9fMTIudmFsdWU7XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoJF9fOCkge1xuICAgICAgICAgICRfXzYgPSB0cnVlO1xuICAgICAgICAgICRfXzcgPSAkX184O1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoISRfXzUgJiYgJF9fMi5yZXR1cm4gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAkX18yLnJldHVybigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoJF9fNikge1xuICAgICAgICAgICAgICB0aHJvdyAkX183O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoTWFwLCB7XG4gICAgICBnZXQgc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50cmllc18ubGVuZ3RoIC8gMiAtIHRoaXMuZGVsZXRlZENvdW50XztcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgaW5kZXggPSBsb29rdXBJbmRleCh0aGlzLCBrZXkpO1xuICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmVudHJpZXNfW2luZGV4ICsgMV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbG9va3VwSW5kZXgodGhpcywga2V5KTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmRleCA9IHRoaXMuZW50cmllc18ubGVuZ3RoO1xuICAgICAgICAgIHRoaXMuZW50cmllc19baW5kZXhdID0ga2V5O1xuICAgICAgICAgIHRoaXMuZW50cmllc19baW5kZXggKyAxXSA9IHZhbHVlO1xuICAgICAgICAgIGlmIChpc09iamVjdChrZXkpKSB7XG4gICAgICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICAgICAgICAgIHNldEZyb3plbih0aGlzLmZyb3plbkRhdGFfLCBrZXksIGluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHZhciBoYXNoID0gZ2V0T3JTZXRIYXNoQ29kZUZvck9iamVjdChrZXkpO1xuICAgICAgICAgICAgICB0aGlzLm9iamVjdEluZGV4X1toYXNoXSA9IGluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuc3RyaW5nSW5kZXhfW2tleV0gPSBpbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcmltaXRpdmVJbmRleF9ba2V5XSA9IGluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gbG9va3VwSW5kZXgodGhpcywga2V5KSAhPT0gdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIGRlbGV0ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxvb2t1cEluZGV4KHRoaXMsIGtleSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW50cmllc19baW5kZXhdID0gZGVsZXRlZFNlbnRpbmVsO1xuICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4ICsgMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuZGVsZXRlZENvdW50XysrO1xuICAgICAgICBpZiAoaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICAgIGlmICghaXNFeHRlbnNpYmxlKGtleSkpIHtcbiAgICAgICAgICAgIGRlbGV0ZUZyb3plbih0aGlzLmZyb3plbkRhdGFfLCBrZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGdldEhhc2hDb2RlRm9yT2JqZWN0KGtleSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vYmplY3RJbmRleF9baGFzaF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuc3RyaW5nSW5kZXhfW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMucHJpbWl0aXZlSW5kZXhfW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpbml0TWFwKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrRm4pIHtcbiAgICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgIHZhciBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuZW50cmllc19baSArIDFdO1xuICAgICAgICAgIGlmIChrZXkgPT09IGRlbGV0ZWRTZW50aW5lbClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIGNhbGxiYWNrRm4uY2FsbCh0aGlzQXJnLCB2YWx1ZSwga2V5LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGVudHJpZXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fMTMoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICAgIHdoaWxlICh0cnVlKVxuICAgICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGgpID8gOCA6IC0yO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICAgIGtleSA9IHRoaXMuZW50cmllc19baV07XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmVudHJpZXNfW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpID8gNCA6IDY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2tleSwgdmFsdWVdO1xuICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgJGN0eC5tYXliZVRocm93KCk7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICRfXzEzLCB0aGlzKTtcbiAgICAgIH0pLFxuICAgICAga2V5czogJHRyYWNldXJSdW50aW1lLmluaXRHZW5lcmF0b3JGdW5jdGlvbihmdW5jdGlvbiAkX18xNCgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgcmV0dXJuICR0cmFjZXVyUnVudGltZS5jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZShmdW5jdGlvbigkY3R4KSB7XG4gICAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgICBzd2l0Y2ggKCRjdHguc3RhdGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKGkgPCB0aGlzLmVudHJpZXNfLmxlbmd0aCkgPyA4IDogLTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgICAga2V5ID0gdGhpcy5lbnRyaWVzX1tpXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuZW50cmllc19baSArIDFdO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSA5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChrZXkgPT09IGRlbGV0ZWRTZW50aW5lbCkgPyA0IDogNjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAyO1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkY3R4Lm1heWJlVGhyb3coKTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gNDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJGN0eC5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgJF9fMTQsIHRoaXMpO1xuICAgICAgfSksXG4gICAgICB2YWx1ZXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fMTUoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICAgIHdoaWxlICh0cnVlKVxuICAgICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGgpID8gOCA6IC0yO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICAgIGtleSA9IHRoaXMuZW50cmllc19baV07XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmVudHJpZXNfW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpID8gNCA6IDY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkY3R4Lm1heWJlVGhyb3coKTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gNDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJGN0eC5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgJF9fMTUsIHRoaXMpO1xuICAgICAgfSlcbiAgICB9LCB7fSk7XG4gIH0oKTtcbiAgZGVmaW5lUHJvcGVydHkoTWFwLnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBNYXAucHJvdG90eXBlLmVudHJpZXNcbiAgfSk7XG4gIGZ1bmN0aW9uIG5lZWRzUG9seWZpbGwoZ2xvYmFsKSB7XG4gICAgdmFyICRfXzEwID0gZ2xvYmFsLFxuICAgICAgICBNYXAgPSAkX18xMC5NYXAsXG4gICAgICAgIFN5bWJvbCA9ICRfXzEwLlN5bWJvbDtcbiAgICBpZiAoIU1hcCB8fCAhaGFzTmF0aXZlU3ltYm9sKCkgfHwgIU1hcC5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSB8fCAhTWFwLnByb3RvdHlwZS5lbnRyaWVzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBuZXcgTWFwKFtbXV0pLnNpemUgIT09IDE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbE1hcChnbG9iYWwpIHtcbiAgICBpZiAobmVlZHNQb2x5ZmlsbChnbG9iYWwpKSB7XG4gICAgICBnbG9iYWwuTWFwID0gTWFwO1xuICAgIH1cbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsTWFwKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgTWFwKCkge1xuICAgICAgcmV0dXJuIE1hcDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbE1hcCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbE1hcDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWFwLmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TZXQuanNcIjtcbiAgdmFyICRfXzE4ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCIpKSxcbiAgICAgIGlzT2JqZWN0ID0gJF9fMTguaXNPYmplY3QsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMTgucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyIE1hcCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL01hcC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TZXQuanNcIikpLk1hcDtcbiAgdmFyIGhhc05hdGl2ZVN5bWJvbCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9oYXMtbmF0aXZlLXN5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgU2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU2V0KCkge1xuICAgICAgdmFyIGl0ZXJhYmxlID0gYXJndW1lbnRzWzBdO1xuICAgICAgaWYgKCFpc09iamVjdCh0aGlzKSlcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2V0IGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgdHlwZScpO1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ21hcF8nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTZXQgY2FuIG5vdCBiZSByZWVudHJhbnRseSBpbml0aWFsaXNlZCcpO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXBfID0gbmV3IE1hcCgpO1xuICAgICAgaWYgKGl0ZXJhYmxlICE9PSBudWxsICYmIGl0ZXJhYmxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyICRfXzYgPSB0cnVlO1xuICAgICAgICB2YXIgJF9fNyA9IGZhbHNlO1xuICAgICAgICB2YXIgJF9fOCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmb3IgKHZhciAkX180ID0gdm9pZCAwLFxuICAgICAgICAgICAgICAkX18zID0gKGl0ZXJhYmxlKVtTeW1ib2wuaXRlcmF0b3JdKCk7ICEoJF9fNiA9ICgkX180ID0gJF9fMy5uZXh0KCkpLmRvbmUpOyAkX182ID0gdHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSAkX180LnZhbHVlO1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aGlzLmFkZChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKCRfXzkpIHtcbiAgICAgICAgICAkX183ID0gdHJ1ZTtcbiAgICAgICAgICAkX184ID0gJF9fOTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCEkX182ICYmICRfXzMucmV0dXJuICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgJF9fMy5yZXR1cm4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKCRfXzcpIHtcbiAgICAgICAgICAgICAgdGhyb3cgJF9fODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKFNldCwge1xuICAgICAgZ2V0IHNpemUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcF8uc2l6ZTtcbiAgICAgIH0sXG4gICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXBfLmhhcyhrZXkpO1xuICAgICAgfSxcbiAgICAgIGFkZDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHRoaXMubWFwXy5zZXQoa2V5LCBrZXkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBkZWxldGU6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXBfLmRlbGV0ZShrZXkpO1xuICAgICAgfSxcbiAgICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwXy5jbGVhcigpO1xuICAgICAgfSxcbiAgICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrRm4pIHtcbiAgICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIHZhciAkX18yID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwXy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICBjYWxsYmFja0ZuLmNhbGwodGhpc0FyZywga2V5LCBrZXksICRfXzIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB2YWx1ZXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fMTIoKSB7XG4gICAgICAgIHZhciAkX18xMyxcbiAgICAgICAgICAgICRfXzE0O1xuICAgICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgICB3aGlsZSAodHJ1ZSlcbiAgICAgICAgICAgIHN3aXRjaCAoJGN0eC5zdGF0ZSkge1xuICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgJF9fMTMgPSAkY3R4LndyYXBZaWVsZFN0YXIodGhpcy5tYXBfLmtleXMoKVtTeW1ib2wuaXRlcmF0b3JdKCkpO1xuICAgICAgICAgICAgICAgICRjdHguc2VudCA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAkY3R4LmFjdGlvbiA9ICduZXh0JztcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgJF9fMTQgPSAkX18xM1skY3R4LmFjdGlvbl0oJGN0eC5zZW50SWdub3JlVGhyb3cpO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSA5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9ICgkX18xNC5kb25lKSA/IDMgOiAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgJGN0eC5zZW50ID0gJF9fMTQudmFsdWU7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IC0yO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIHJldHVybiAkX18xNC52YWx1ZTtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJGN0eC5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgJF9fMTIsIHRoaXMpO1xuICAgICAgfSksXG4gICAgICBlbnRyaWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzE1KCkge1xuICAgICAgICB2YXIgJF9fMTYsXG4gICAgICAgICAgICAkX18xNztcbiAgICAgICAgcmV0dXJuICR0cmFjZXVyUnVudGltZS5jcmVhdGVHZW5lcmF0b3JJbnN0YW5jZShmdW5jdGlvbigkY3R4KSB7XG4gICAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgICBzd2l0Y2ggKCRjdHguc3RhdGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICRfXzE2ID0gJGN0eC53cmFwWWllbGRTdGFyKHRoaXMubWFwXy5lbnRyaWVzKClbU3ltYm9sLml0ZXJhdG9yXSgpKTtcbiAgICAgICAgICAgICAgICAkY3R4LnNlbnQgPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgJGN0eC5hY3Rpb24gPSAnbmV4dCc7XG4gICAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAgICRfXzE3ID0gJF9fMTZbJGN0eC5hY3Rpb25dKCRjdHguc2VudElnbm9yZVRocm93KTtcbiAgICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoJF9fMTcuZG9uZSkgPyAzIDogMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICRjdHguc2VudCA9ICRfXzE3LnZhbHVlO1xuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAtMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gJF9fMTcudmFsdWU7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICRfXzE1LCB0aGlzKTtcbiAgICAgIH0pXG4gICAgfSwge30pO1xuICB9KCk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTZXQucHJvdG90eXBlLCBTeW1ib2wuaXRlcmF0b3IsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgdmFsdWU6IFNldC5wcm90b3R5cGUudmFsdWVzXG4gIH0pO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2V0LnByb3RvdHlwZSwgJ2tleXMnLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBTZXQucHJvdG90eXBlLnZhbHVlc1xuICB9KTtcbiAgZnVuY3Rpb24gbmVlZHNQb2x5ZmlsbChnbG9iYWwpIHtcbiAgICB2YXIgJF9fMTEgPSBnbG9iYWwsXG4gICAgICAgIFNldCA9ICRfXzExLlNldCxcbiAgICAgICAgU3ltYm9sID0gJF9fMTEuU3ltYm9sO1xuICAgIGlmICghU2V0IHx8ICFoYXNOYXRpdmVTeW1ib2woKSB8fCAhU2V0LnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdIHx8ICFTZXQucHJvdG90eXBlLnZhbHVlcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IFNldChbMV0pLnNpemUgIT09IDE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFNldChnbG9iYWwpIHtcbiAgICBpZiAobmVlZHNQb2x5ZmlsbChnbG9iYWwpKSB7XG4gICAgICBnbG9iYWwuU2V0ID0gU2V0O1xuICAgIH1cbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsU2V0KTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgU2V0KCkge1xuICAgICAgcmV0dXJuIFNldDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFNldCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbFNldDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU2V0LmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9ub2RlX21vZHVsZXMvcnN2cC9saWIvcnN2cC9hc2FwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL25vZGVfbW9kdWxlcy9yc3ZwL2xpYi9yc3ZwL2FzYXAuanNcIjtcbiAgdmFyIGxlbiA9IDA7XG4gIHZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuICB2YXIgdmVydHhOZXh0O1xuICBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgICBxdWV1ZVtsZW5dID0gY2FsbGJhY2s7XG4gICAgcXVldWVbbGVuICsgMV0gPSBhcmc7XG4gICAgbGVuICs9IDI7XG4gICAgaWYgKGxlbiA9PT0gMikge1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH1cbiAgfVxuICB2YXIgYnJvd3NlcldpbmRvdyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG4gIHZhciBicm93c2VyR2xvYmFsID0gYnJvd3NlcldpbmRvdyB8fCB7fTtcbiAgdmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgdmFyIGlzTm9kZSA9IHR5cGVvZiBzZWxmID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuICB2YXIgaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnO1xuICBmdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgICB2YXIgbmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgIHZhciB2ZXJzaW9uID0gcHJvY2Vzcy52ZXJzaW9ucy5ub2RlLm1hdGNoKC9eKD86KFxcZCspXFwuKT8oPzooXFxkKylcXC4pPyhcXCp8XFxkKykkLyk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmVyc2lvbikgJiYgdmVyc2lvblsxXSA9PT0gJzAnICYmIHZlcnNpb25bMl0gPT09ICcxMCcpIHtcbiAgICAgIG5leHRUaWNrID0gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBuZXh0VGljayhmbHVzaCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB1c2VWZXJ0eFRpbWVyKCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZlcnR4TmV4dChmbHVzaCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICAgIH07XG4gIH1cbiAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBxdWV1ZVtpXTtcbiAgICAgIHZhciBhcmcgPSBxdWV1ZVtpICsgMV07XG4gICAgICBjYWxsYmFjayhhcmcpO1xuICAgICAgcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICBxdWV1ZVtpICsgMV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxlbiA9IDA7XG4gIH1cbiAgZnVuY3Rpb24gYXR0ZW1wdFZlcnRleCgpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHIgPSByZXF1aXJlO1xuICAgICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICAgIHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgICByZXR1cm4gdXNlVmVydHhUaW1lcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB1c2VTZXRUaW1lb3V0KCk7XG4gICAgfVxuICB9XG4gIHZhciBzY2hlZHVsZUZsdXNoO1xuICBpZiAoaXNOb2RlKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG4gIH0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICB9IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gIH0gZWxzZSBpZiAoYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IGF0dGVtcHRWZXJ0ZXgoKTtcbiAgfSBlbHNlIHtcbiAgICBzY2hlZHVsZUZsdXNoID0gdXNlU2V0VGltZW91dCgpO1xuICB9XG4gIHJldHVybiB7Z2V0IGRlZmF1bHQoKSB7XG4gICAgICByZXR1cm4gYXNhcDtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIjtcbiAgdmFyIGFzeW5jID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9yc3ZwL2xpYi9yc3ZwL2FzYXAuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvUHJvbWlzZS5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyICRfXzkgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9Qcm9taXNlLmpzXCIpKSxcbiAgICAgIGlzT2JqZWN0ID0gJF9fOS5pc09iamVjdCxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX185LnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciAkX18xMCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9wcml2YXRlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIikpLFxuICAgICAgY3JlYXRlUHJpdmF0ZVN5bWJvbCA9ICRfXzEwLmNyZWF0ZVByaXZhdGVTeW1ib2wsXG4gICAgICBnZXRQcml2YXRlID0gJF9fMTAuZ2V0UHJpdmF0ZSxcbiAgICAgIHNldFByaXZhdGUgPSAkX18xMC5zZXRQcml2YXRlO1xuICB2YXIgcHJvbWlzZVJhdyA9IHt9O1xuICBmdW5jdGlvbiBpc1Byb21pc2UoeCkge1xuICAgIHJldHVybiB4ICYmIHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4LnN0YXR1c18gIT09IHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiBpZFJlc29sdmVIYW5kbGVyKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfVxuICBmdW5jdGlvbiBpZFJlamVjdEhhbmRsZXIoeCkge1xuICAgIHRocm93IHg7XG4gIH1cbiAgZnVuY3Rpb24gY2hhaW4ocHJvbWlzZSkge1xuICAgIHZhciBvblJlc29sdmUgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDogaWRSZXNvbHZlSGFuZGxlcjtcbiAgICB2YXIgb25SZWplY3QgPSBhcmd1bWVudHNbMl0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzJdIDogaWRSZWplY3RIYW5kbGVyO1xuICAgIHZhciBkZWZlcnJlZCA9IGdldERlZmVycmVkKHByb21pc2UuY29uc3RydWN0b3IpO1xuICAgIHN3aXRjaCAocHJvbWlzZS5zdGF0dXNfKSB7XG4gICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yO1xuICAgICAgY2FzZSAwOlxuICAgICAgICBwcm9taXNlLm9uUmVzb2x2ZV8ucHVzaChvblJlc29sdmUsIGRlZmVycmVkKTtcbiAgICAgICAgcHJvbWlzZS5vblJlamVjdF8ucHVzaChvblJlamVjdCwgZGVmZXJyZWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgKzE6XG4gICAgICAgIHByb21pc2VFbnF1ZXVlKHByb21pc2UudmFsdWVfLCBbb25SZXNvbHZlLCBkZWZlcnJlZF0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgLTE6XG4gICAgICAgIHByb21pc2VFbnF1ZXVlKHByb21pc2UudmFsdWVfLCBbb25SZWplY3QsIGRlZmVycmVkXSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfVxuICBmdW5jdGlvbiBnZXREZWZlcnJlZChDKSB7XG4gICAgaWYgKHRoaXMgPT09ICRQcm9taXNlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHByb21pc2VJbml0KG5ldyAkUHJvbWlzZShwcm9taXNlUmF3KSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBwcm9taXNlLFxuICAgICAgICByZXNvbHZlOiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcHJvbWlzZVJlc29sdmUocHJvbWlzZSwgeCk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlamVjdDogZnVuY3Rpb24ocikge1xuICAgICAgICAgIHByb21pc2VSZWplY3QocHJvbWlzZSwgcik7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5wcm9taXNlID0gbmV3IEMoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJlc3VsdC5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgcmVzdWx0LnJlamVjdCA9IHJlamVjdDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcHJvbWlzZVNldChwcm9taXNlLCBzdGF0dXMsIHZhbHVlLCBvblJlc29sdmUsIG9uUmVqZWN0KSB7XG4gICAgcHJvbWlzZS5zdGF0dXNfID0gc3RhdHVzO1xuICAgIHByb21pc2UudmFsdWVfID0gdmFsdWU7XG4gICAgcHJvbWlzZS5vblJlc29sdmVfID0gb25SZXNvbHZlO1xuICAgIHByb21pc2Uub25SZWplY3RfID0gb25SZWplY3Q7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgZnVuY3Rpb24gcHJvbWlzZUluaXQocHJvbWlzZSkge1xuICAgIHJldHVybiBwcm9taXNlU2V0KHByb21pc2UsIDAsIHVuZGVmaW5lZCwgW10sIFtdKTtcbiAgfVxuICB2YXIgUHJvbWlzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIGlmIChyZXNvbHZlciA9PT0gcHJvbWlzZVJhdylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZUluaXQodGhpcyk7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcHJvbWlzZVJlc29sdmUocHJvbWlzZSwgeCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICBwcm9taXNlUmVqZWN0KHByb21pc2UsIHIpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcHJvbWlzZVJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKFByb21pc2UsIHtcbiAgICAgIGNhdGNoOiBmdW5jdGlvbihvblJlamVjdCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKHVuZGVmaW5lZCwgb25SZWplY3QpO1xuICAgICAgfSxcbiAgICAgIHRoZW46IGZ1bmN0aW9uKG9uUmVzb2x2ZSwgb25SZWplY3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvblJlc29sdmUgIT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25SZXNvbHZlID0gaWRSZXNvbHZlSGFuZGxlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBvblJlamVjdCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBvblJlamVjdCA9IGlkUmVqZWN0SGFuZGxlcjtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgY29uc3RydWN0b3IgPSB0aGlzLmNvbnN0cnVjdG9yO1xuICAgICAgICByZXR1cm4gY2hhaW4odGhpcywgZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHggPSBwcm9taXNlQ29lcmNlKGNvbnN0cnVjdG9yLCB4KTtcbiAgICAgICAgICByZXR1cm4geCA9PT0gdGhhdCA/IG9uUmVqZWN0KG5ldyBUeXBlRXJyb3IpIDogaXNQcm9taXNlKHgpID8geC50aGVuKG9uUmVzb2x2ZSwgb25SZWplY3QpIDogb25SZXNvbHZlKHgpO1xuICAgICAgICB9LCBvblJlamVjdCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAgcmVzb2x2ZTogZnVuY3Rpb24oeCkge1xuICAgICAgICBpZiAodGhpcyA9PT0gJFByb21pc2UpIHtcbiAgICAgICAgICBpZiAoaXNQcm9taXNlKHgpKSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHByb21pc2VTZXQobmV3ICRQcm9taXNlKHByb21pc2VSYXcpLCArMSwgeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyB0aGlzKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh4KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlamVjdDogZnVuY3Rpb24ocikge1xuICAgICAgICBpZiAodGhpcyA9PT0gJFByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gcHJvbWlzZVNldChuZXcgJFByb21pc2UocHJvbWlzZVJhdyksIC0xLCByKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IHRoaXMoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICByZWplY3Qocik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhbGw6IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBnZXREZWZlcnJlZCh0aGlzKTtcbiAgICAgICAgdmFyIHJlc29sdXRpb25zID0gW107XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFyIG1ha2VDb3VudGRvd25GdW5jdGlvbiA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICAgIHJlc29sdXRpb25zW2ldID0geDtcbiAgICAgICAgICAgICAgaWYgKC0tY291bnQgPT09IDApXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNvbHV0aW9ucyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH07XG4gICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgdmFyICRfXzQgPSB0cnVlO1xuICAgICAgICAgIHZhciAkX181ID0gZmFsc2U7XG4gICAgICAgICAgdmFyICRfXzYgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAodmFyICRfXzIgPSB2b2lkIDAsXG4gICAgICAgICAgICAgICAgJF9fMSA9ICh2YWx1ZXMpW1N5bWJvbC5pdGVyYXRvcl0oKTsgISgkX180ID0gKCRfXzIgPSAkX18xLm5leHQoKSkuZG9uZSk7ICRfXzQgPSB0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRfXzIudmFsdWU7XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgY291bnRkb3duRnVuY3Rpb24gPSBtYWtlQ291bnRkb3duRnVuY3Rpb24oaSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlKHZhbHVlKS50aGVuKGNvdW50ZG93bkZ1bmN0aW9uLCBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3Qocik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoICgkX183KSB7XG4gICAgICAgICAgICAkX181ID0gdHJ1ZTtcbiAgICAgICAgICAgICRfXzYgPSAkX183O1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAoISRfXzQgJiYgJF9fMS5yZXR1cm4gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICRfXzEucmV0dXJuKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgIGlmICgkX181KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJF9fNjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzb2x1dGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgICByYWNlOiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZ2V0RGVmZXJyZWQodGhpcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZXNbaV0pLnRoZW4oZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHgpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3Qocik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH0oKTtcbiAgdmFyICRQcm9taXNlID0gUHJvbWlzZTtcbiAgdmFyICRQcm9taXNlUmVqZWN0ID0gJFByb21pc2UucmVqZWN0O1xuICBmdW5jdGlvbiBwcm9taXNlUmVzb2x2ZShwcm9taXNlLCB4KSB7XG4gICAgcHJvbWlzZURvbmUocHJvbWlzZSwgKzEsIHgsIHByb21pc2Uub25SZXNvbHZlXyk7XG4gIH1cbiAgZnVuY3Rpb24gcHJvbWlzZVJlamVjdChwcm9taXNlLCByKSB7XG4gICAgcHJvbWlzZURvbmUocHJvbWlzZSwgLTEsIHIsIHByb21pc2Uub25SZWplY3RfKTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlRG9uZShwcm9taXNlLCBzdGF0dXMsIHZhbHVlLCByZWFjdGlvbnMpIHtcbiAgICBpZiAocHJvbWlzZS5zdGF0dXNfICE9PSAwKVxuICAgICAgcmV0dXJuO1xuICAgIHByb21pc2VFbnF1ZXVlKHZhbHVlLCByZWFjdGlvbnMpO1xuICAgIHByb21pc2VTZXQocHJvbWlzZSwgc3RhdHVzLCB2YWx1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gcHJvbWlzZUVucXVldWUodmFsdWUsIHRhc2tzKSB7XG4gICAgYXN5bmMoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHByb21pc2VIYW5kbGUodmFsdWUsIHRhc2tzW2ldLCB0YXNrc1tpICsgMV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VIYW5kbGUodmFsdWUsIGhhbmRsZXIsIGRlZmVycmVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXN1bHQgPSBoYW5kbGVyKHZhbHVlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IGRlZmVycmVkLnByb21pc2UpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICBlbHNlIGlmIChpc1Byb21pc2UocmVzdWx0KSlcbiAgICAgICAgY2hhaW4ocmVzdWx0LCBkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgZWxzZVxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gIH1cbiAgdmFyIHRoZW5hYmxlU3ltYm9sID0gY3JlYXRlUHJpdmF0ZVN5bWJvbCgpO1xuICBmdW5jdGlvbiBwcm9taXNlQ29lcmNlKGNvbnN0cnVjdG9yLCB4KSB7XG4gICAgaWYgKCFpc1Byb21pc2UoeCkgJiYgaXNPYmplY3QoeCkpIHtcbiAgICAgIHZhciB0aGVuO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhlbiA9IHgudGhlbjtcbiAgICAgIH0gY2F0Y2ggKHIpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSAkUHJvbWlzZVJlamVjdC5jYWxsKGNvbnN0cnVjdG9yLCByKTtcbiAgICAgICAgc2V0UHJpdmF0ZSh4LCB0aGVuYWJsZVN5bWJvbCwgcHJvbWlzZSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBwID0gZ2V0UHJpdmF0ZSh4LCB0aGVuYWJsZVN5bWJvbCk7XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGRlZmVycmVkID0gZ2V0RGVmZXJyZWQoY29uc3RydWN0b3IpO1xuICAgICAgICAgIHNldFByaXZhdGUoeCwgdGhlbmFibGVTeW1ib2wsIGRlZmVycmVkLnByb21pc2UpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGVuLmNhbGwoeCwgZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICB9IGNhdGNoIChyKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3Qocik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB4O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsUHJvbWlzZShnbG9iYWwpIHtcbiAgICBpZiAoIWdsb2JhbC5Qcm9taXNlKVxuICAgICAgZ2xvYmFsLlByb21pc2UgPSBQcm9taXNlO1xuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxQcm9taXNlKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgUHJvbWlzZSgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlO1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsUHJvbWlzZSgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbFByb21pc2U7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmdJdGVyYXRvci5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nSXRlcmF0b3IuanNcIjtcbiAgdmFyICRfXzMgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmdJdGVyYXRvci5qc1wiKSksXG4gICAgICBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCA9ICRfXzMuY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QsXG4gICAgICBpc09iamVjdCA9ICRfXzMuaXNPYmplY3Q7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciBpdGVyYXRlZFN0cmluZyA9IFN5bWJvbCgnaXRlcmF0ZWRTdHJpbmcnKTtcbiAgdmFyIHN0cmluZ0l0ZXJhdG9yTmV4dEluZGV4ID0gU3ltYm9sKCdzdHJpbmdJdGVyYXRvck5leHRJbmRleCcpO1xuICB2YXIgU3RyaW5nSXRlcmF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJF9fMTtcbiAgICBmdW5jdGlvbiBTdHJpbmdJdGVyYXRvcigpIHt9XG4gICAgcmV0dXJuICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKFN0cmluZ0l0ZXJhdG9yLCAoJF9fMSA9IHt9LCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMSwgXCJuZXh0XCIsIHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzO1xuICAgICAgICBpZiAoIWlzT2JqZWN0KG8pIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIGl0ZXJhdGVkU3RyaW5nKSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3RoaXMgbXVzdCBiZSBhIFN0cmluZ0l0ZXJhdG9yIG9iamVjdCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzID0gb1tpdGVyYXRlZFN0cmluZ107XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcG9zaXRpb24gPSBvW3N0cmluZ0l0ZXJhdG9yTmV4dEluZGV4XTtcbiAgICAgICAgdmFyIGxlbiA9IHMubGVuZ3RoO1xuICAgICAgICBpZiAocG9zaXRpb24gPj0gbGVuKSB7XG4gICAgICAgICAgb1tpdGVyYXRlZFN0cmluZ10gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZpcnN0ID0gcy5jaGFyQ29kZUF0KHBvc2l0aW9uKTtcbiAgICAgICAgdmFyIHJlc3VsdFN0cmluZztcbiAgICAgICAgaWYgKGZpcnN0IDwgMHhEODAwIHx8IGZpcnN0ID4gMHhEQkZGIHx8IHBvc2l0aW9uICsgMSA9PT0gbGVuKSB7XG4gICAgICAgICAgcmVzdWx0U3RyaW5nID0gU3RyaW5nLmZyb21DaGFyQ29kZShmaXJzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHNlY29uZCA9IHMuY2hhckNvZGVBdChwb3NpdGlvbiArIDEpO1xuICAgICAgICAgIGlmIChzZWNvbmQgPCAweERDMDAgfHwgc2Vjb25kID4gMHhERkZGKSB7XG4gICAgICAgICAgICByZXN1bHRTdHJpbmcgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGZpcnN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0U3RyaW5nID0gU3RyaW5nLmZyb21DaGFyQ29kZShmaXJzdCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKHNlY29uZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9bc3RyaW5nSXRlcmF0b3JOZXh0SW5kZXhdID0gcG9zaXRpb24gKyByZXN1bHRTdHJpbmcubGVuZ3RoO1xuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QocmVzdWx0U3RyaW5nLCBmYWxzZSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSksIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgkX18xLCBTeW1ib2wuaXRlcmF0b3IsIHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSksICRfXzEpLCB7fSk7XG4gIH0oKTtcbiAgZnVuY3Rpb24gY3JlYXRlU3RyaW5nSXRlcmF0b3Ioc3RyaW5nKSB7XG4gICAgdmFyIHMgPSBTdHJpbmcoc3RyaW5nKTtcbiAgICB2YXIgaXRlcmF0b3IgPSBPYmplY3QuY3JlYXRlKFN0cmluZ0l0ZXJhdG9yLnByb3RvdHlwZSk7XG4gICAgaXRlcmF0b3JbaXRlcmF0ZWRTdHJpbmddID0gcztcbiAgICBpdGVyYXRvcltzdHJpbmdJdGVyYXRvck5leHRJbmRleF0gPSAwO1xuICAgIHJldHVybiBpdGVyYXRvcjtcbiAgfVxuICByZXR1cm4ge2dldCBjcmVhdGVTdHJpbmdJdGVyYXRvcigpIHtcbiAgICAgIHJldHVybiBjcmVhdGVTdHJpbmdJdGVyYXRvcjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nLmpzXCI7XG4gIHZhciBjaGVja09iamVjdENvZXJjaWJsZSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9jaGVja09iamVjdENvZXJjaWJsZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmcuanNcIikpLmRlZmF1bHQ7XG4gIHZhciBjcmVhdGVTdHJpbmdJdGVyYXRvciA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL1N0cmluZ0l0ZXJhdG9yLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiKSkuY3JlYXRlU3RyaW5nSXRlcmF0b3I7XG4gIHZhciAkX18zID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nLmpzXCIpKSxcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMy5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIG1heWJlQWRkSXRlcmF0b3IgPSAkX18zLm1heWJlQWRkSXRlcmF0b3IsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMy5yZWdpc3RlclBvbHlmaWxsO1xuICB2YXIgJHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgdmFyICRpbmRleE9mID0gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mO1xuICB2YXIgJGxhc3RJbmRleE9mID0gU3RyaW5nLnByb3RvdHlwZS5sYXN0SW5kZXhPZjtcbiAgZnVuY3Rpb24gc3RhcnRzV2l0aChzZWFyY2gpIHtcbiAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgIGlmICh0aGlzID09IG51bGwgfHwgJHRvU3RyaW5nLmNhbGwoc2VhcmNoKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICAgIHZhciBzZWFyY2hTdHJpbmcgPSBTdHJpbmcoc2VhcmNoKTtcbiAgICB2YXIgc2VhcmNoTGVuZ3RoID0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgcG9zaXRpb24gPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICBpZiAoaXNOYU4ocG9zKSkge1xuICAgICAgcG9zID0gMDtcbiAgICB9XG4gICAgdmFyIHN0YXJ0ID0gTWF0aC5taW4oTWF0aC5tYXgocG9zLCAwKSwgc3RyaW5nTGVuZ3RoKTtcbiAgICByZXR1cm4gJGluZGV4T2YuY2FsbChzdHJpbmcsIHNlYXJjaFN0cmluZywgcG9zKSA9PSBzdGFydDtcbiAgfVxuICBmdW5jdGlvbiBlbmRzV2l0aChzZWFyY2gpIHtcbiAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgIGlmICh0aGlzID09IG51bGwgfHwgJHRvU3RyaW5nLmNhbGwoc2VhcmNoKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICAgIHZhciBzZWFyY2hTdHJpbmcgPSBTdHJpbmcoc2VhcmNoKTtcbiAgICB2YXIgc2VhcmNoTGVuZ3RoID0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgcG9zID0gc3RyaW5nTGVuZ3RoO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKHBvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcG9zID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICAgICAgaWYgKGlzTmFOKHBvcykpIHtcbiAgICAgICAgICBwb3MgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBlbmQgPSBNYXRoLm1pbihNYXRoLm1heChwb3MsIDApLCBzdHJpbmdMZW5ndGgpO1xuICAgIHZhciBzdGFydCA9IGVuZCAtIHNlYXJjaExlbmd0aDtcbiAgICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAkbGFzdEluZGV4T2YuY2FsbChzdHJpbmcsIHNlYXJjaFN0cmluZywgc3RhcnQpID09IHN0YXJ0O1xuICB9XG4gIGZ1bmN0aW9uIGluY2x1ZGVzKHNlYXJjaCkge1xuICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgIGlmIChzZWFyY2ggJiYgJHRvU3RyaW5nLmNhbGwoc2VhcmNoKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICAgIHZhciBzZWFyY2hTdHJpbmcgPSBTdHJpbmcoc2VhcmNoKTtcbiAgICB2YXIgc2VhcmNoTGVuZ3RoID0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgcG9zaXRpb24gPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICBpZiAocG9zICE9IHBvcykge1xuICAgICAgcG9zID0gMDtcbiAgICB9XG4gICAgdmFyIHN0YXJ0ID0gTWF0aC5taW4oTWF0aC5tYXgocG9zLCAwKSwgc3RyaW5nTGVuZ3RoKTtcbiAgICBpZiAoc2VhcmNoTGVuZ3RoICsgc3RhcnQgPiBzdHJpbmdMZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuICRpbmRleE9mLmNhbGwoc3RyaW5nLCBzZWFyY2hTdHJpbmcsIHBvcykgIT0gLTE7XG4gIH1cbiAgZnVuY3Rpb24gcmVwZWF0KGNvdW50KSB7XG4gICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgdmFyIG4gPSBjb3VudCA/IE51bWJlcihjb3VudCkgOiAwO1xuICAgIGlmIChpc05hTihuKSkge1xuICAgICAgbiA9IDA7XG4gICAgfVxuICAgIGlmIChuIDwgMCB8fCBuID09IEluZmluaXR5KSB7XG4gICAgICB0aHJvdyBSYW5nZUVycm9yKCk7XG4gICAgfVxuICAgIGlmIChuID09IDApIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHdoaWxlIChuLS0pIHtcbiAgICAgIHJlc3VsdCArPSBzdHJpbmc7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gY29kZVBvaW50QXQocG9zaXRpb24pIHtcbiAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZyA9IFN0cmluZyh0aGlzKTtcbiAgICB2YXIgc2l6ZSA9IHN0cmluZy5sZW5ndGg7XG4gICAgdmFyIGluZGV4ID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICBpZiAoaXNOYU4oaW5kZXgpKSB7XG4gICAgICBpbmRleCA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gc2l6ZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIGZpcnN0ID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgIHZhciBzZWNvbmQ7XG4gICAgaWYgKGZpcnN0ID49IDB4RDgwMCAmJiBmaXJzdCA8PSAweERCRkYgJiYgc2l6ZSA+IGluZGV4ICsgMSkge1xuICAgICAgc2Vjb25kID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcbiAgICAgIGlmIChzZWNvbmQgPj0gMHhEQzAwICYmIHNlY29uZCA8PSAweERGRkYpIHtcbiAgICAgICAgcmV0dXJuIChmaXJzdCAtIDB4RDgwMCkgKiAweDQwMCArIHNlY29uZCAtIDB4REMwMCArIDB4MTAwMDA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaXJzdDtcbiAgfVxuICBmdW5jdGlvbiByYXcoY2FsbHNpdGUpIHtcbiAgICB2YXIgcmF3ID0gY2FsbHNpdGUucmF3O1xuICAgIHZhciBsZW4gPSByYXcubGVuZ3RoID4+PiAwO1xuICAgIGlmIChsZW4gPT09IDApXG4gICAgICByZXR1cm4gJyc7XG4gICAgdmFyIHMgPSAnJztcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHMgKz0gcmF3W2ldO1xuICAgICAgaWYgKGkgKyAxID09PSBsZW4pXG4gICAgICAgIHJldHVybiBzO1xuICAgICAgcyArPSBhcmd1bWVudHNbKytpXTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZnJvbUNvZGVQb2ludChfKSB7XG4gICAgdmFyIGNvZGVVbml0cyA9IFtdO1xuICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgdmFyIGhpZ2hTdXJyb2dhdGU7XG4gICAgdmFyIGxvd1N1cnJvZ2F0ZTtcbiAgICB2YXIgaW5kZXggPSAtMTtcbiAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgdmFyIGNvZGVQb2ludCA9IE51bWJlcihhcmd1bWVudHNbaW5kZXhdKTtcbiAgICAgIGlmICghaXNGaW5pdGUoY29kZVBvaW50KSB8fCBjb2RlUG9pbnQgPCAwIHx8IGNvZGVQb2ludCA+IDB4MTBGRkZGIHx8IGZsb29yKGNvZGVQb2ludCkgIT0gY29kZVBvaW50KSB7XG4gICAgICAgIHRocm93IFJhbmdlRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludDogJyArIGNvZGVQb2ludCk7XG4gICAgICB9XG4gICAgICBpZiAoY29kZVBvaW50IDw9IDB4RkZGRikge1xuICAgICAgICBjb2RlVW5pdHMucHVzaChjb2RlUG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29kZVBvaW50IC09IDB4MTAwMDA7XG4gICAgICAgIGhpZ2hTdXJyb2dhdGUgPSAoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMDtcbiAgICAgICAgbG93U3Vycm9nYXRlID0gKGNvZGVQb2ludCAlIDB4NDAwKSArIDB4REMwMDtcbiAgICAgICAgY29kZVVuaXRzLnB1c2goaGlnaFN1cnJvZ2F0ZSwgbG93U3Vycm9nYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgY29kZVVuaXRzKTtcbiAgfVxuICBmdW5jdGlvbiBzdHJpbmdQcm90b3R5cGVJdGVyYXRvcigpIHtcbiAgICB2YXIgbyA9IGNoZWNrT2JqZWN0Q29lcmNpYmxlKHRoaXMpO1xuICAgIHZhciBzID0gU3RyaW5nKG8pO1xuICAgIHJldHVybiBjcmVhdGVTdHJpbmdJdGVyYXRvcihzKTtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFN0cmluZyhnbG9iYWwpIHtcbiAgICB2YXIgU3RyaW5nID0gZ2xvYmFsLlN0cmluZztcbiAgICBtYXliZUFkZEZ1bmN0aW9ucyhTdHJpbmcucHJvdG90eXBlLCBbJ2NvZGVQb2ludEF0JywgY29kZVBvaW50QXQsICdlbmRzV2l0aCcsIGVuZHNXaXRoLCAnaW5jbHVkZXMnLCBpbmNsdWRlcywgJ3JlcGVhdCcsIHJlcGVhdCwgJ3N0YXJ0c1dpdGgnLCBzdGFydHNXaXRoXSk7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoU3RyaW5nLCBbJ2Zyb21Db2RlUG9pbnQnLCBmcm9tQ29kZVBvaW50LCAncmF3JywgcmF3XSk7XG4gICAgbWF5YmVBZGRJdGVyYXRvcihTdHJpbmcucHJvdG90eXBlLCBzdHJpbmdQcm90b3R5cGVJdGVyYXRvciwgU3ltYm9sKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsU3RyaW5nKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgc3RhcnRzV2l0aCgpIHtcbiAgICAgIHJldHVybiBzdGFydHNXaXRoO1xuICAgIH0sXG4gICAgZ2V0IGVuZHNXaXRoKCkge1xuICAgICAgcmV0dXJuIGVuZHNXaXRoO1xuICAgIH0sXG4gICAgZ2V0IGluY2x1ZGVzKCkge1xuICAgICAgcmV0dXJuIGluY2x1ZGVzO1xuICAgIH0sXG4gICAgZ2V0IHJlcGVhdCgpIHtcbiAgICAgIHJldHVybiByZXBlYXQ7XG4gICAgfSxcbiAgICBnZXQgY29kZVBvaW50QXQoKSB7XG4gICAgICByZXR1cm4gY29kZVBvaW50QXQ7XG4gICAgfSxcbiAgICBnZXQgcmF3KCkge1xuICAgICAgcmV0dXJuIHJhdztcbiAgICB9LFxuICAgIGdldCBmcm9tQ29kZVBvaW50KCkge1xuICAgICAgcmV0dXJuIGZyb21Db2RlUG9pbnQ7XG4gICAgfSxcbiAgICBnZXQgc3RyaW5nUHJvdG90eXBlSXRlcmF0b3IoKSB7XG4gICAgICByZXR1cm4gc3RyaW5nUHJvdG90eXBlSXRlcmF0b3I7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxTdHJpbmcoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxTdHJpbmc7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5SXRlcmF0b3IuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5SXRlcmF0b3IuanNcIjtcbiAgdmFyICRfXzIgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheUl0ZXJhdG9yLmpzXCIpKSxcbiAgICAgIHRvT2JqZWN0ID0gJF9fMi50b09iamVjdCxcbiAgICAgIHRvVWludDMyID0gJF9fMi50b1VpbnQzMixcbiAgICAgIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0ID0gJF9fMi5jcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdDtcbiAgdmFyIEFSUkFZX0lURVJBVE9SX0tJTkRfS0VZUyA9IDE7XG4gIHZhciBBUlJBWV9JVEVSQVRPUl9LSU5EX1ZBTFVFUyA9IDI7XG4gIHZhciBBUlJBWV9JVEVSQVRPUl9LSU5EX0VOVFJJRVMgPSAzO1xuICB2YXIgQXJyYXlJdGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciAkX18xO1xuICAgIGZ1bmN0aW9uIEFycmF5SXRlcmF0b3IoKSB7fVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShBcnJheUl0ZXJhdG9yLCAoJF9fMSA9IHt9LCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMSwgXCJuZXh0XCIsIHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0gdG9PYmplY3QodGhpcyk7XG4gICAgICAgIHZhciBhcnJheSA9IGl0ZXJhdG9yLml0ZXJhdG9yT2JqZWN0XztcbiAgICAgICAgaWYgKCFhcnJheSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdCBpcyBub3QgYW4gQXJyYXlJdGVyYXRvcicpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleCA9IGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfO1xuICAgICAgICB2YXIgaXRlbUtpbmQgPSBpdGVyYXRvci5hcnJheUl0ZXJhdGlvbktpbmRfO1xuICAgICAgICB2YXIgbGVuZ3RoID0gdG9VaW50MzIoYXJyYXkubGVuZ3RoKTtcbiAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfID0gSW5maW5pdHk7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmF0b3IuYXJyYXlJdGVyYXRvck5leHRJbmRleF8gPSBpbmRleCArIDE7XG4gICAgICAgIGlmIChpdGVtS2luZCA9PSBBUlJBWV9JVEVSQVRPUl9LSU5EX1ZBTFVFUylcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoYXJyYXlbaW5kZXhdLCBmYWxzZSk7XG4gICAgICAgIGlmIChpdGVtS2luZCA9PSBBUlJBWV9JVEVSQVRPUl9LSU5EX0VOVFJJRVMpXG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0KFtpbmRleCwgYXJyYXlbaW5kZXhdXSwgZmFsc2UpO1xuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoaW5kZXgsIGZhbHNlKTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KCRfXzEsIFN5bWJvbC5pdGVyYXRvciwge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KSwgJF9fMSksIHt9KTtcbiAgfSgpO1xuICBmdW5jdGlvbiBjcmVhdGVBcnJheUl0ZXJhdG9yKGFycmF5LCBraW5kKSB7XG4gICAgdmFyIG9iamVjdCA9IHRvT2JqZWN0KGFycmF5KTtcbiAgICB2YXIgaXRlcmF0b3IgPSBuZXcgQXJyYXlJdGVyYXRvcjtcbiAgICBpdGVyYXRvci5pdGVyYXRvck9iamVjdF8gPSBvYmplY3Q7XG4gICAgaXRlcmF0b3IuYXJyYXlJdGVyYXRvck5leHRJbmRleF8gPSAwO1xuICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0aW9uS2luZF8gPSBraW5kO1xuICAgIHJldHVybiBpdGVyYXRvcjtcbiAgfVxuICBmdW5jdGlvbiBlbnRyaWVzKCkge1xuICAgIHJldHVybiBjcmVhdGVBcnJheUl0ZXJhdG9yKHRoaXMsIEFSUkFZX0lURVJBVE9SX0tJTkRfRU5UUklFUyk7XG4gIH1cbiAgZnVuY3Rpb24ga2V5cygpIHtcbiAgICByZXR1cm4gY3JlYXRlQXJyYXlJdGVyYXRvcih0aGlzLCBBUlJBWV9JVEVSQVRPUl9LSU5EX0tFWVMpO1xuICB9XG4gIGZ1bmN0aW9uIHZhbHVlcygpIHtcbiAgICByZXR1cm4gY3JlYXRlQXJyYXlJdGVyYXRvcih0aGlzLCBBUlJBWV9JVEVSQVRPUl9LSU5EX1ZBTFVFUyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBnZXQgZW50cmllcygpIHtcbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0sXG4gICAgZ2V0IGtleXMoKSB7XG4gICAgICByZXR1cm4ga2V5cztcbiAgICB9LFxuICAgIGdldCB2YWx1ZXMoKSB7XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheS5qc1wiO1xuICB2YXIgJF9fOSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL0FycmF5SXRlcmF0b3IuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvQXJyYXkuanNcIikpLFxuICAgICAgZW50cmllcyA9ICRfXzkuZW50cmllcyxcbiAgICAgIGtleXMgPSAkX185LmtleXMsXG4gICAgICBqc1ZhbHVlcyA9ICRfXzkudmFsdWVzO1xuICB2YXIgJF9fMTAgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheS5qc1wiKSksXG4gICAgICBjaGVja0l0ZXJhYmxlID0gJF9fMTAuY2hlY2tJdGVyYWJsZSxcbiAgICAgIGlzQ2FsbGFibGUgPSAkX18xMC5pc0NhbGxhYmxlLFxuICAgICAgaXNDb25zdHJ1Y3RvciA9ICRfXzEwLmlzQ29uc3RydWN0b3IsXG4gICAgICBtYXliZUFkZEZ1bmN0aW9ucyA9ICRfXzEwLm1heWJlQWRkRnVuY3Rpb25zLFxuICAgICAgbWF5YmVBZGRJdGVyYXRvciA9ICRfXzEwLm1heWJlQWRkSXRlcmF0b3IsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMTAucmVnaXN0ZXJQb2x5ZmlsbCxcbiAgICAgIHRvSW50ZWdlciA9ICRfXzEwLnRvSW50ZWdlcixcbiAgICAgIHRvTGVuZ3RoID0gJF9fMTAudG9MZW5ndGgsXG4gICAgICB0b09iamVjdCA9ICRfXzEwLnRvT2JqZWN0O1xuICBmdW5jdGlvbiBmcm9tKGFyckxpa2UpIHtcbiAgICB2YXIgbWFwRm4gPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMl07XG4gICAgdmFyIEMgPSB0aGlzO1xuICAgIHZhciBpdGVtcyA9IHRvT2JqZWN0KGFyckxpa2UpO1xuICAgIHZhciBtYXBwaW5nID0gbWFwRm4gIT09IHVuZGVmaW5lZDtcbiAgICB2YXIgayA9IDA7XG4gICAgdmFyIGFycixcbiAgICAgICAgbGVuO1xuICAgIGlmIChtYXBwaW5nICYmICFpc0NhbGxhYmxlKG1hcEZuKSkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIGlmIChjaGVja0l0ZXJhYmxlKGl0ZW1zKSkge1xuICAgICAgYXJyID0gaXNDb25zdHJ1Y3RvcihDKSA/IG5ldyBDKCkgOiBbXTtcbiAgICAgIHZhciAkX18zID0gdHJ1ZTtcbiAgICAgIHZhciAkX180ID0gZmFsc2U7XG4gICAgICB2YXIgJF9fNSA9IHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAodmFyICRfXzEgPSB2b2lkIDAsXG4gICAgICAgICAgICAkX18wID0gKGl0ZW1zKVtTeW1ib2wuaXRlcmF0b3JdKCk7ICEoJF9fMyA9ICgkX18xID0gJF9fMC5uZXh0KCkpLmRvbmUpOyAkX18zID0gdHJ1ZSkge1xuICAgICAgICAgIHZhciBpdGVtID0gJF9fMS52YWx1ZTtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAobWFwcGluZykge1xuICAgICAgICAgICAgICBhcnJba10gPSBtYXBGbi5jYWxsKHRoaXNBcmcsIGl0ZW0sIGspO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXJyW2tdID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKCRfXzYpIHtcbiAgICAgICAgJF9fNCA9IHRydWU7XG4gICAgICAgICRfXzUgPSAkX182O1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoISRfXzMgJiYgJF9fMC5yZXR1cm4gIT0gbnVsbCkge1xuICAgICAgICAgICAgJF9fMC5yZXR1cm4oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgaWYgKCRfXzQpIHtcbiAgICAgICAgICAgIHRocm93ICRfXzU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhcnIubGVuZ3RoID0gaztcbiAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuICAgIGxlbiA9IHRvTGVuZ3RoKGl0ZW1zLmxlbmd0aCk7XG4gICAgYXJyID0gaXNDb25zdHJ1Y3RvcihDKSA/IG5ldyBDKGxlbikgOiBuZXcgQXJyYXkobGVuKTtcbiAgICBmb3IgKDsgayA8IGxlbjsgaysrKSB7XG4gICAgICBpZiAobWFwcGluZykge1xuICAgICAgICBhcnJba10gPSB0eXBlb2YgdGhpc0FyZyA9PT0gJ3VuZGVmaW5lZCcgPyBtYXBGbihpdGVtc1trXSwgaykgOiBtYXBGbi5jYWxsKHRoaXNBcmcsIGl0ZW1zW2tdLCBrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycltrXSA9IGl0ZW1zW2tdO1xuICAgICAgfVxuICAgIH1cbiAgICBhcnIubGVuZ3RoID0gbGVuO1xuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgZnVuY3Rpb24gb2YoKSB7XG4gICAgZm9yICh2YXIgaXRlbXMgPSBbXSxcbiAgICAgICAgJF9fNyA9IDA7ICRfXzcgPCBhcmd1bWVudHMubGVuZ3RoOyAkX183KyspXG4gICAgICBpdGVtc1skX183XSA9IGFyZ3VtZW50c1skX183XTtcbiAgICB2YXIgQyA9IHRoaXM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgYXJyID0gaXNDb25zdHJ1Y3RvcihDKSA/IG5ldyBDKGxlbikgOiBuZXcgQXJyYXkobGVuKTtcbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGxlbjsgaysrKSB7XG4gICAgICBhcnJba10gPSBpdGVtc1trXTtcbiAgICB9XG4gICAgYXJyLmxlbmd0aCA9IGxlbjtcbiAgICByZXR1cm4gYXJyO1xuICB9XG4gIGZ1bmN0aW9uIGZpbGwodmFsdWUpIHtcbiAgICB2YXIgc3RhcnQgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDogMDtcbiAgICB2YXIgZW5kID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciBvYmplY3QgPSB0b09iamVjdCh0aGlzKTtcbiAgICB2YXIgbGVuID0gdG9MZW5ndGgob2JqZWN0Lmxlbmd0aCk7XG4gICAgdmFyIGZpbGxTdGFydCA9IHRvSW50ZWdlcihzdGFydCk7XG4gICAgdmFyIGZpbGxFbmQgPSBlbmQgIT09IHVuZGVmaW5lZCA/IHRvSW50ZWdlcihlbmQpIDogbGVuO1xuICAgIGZpbGxTdGFydCA9IGZpbGxTdGFydCA8IDAgPyBNYXRoLm1heChsZW4gKyBmaWxsU3RhcnQsIDApIDogTWF0aC5taW4oZmlsbFN0YXJ0LCBsZW4pO1xuICAgIGZpbGxFbmQgPSBmaWxsRW5kIDwgMCA/IE1hdGgubWF4KGxlbiArIGZpbGxFbmQsIDApIDogTWF0aC5taW4oZmlsbEVuZCwgbGVuKTtcbiAgICB3aGlsZSAoZmlsbFN0YXJ0IDwgZmlsbEVuZCkge1xuICAgICAgb2JqZWN0W2ZpbGxTdGFydF0gPSB2YWx1ZTtcbiAgICAgIGZpbGxTdGFydCsrO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIGZpbmQocHJlZGljYXRlKSB7XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgcmV0dXJuIGZpbmRIZWxwZXIodGhpcywgcHJlZGljYXRlLCB0aGlzQXJnKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kSW5kZXgocHJlZGljYXRlKSB7XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgcmV0dXJuIGZpbmRIZWxwZXIodGhpcywgcHJlZGljYXRlLCB0aGlzQXJnLCB0cnVlKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kSGVscGVyKHNlbGYsIHByZWRpY2F0ZSkge1xuICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciByZXR1cm5JbmRleCA9IGFyZ3VtZW50c1szXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbM10gOiBmYWxzZTtcbiAgICB2YXIgb2JqZWN0ID0gdG9PYmplY3Qoc2VsZik7XG4gICAgdmFyIGxlbiA9IHRvTGVuZ3RoKG9iamVjdC5sZW5ndGgpO1xuICAgIGlmICghaXNDYWxsYWJsZShwcmVkaWNhdGUpKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gb2JqZWN0W2ldO1xuICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBvYmplY3QpKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5JbmRleCA/IGkgOiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldHVybkluZGV4ID8gLTEgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxBcnJheShnbG9iYWwpIHtcbiAgICB2YXIgJF9fOCA9IGdsb2JhbCxcbiAgICAgICAgQXJyYXkgPSAkX184LkFycmF5LFxuICAgICAgICBPYmplY3QgPSAkX184Lk9iamVjdCxcbiAgICAgICAgU3ltYm9sID0gJF9fOC5TeW1ib2w7XG4gICAgdmFyIHZhbHVlcyA9IGpzVmFsdWVzO1xuICAgIGlmIChTeW1ib2wgJiYgU3ltYm9sLml0ZXJhdG9yICYmIEFycmF5LnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdKSB7XG4gICAgICB2YWx1ZXMgPSBBcnJheS5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXTtcbiAgICB9XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoQXJyYXkucHJvdG90eXBlLCBbJ2VudHJpZXMnLCBlbnRyaWVzLCAna2V5cycsIGtleXMsICd2YWx1ZXMnLCB2YWx1ZXMsICdmaWxsJywgZmlsbCwgJ2ZpbmQnLCBmaW5kLCAnZmluZEluZGV4JywgZmluZEluZGV4XSk7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoQXJyYXksIFsnZnJvbScsIGZyb20sICdvZicsIG9mXSk7XG4gICAgbWF5YmVBZGRJdGVyYXRvcihBcnJheS5wcm90b3R5cGUsIHZhbHVlcywgU3ltYm9sKTtcbiAgICBtYXliZUFkZEl0ZXJhdG9yKE9iamVjdC5nZXRQcm90b3R5cGVPZihbXS52YWx1ZXMoKSksIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgU3ltYm9sKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsQXJyYXkpO1xuICByZXR1cm4ge1xuICAgIGdldCBmcm9tKCkge1xuICAgICAgcmV0dXJuIGZyb207XG4gICAgfSxcbiAgICBnZXQgb2YoKSB7XG4gICAgICByZXR1cm4gb2Y7XG4gICAgfSxcbiAgICBnZXQgZmlsbCgpIHtcbiAgICAgIHJldHVybiBmaWxsO1xuICAgIH0sXG4gICAgZ2V0IGZpbmQoKSB7XG4gICAgICByZXR1cm4gZmluZDtcbiAgICB9LFxuICAgIGdldCBmaW5kSW5kZXgoKSB7XG4gICAgICByZXR1cm4gZmluZEluZGV4O1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsQXJyYXkoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxBcnJheTtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvQXJyYXkuanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9hc3NpZ24uanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL2Fzc2lnbi5qc1wiO1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzO1xuICBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICB2YXIgcHJvcHMgPSBzb3VyY2UgPT0gbnVsbCA/IFtdIDoga2V5cyhzb3VyY2UpO1xuICAgICAgdmFyIHAgPSB2b2lkIDAsXG4gICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgICAgZm9yIChwID0gMDsgcCA8IGxlbmd0aDsgcCsrKSB7XG4gICAgICAgIHZhciBuYW1lID0gcHJvcHNbcF07XG4gICAgICAgIHRhcmdldFtuYW1lXSA9IHNvdXJjZVtuYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuIGFzc2lnbjtcbiAgICB9fTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvT2JqZWN0LmpzXCI7XG4gIHZhciAkX18yID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvT2JqZWN0LmpzXCIpKSxcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMi5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18yLnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBhc3NpZ24gPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi9hc3NpZ24uanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvT2JqZWN0LmpzXCIpKS5kZWZhdWx0O1xuICB2YXIgJF9fMCA9IE9iamVjdCxcbiAgICAgIGRlZmluZVByb3BlcnR5ID0gJF9fMC5kZWZpbmVQcm9wZXJ0eSxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9ICRfXzAuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgICAgZ2V0T3duUHJvcGVydHlOYW1lcyA9ICRfXzAuZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgZnVuY3Rpb24gaXMobGVmdCwgcmlnaHQpIHtcbiAgICBpZiAobGVmdCA9PT0gcmlnaHQpXG4gICAgICByZXR1cm4gbGVmdCAhPT0gMCB8fCAxIC8gbGVmdCA9PT0gMSAvIHJpZ2h0O1xuICAgIHJldHVybiBsZWZ0ICE9PSBsZWZ0ICYmIHJpZ2h0ICE9PSByaWdodDtcbiAgfVxuICBmdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSkge1xuICAgIHZhciBwcm9wcyA9IGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICB2YXIgcCxcbiAgICAgICAgZGVzY3JpcHRvcixcbiAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgdmFyIG5hbWUgPSBwcm9wc1twXTtcbiAgICAgIGRlc2NyaXB0b3IgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBwcm9wc1twXSk7XG4gICAgICBkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BzW3BdLCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbE9iamVjdChnbG9iYWwpIHtcbiAgICB2YXIgT2JqZWN0ID0gZ2xvYmFsLk9iamVjdDtcbiAgICBtYXliZUFkZEZ1bmN0aW9ucyhPYmplY3QsIFsnYXNzaWduJywgYXNzaWduLCAnaXMnLCBpcywgJ21peGluJywgbWl4aW5dKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsT2JqZWN0KTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgYXNzaWduKCkge1xuICAgICAgcmV0dXJuIGFzc2lnbjtcbiAgICB9LFxuICAgIGdldCBpcygpIHtcbiAgICAgIHJldHVybiBpcztcbiAgICB9LFxuICAgIGdldCBtaXhpbigpIHtcbiAgICAgIHJldHVybiBtaXhpbjtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbE9iamVjdCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbE9iamVjdDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvT2JqZWN0LmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9OdW1iZXIuanNcIjtcbiAgdmFyICRfXzEgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9OdW1iZXIuanNcIikpLFxuICAgICAgaXNOdW1iZXIgPSAkX18xLmlzTnVtYmVyLFxuICAgICAgbWF5YmVBZGRDb25zdHMgPSAkX18xLm1heWJlQWRkQ29uc3RzLFxuICAgICAgbWF5YmVBZGRGdW5jdGlvbnMgPSAkX18xLm1heWJlQWRkRnVuY3Rpb25zLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzEucmVnaXN0ZXJQb2x5ZmlsbCxcbiAgICAgIHRvSW50ZWdlciA9ICRfXzEudG9JbnRlZ2VyO1xuICB2YXIgJGFicyA9IE1hdGguYWJzO1xuICB2YXIgJGlzRmluaXRlID0gaXNGaW5pdGU7XG4gIHZhciAkaXNOYU4gPSBpc05hTjtcbiAgdmFyIE1BWF9TQUZFX0lOVEVHRVIgPSBNYXRoLnBvdygyLCA1MykgLSAxO1xuICB2YXIgTUlOX1NBRkVfSU5URUdFUiA9IC1NYXRoLnBvdygyLCA1MykgKyAxO1xuICB2YXIgRVBTSUxPTiA9IE1hdGgucG93KDIsIC01Mik7XG4gIGZ1bmN0aW9uIE51bWJlcklzRmluaXRlKG51bWJlcikge1xuICAgIHJldHVybiBpc051bWJlcihudW1iZXIpICYmICRpc0Zpbml0ZShudW1iZXIpO1xuICB9XG4gIGZ1bmN0aW9uIGlzSW50ZWdlcihudW1iZXIpIHtcbiAgICByZXR1cm4gTnVtYmVySXNGaW5pdGUobnVtYmVyKSAmJiB0b0ludGVnZXIobnVtYmVyKSA9PT0gbnVtYmVyO1xuICB9XG4gIGZ1bmN0aW9uIE51bWJlcklzTmFOKG51bWJlcikge1xuICAgIHJldHVybiBpc051bWJlcihudW1iZXIpICYmICRpc05hTihudW1iZXIpO1xuICB9XG4gIGZ1bmN0aW9uIGlzU2FmZUludGVnZXIobnVtYmVyKSB7XG4gICAgaWYgKE51bWJlcklzRmluaXRlKG51bWJlcikpIHtcbiAgICAgIHZhciBpbnRlZ3JhbCA9IHRvSW50ZWdlcihudW1iZXIpO1xuICAgICAgaWYgKGludGVncmFsID09PSBudW1iZXIpXG4gICAgICAgIHJldHVybiAkYWJzKGludGVncmFsKSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxOdW1iZXIoZ2xvYmFsKSB7XG4gICAgdmFyIE51bWJlciA9IGdsb2JhbC5OdW1iZXI7XG4gICAgbWF5YmVBZGRDb25zdHMoTnVtYmVyLCBbJ01BWF9TQUZFX0lOVEVHRVInLCBNQVhfU0FGRV9JTlRFR0VSLCAnTUlOX1NBRkVfSU5URUdFUicsIE1JTl9TQUZFX0lOVEVHRVIsICdFUFNJTE9OJywgRVBTSUxPTl0pO1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKE51bWJlciwgWydpc0Zpbml0ZScsIE51bWJlcklzRmluaXRlLCAnaXNJbnRlZ2VyJywgaXNJbnRlZ2VyLCAnaXNOYU4nLCBOdW1iZXJJc05hTiwgJ2lzU2FmZUludGVnZXInLCBpc1NhZmVJbnRlZ2VyXSk7XG4gIH1cbiAgcmVnaXN0ZXJQb2x5ZmlsbChwb2x5ZmlsbE51bWJlcik7XG4gIHJldHVybiB7XG4gICAgZ2V0IE1BWF9TQUZFX0lOVEVHRVIoKSB7XG4gICAgICByZXR1cm4gTUFYX1NBRkVfSU5URUdFUjtcbiAgICB9LFxuICAgIGdldCBNSU5fU0FGRV9JTlRFR0VSKCkge1xuICAgICAgcmV0dXJuIE1JTl9TQUZFX0lOVEVHRVI7XG4gICAgfSxcbiAgICBnZXQgRVBTSUxPTigpIHtcbiAgICAgIHJldHVybiBFUFNJTE9OO1xuICAgIH0sXG4gICAgZ2V0IGlzRmluaXRlKCkge1xuICAgICAgcmV0dXJuIE51bWJlcklzRmluaXRlO1xuICAgIH0sXG4gICAgZ2V0IGlzSW50ZWdlcigpIHtcbiAgICAgIHJldHVybiBpc0ludGVnZXI7XG4gICAgfSxcbiAgICBnZXQgaXNOYU4oKSB7XG4gICAgICByZXR1cm4gTnVtYmVySXNOYU47XG4gICAgfSxcbiAgICBnZXQgaXNTYWZlSW50ZWdlcigpIHtcbiAgICAgIHJldHVybiBpc1NhZmVJbnRlZ2VyO1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsTnVtYmVyKCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsTnVtYmVyO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9OdW1iZXIuanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9mcm91bmQuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL2Zyb3VuZC5qc1wiO1xuICB2YXIgJGlzRmluaXRlID0gaXNGaW5pdGU7XG4gIHZhciAkaXNOYU4gPSBpc05hTjtcbiAgdmFyICRfXzAgPSBNYXRoLFxuICAgICAgTE4yID0gJF9fMC5MTjIsXG4gICAgICBhYnMgPSAkX18wLmFicyxcbiAgICAgIGZsb29yID0gJF9fMC5mbG9vcixcbiAgICAgIGxvZyA9ICRfXzAubG9nLFxuICAgICAgbWluID0gJF9fMC5taW4sXG4gICAgICBwb3cgPSAkX18wLnBvdztcbiAgZnVuY3Rpb24gcGFja0lFRUU3NTQodiwgZWJpdHMsIGZiaXRzKSB7XG4gICAgdmFyIGJpYXMgPSAoMSA8PCAoZWJpdHMgLSAxKSkgLSAxLFxuICAgICAgICBzLFxuICAgICAgICBlLFxuICAgICAgICBmLFxuICAgICAgICBsbixcbiAgICAgICAgaSxcbiAgICAgICAgYml0cyxcbiAgICAgICAgc3RyLFxuICAgICAgICBieXRlcztcbiAgICBmdW5jdGlvbiByb3VuZFRvRXZlbihuKSB7XG4gICAgICB2YXIgdyA9IGZsb29yKG4pLFxuICAgICAgICAgIGYgPSBuIC0gdztcbiAgICAgIGlmIChmIDwgMC41KVxuICAgICAgICByZXR1cm4gdztcbiAgICAgIGlmIChmID4gMC41KVxuICAgICAgICByZXR1cm4gdyArIDE7XG4gICAgICByZXR1cm4gdyAlIDIgPyB3ICsgMSA6IHc7XG4gICAgfVxuICAgIGlmICh2ICE9PSB2KSB7XG4gICAgICBlID0gKDEgPDwgZWJpdHMpIC0gMTtcbiAgICAgIGYgPSBwb3coMiwgZmJpdHMgLSAxKTtcbiAgICAgIHMgPSAwO1xuICAgIH0gZWxzZSBpZiAodiA9PT0gSW5maW5pdHkgfHwgdiA9PT0gLUluZmluaXR5KSB7XG4gICAgICBlID0gKDEgPDwgZWJpdHMpIC0gMTtcbiAgICAgIGYgPSAwO1xuICAgICAgcyA9ICh2IDwgMCkgPyAxIDogMDtcbiAgICB9IGVsc2UgaWYgKHYgPT09IDApIHtcbiAgICAgIGUgPSAwO1xuICAgICAgZiA9IDA7XG4gICAgICBzID0gKDEgLyB2ID09PSAtSW5maW5pdHkpID8gMSA6IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMgPSB2IDwgMDtcbiAgICAgIHYgPSBhYnModik7XG4gICAgICBpZiAodiA+PSBwb3coMiwgMSAtIGJpYXMpKSB7XG4gICAgICAgIGUgPSBtaW4oZmxvb3IobG9nKHYpIC8gTE4yKSwgMTAyMyk7XG4gICAgICAgIGYgPSByb3VuZFRvRXZlbih2IC8gcG93KDIsIGUpICogcG93KDIsIGZiaXRzKSk7XG4gICAgICAgIGlmIChmIC8gcG93KDIsIGZiaXRzKSA+PSAyKSB7XG4gICAgICAgICAgZSA9IGUgKyAxO1xuICAgICAgICAgIGYgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlID4gYmlhcykge1xuICAgICAgICAgIGUgPSAoMSA8PCBlYml0cykgLSAxO1xuICAgICAgICAgIGYgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGUgPSBlICsgYmlhcztcbiAgICAgICAgICBmID0gZiAtIHBvdygyLCBmYml0cyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGUgPSAwO1xuICAgICAgICBmID0gcm91bmRUb0V2ZW4odiAvIHBvdygyLCAxIC0gYmlhcyAtIGZiaXRzKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGJpdHMgPSBbXTtcbiAgICBmb3IgKGkgPSBmYml0czsgaTsgaSAtPSAxKSB7XG4gICAgICBiaXRzLnB1c2goZiAlIDIgPyAxIDogMCk7XG4gICAgICBmID0gZmxvb3IoZiAvIDIpO1xuICAgIH1cbiAgICBmb3IgKGkgPSBlYml0czsgaTsgaSAtPSAxKSB7XG4gICAgICBiaXRzLnB1c2goZSAlIDIgPyAxIDogMCk7XG4gICAgICBlID0gZmxvb3IoZSAvIDIpO1xuICAgIH1cbiAgICBiaXRzLnB1c2gocyA/IDEgOiAwKTtcbiAgICBiaXRzLnJldmVyc2UoKTtcbiAgICBzdHIgPSBiaXRzLmpvaW4oJycpO1xuICAgIGJ5dGVzID0gW107XG4gICAgd2hpbGUgKHN0ci5sZW5ndGgpIHtcbiAgICAgIGJ5dGVzLnB1c2gocGFyc2VJbnQoc3RyLnN1YnN0cmluZygwLCA4KSwgMikpO1xuICAgICAgc3RyID0gc3RyLnN1YnN0cmluZyg4KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG4gIGZ1bmN0aW9uIHVucGFja0lFRUU3NTQoYnl0ZXMsIGViaXRzLCBmYml0cykge1xuICAgIHZhciBiaXRzID0gW10sXG4gICAgICAgIGksXG4gICAgICAgIGosXG4gICAgICAgIGIsXG4gICAgICAgIHN0cixcbiAgICAgICAgYmlhcyxcbiAgICAgICAgcyxcbiAgICAgICAgZSxcbiAgICAgICAgZjtcbiAgICBmb3IgKGkgPSBieXRlcy5sZW5ndGg7IGk7IGkgLT0gMSkge1xuICAgICAgYiA9IGJ5dGVzW2kgLSAxXTtcbiAgICAgIGZvciAoaiA9IDg7IGo7IGogLT0gMSkge1xuICAgICAgICBiaXRzLnB1c2goYiAlIDIgPyAxIDogMCk7XG4gICAgICAgIGIgPSBiID4+IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGJpdHMucmV2ZXJzZSgpO1xuICAgIHN0ciA9IGJpdHMuam9pbignJyk7XG4gICAgYmlhcyA9ICgxIDw8IChlYml0cyAtIDEpKSAtIDE7XG4gICAgcyA9IHBhcnNlSW50KHN0ci5zdWJzdHJpbmcoMCwgMSksIDIpID8gLTEgOiAxO1xuICAgIGUgPSBwYXJzZUludChzdHIuc3Vic3RyaW5nKDEsIDEgKyBlYml0cyksIDIpO1xuICAgIGYgPSBwYXJzZUludChzdHIuc3Vic3RyaW5nKDEgKyBlYml0cyksIDIpO1xuICAgIGlmIChlID09PSAoMSA8PCBlYml0cykgLSAxKSB7XG4gICAgICByZXR1cm4gZiAhPT0gMCA/IE5hTiA6IHMgKiBJbmZpbml0eTtcbiAgICB9IGVsc2UgaWYgKGUgPiAwKSB7XG4gICAgICByZXR1cm4gcyAqIHBvdygyLCBlIC0gYmlhcykgKiAoMSArIGYgLyBwb3coMiwgZmJpdHMpKTtcbiAgICB9IGVsc2UgaWYgKGYgIT09IDApIHtcbiAgICAgIHJldHVybiBzICogcG93KDIsIC0oYmlhcyAtIDEpKSAqIChmIC8gcG93KDIsIGZiaXRzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzIDwgMCA/IC0wIDogMDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdW5wYWNrRjMyKGIpIHtcbiAgICByZXR1cm4gdW5wYWNrSUVFRTc1NChiLCA4LCAyMyk7XG4gIH1cbiAgZnVuY3Rpb24gcGFja0YzMih2KSB7XG4gICAgcmV0dXJuIHBhY2tJRUVFNzU0KHYsIDgsIDIzKTtcbiAgfVxuICBmdW5jdGlvbiBmcm91bmQoeCkge1xuICAgIGlmICh4ID09PSAwIHx8ICEkaXNGaW5pdGUoeCkgfHwgJGlzTmFOKHgpKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgcmV0dXJuIHVucGFja0YzMihwYWNrRjMyKE51bWJlcih4KSkpO1xuICB9XG4gIHJldHVybiB7Z2V0IGZyb3VuZCgpIHtcbiAgICAgIHJldHVybiBmcm91bmQ7XG4gICAgfX07XG59KTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXRoLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXRoLmpzXCI7XG4gIHZhciBqc0Zyb3VuZCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL2Zyb3VuZC5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXRoLmpzXCIpKS5mcm91bmQ7XG4gIHZhciAkX18zID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4vdXRpbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWF0aC5qc1wiKSksXG4gICAgICBtYXliZUFkZEZ1bmN0aW9ucyA9ICRfXzMubWF5YmVBZGRGdW5jdGlvbnMsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMy5yZWdpc3RlclBvbHlmaWxsLFxuICAgICAgdG9VaW50MzIgPSAkX18zLnRvVWludDMyO1xuICB2YXIgJGlzRmluaXRlID0gaXNGaW5pdGU7XG4gIHZhciAkaXNOYU4gPSBpc05hTjtcbiAgdmFyICRfXzAgPSBNYXRoLFxuICAgICAgYWJzID0gJF9fMC5hYnMsXG4gICAgICBjZWlsID0gJF9fMC5jZWlsLFxuICAgICAgZXhwID0gJF9fMC5leHAsXG4gICAgICBmbG9vciA9ICRfXzAuZmxvb3IsXG4gICAgICBsb2cgPSAkX18wLmxvZyxcbiAgICAgIHBvdyA9ICRfXzAucG93LFxuICAgICAgc3FydCA9ICRfXzAuc3FydDtcbiAgZnVuY3Rpb24gY2x6MzIoeCkge1xuICAgIHggPSB0b1VpbnQzMigreCk7XG4gICAgaWYgKHggPT0gMClcbiAgICAgIHJldHVybiAzMjtcbiAgICB2YXIgcmVzdWx0ID0gMDtcbiAgICBpZiAoKHggJiAweEZGRkYwMDAwKSA9PT0gMCkge1xuICAgICAgeCA8PD0gMTY7XG4gICAgICByZXN1bHQgKz0gMTY7XG4gICAgfVxuICAgIDtcbiAgICBpZiAoKHggJiAweEZGMDAwMDAwKSA9PT0gMCkge1xuICAgICAgeCA8PD0gODtcbiAgICAgIHJlc3VsdCArPSA4O1xuICAgIH1cbiAgICA7XG4gICAgaWYgKCh4ICYgMHhGMDAwMDAwMCkgPT09IDApIHtcbiAgICAgIHggPDw9IDQ7XG4gICAgICByZXN1bHQgKz0gNDtcbiAgICB9XG4gICAgO1xuICAgIGlmICgoeCAmIDB4QzAwMDAwMDApID09PSAwKSB7XG4gICAgICB4IDw8PSAyO1xuICAgICAgcmVzdWx0ICs9IDI7XG4gICAgfVxuICAgIDtcbiAgICBpZiAoKHggJiAweDgwMDAwMDAwKSA9PT0gMCkge1xuICAgICAgeCA8PD0gMTtcbiAgICAgIHJlc3VsdCArPSAxO1xuICAgIH1cbiAgICA7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBpbXVsKHgsIHkpIHtcbiAgICB4ID0gdG9VaW50MzIoK3gpO1xuICAgIHkgPSB0b1VpbnQzMigreSk7XG4gICAgdmFyIHhoID0gKHggPj4+IDE2KSAmIDB4ZmZmZjtcbiAgICB2YXIgeGwgPSB4ICYgMHhmZmZmO1xuICAgIHZhciB5aCA9ICh5ID4+PiAxNikgJiAweGZmZmY7XG4gICAgdmFyIHlsID0geSAmIDB4ZmZmZjtcbiAgICByZXR1cm4geGwgKiB5bCArICgoKHhoICogeWwgKyB4bCAqIHloKSA8PCAxNikgPj4+IDApIHwgMDtcbiAgfVxuICBmdW5jdGlvbiBzaWduKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKHggPiAwKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHggPCAwKVxuICAgICAgcmV0dXJuIC0xO1xuICAgIHJldHVybiB4O1xuICB9XG4gIGZ1bmN0aW9uIGxvZzEwKHgpIHtcbiAgICByZXR1cm4gbG9nKHgpICogMC40MzQyOTQ0ODE5MDMyNTE4Mjg7XG4gIH1cbiAgZnVuY3Rpb24gbG9nMih4KSB7XG4gICAgcmV0dXJuIGxvZyh4KSAqIDEuNDQyNjk1MDQwODg4OTYzNDA3O1xuICB9XG4gIGZ1bmN0aW9uIGxvZzFwKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKHggPCAtMSB8fCAkaXNOYU4oeCkpIHtcbiAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIGlmICh4ID09PSAwIHx8IHggPT09IEluZmluaXR5KSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYgKHggPT09IC0xKSB7XG4gICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gMDtcbiAgICB2YXIgbiA9IDUwO1xuICAgIGlmICh4IDwgMCB8fCB4ID4gMSkge1xuICAgICAgcmV0dXJuIGxvZygxICsgeCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJSAyKSA9PT0gMCkge1xuICAgICAgICByZXN1bHQgLT0gcG93KHgsIGkpIC8gaTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBwb3coeCwgaSkgLyBpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIGV4cG0xKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKHggPT09IC1JbmZpbml0eSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBpZiAoISRpc0Zpbml0ZSh4KSB8fCB4ID09PSAwKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgcmV0dXJuIGV4cCh4KSAtIDE7XG4gIH1cbiAgZnVuY3Rpb24gY29zaCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID09PSAwKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgaWYgKCRpc05hTih4KSkge1xuICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgaWYgKCEkaXNGaW5pdGUoeCkpIHtcbiAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICB9XG4gICAgaWYgKHggPCAwKSB7XG4gICAgICB4ID0gLXg7XG4gICAgfVxuICAgIGlmICh4ID4gMjEpIHtcbiAgICAgIHJldHVybiBleHAoeCkgLyAyO1xuICAgIH1cbiAgICByZXR1cm4gKGV4cCh4KSArIGV4cCgteCkpIC8gMjtcbiAgfVxuICBmdW5jdGlvbiBzaW5oKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKCEkaXNGaW5pdGUoeCkgfHwgeCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIHJldHVybiAoZXhwKHgpIC0gZXhwKC14KSkgLyAyO1xuICB9XG4gIGZ1bmN0aW9uIHRhbmgoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoeCA9PT0gMClcbiAgICAgIHJldHVybiB4O1xuICAgIGlmICghJGlzRmluaXRlKHgpKVxuICAgICAgcmV0dXJuIHNpZ24oeCk7XG4gICAgdmFyIGV4cDEgPSBleHAoeCk7XG4gICAgdmFyIGV4cDIgPSBleHAoLXgpO1xuICAgIHJldHVybiAoZXhwMSAtIGV4cDIpIC8gKGV4cDEgKyBleHAyKTtcbiAgfVxuICBmdW5jdGlvbiBhY29zaCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4IDwgMSlcbiAgICAgIHJldHVybiBOYU47XG4gICAgaWYgKCEkaXNGaW5pdGUoeCkpXG4gICAgICByZXR1cm4geDtcbiAgICByZXR1cm4gbG9nKHggKyBzcXJ0KHggKyAxKSAqIHNxcnQoeCAtIDEpKTtcbiAgfVxuICBmdW5jdGlvbiBhc2luaCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID09PSAwIHx8ICEkaXNGaW5pdGUoeCkpXG4gICAgICByZXR1cm4geDtcbiAgICBpZiAoeCA+IDApXG4gICAgICByZXR1cm4gbG9nKHggKyBzcXJ0KHggKiB4ICsgMSkpO1xuICAgIHJldHVybiAtbG9nKC14ICsgc3FydCh4ICogeCArIDEpKTtcbiAgfVxuICBmdW5jdGlvbiBhdGFuaCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB9XG4gICAgaWYgKHggPT09IDEpIHtcbiAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICB9XG4gICAgaWYgKHggPT09IDApIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZiAoJGlzTmFOKHgpIHx8IHggPCAtMSB8fCB4ID4gMSkge1xuICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgcmV0dXJuIDAuNSAqIGxvZygoMSArIHgpIC8gKDEgLSB4KSk7XG4gIH1cbiAgZnVuY3Rpb24gaHlwb3QoeCwgeSkge1xuICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgdmFyIG1heCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG4gPSBhcmd1bWVudHNbaV07XG4gICAgICBuID0gK247XG4gICAgICBpZiAobiA9PT0gSW5maW5pdHkgfHwgbiA9PT0gLUluZmluaXR5KVxuICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgICBuID0gYWJzKG4pO1xuICAgICAgaWYgKG4gPiBtYXgpXG4gICAgICAgIG1heCA9IG47XG4gICAgICBhcmdzW2ldID0gbjtcbiAgICB9XG4gICAgaWYgKG1heCA9PT0gMClcbiAgICAgIG1heCA9IDE7XG4gICAgdmFyIHN1bSA9IDA7XG4gICAgdmFyIGNvbXBlbnNhdGlvbiA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG4gPSBhcmdzW2ldIC8gbWF4O1xuICAgICAgdmFyIHN1bW1hbmQgPSBuICogbiAtIGNvbXBlbnNhdGlvbjtcbiAgICAgIHZhciBwcmVsaW1pbmFyeSA9IHN1bSArIHN1bW1hbmQ7XG4gICAgICBjb21wZW5zYXRpb24gPSAocHJlbGltaW5hcnkgLSBzdW0pIC0gc3VtbWFuZDtcbiAgICAgIHN1bSA9IHByZWxpbWluYXJ5O1xuICAgIH1cbiAgICByZXR1cm4gc3FydChzdW0pICogbWF4O1xuICB9XG4gIGZ1bmN0aW9uIHRydW5jKHgpIHtcbiAgICB4ID0gK3g7XG4gICAgaWYgKHggPiAwKVxuICAgICAgcmV0dXJuIGZsb29yKHgpO1xuICAgIGlmICh4IDwgMClcbiAgICAgIHJldHVybiBjZWlsKHgpO1xuICAgIHJldHVybiB4O1xuICB9XG4gIHZhciBmcm91bmQsXG4gICAgICBmMzI7XG4gIGlmICh0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZjMyID0gbmV3IEZsb2F0MzJBcnJheSgxKTtcbiAgICBmcm91bmQgPSBmdW5jdGlvbih4KSB7XG4gICAgICBmMzJbMF0gPSBOdW1iZXIoeCk7XG4gICAgICByZXR1cm4gZjMyWzBdO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgZnJvdW5kID0ganNGcm91bmQ7XG4gIH1cbiAgZnVuY3Rpb24gY2JydCh4KSB7XG4gICAgeCA9ICt4O1xuICAgIGlmICh4ID09PSAwKVxuICAgICAgcmV0dXJuIHg7XG4gICAgdmFyIG5lZ2F0ZSA9IHggPCAwO1xuICAgIGlmIChuZWdhdGUpXG4gICAgICB4ID0gLXg7XG4gICAgdmFyIHJlc3VsdCA9IHBvdyh4LCAxIC8gMyk7XG4gICAgcmV0dXJuIG5lZ2F0ZSA/IC1yZXN1bHQgOiByZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxNYXRoKGdsb2JhbCkge1xuICAgIHZhciBNYXRoID0gZ2xvYmFsLk1hdGg7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoTWF0aCwgWydhY29zaCcsIGFjb3NoLCAnYXNpbmgnLCBhc2luaCwgJ2F0YW5oJywgYXRhbmgsICdjYnJ0JywgY2JydCwgJ2NsejMyJywgY2x6MzIsICdjb3NoJywgY29zaCwgJ2V4cG0xJywgZXhwbTEsICdmcm91bmQnLCBmcm91bmQsICdoeXBvdCcsIGh5cG90LCAnaW11bCcsIGltdWwsICdsb2cxMCcsIGxvZzEwLCAnbG9nMXAnLCBsb2cxcCwgJ2xvZzInLCBsb2cyLCAnc2lnbicsIHNpZ24sICdzaW5oJywgc2luaCwgJ3RhbmgnLCB0YW5oLCAndHJ1bmMnLCB0cnVuY10pO1xuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxNYXRoKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgY2x6MzIoKSB7XG4gICAgICByZXR1cm4gY2x6MzI7XG4gICAgfSxcbiAgICBnZXQgaW11bCgpIHtcbiAgICAgIHJldHVybiBpbXVsO1xuICAgIH0sXG4gICAgZ2V0IHNpZ24oKSB7XG4gICAgICByZXR1cm4gc2lnbjtcbiAgICB9LFxuICAgIGdldCBsb2cxMCgpIHtcbiAgICAgIHJldHVybiBsb2cxMDtcbiAgICB9LFxuICAgIGdldCBsb2cyKCkge1xuICAgICAgcmV0dXJuIGxvZzI7XG4gICAgfSxcbiAgICBnZXQgbG9nMXAoKSB7XG4gICAgICByZXR1cm4gbG9nMXA7XG4gICAgfSxcbiAgICBnZXQgZXhwbTEoKSB7XG4gICAgICByZXR1cm4gZXhwbTE7XG4gICAgfSxcbiAgICBnZXQgY29zaCgpIHtcbiAgICAgIHJldHVybiBjb3NoO1xuICAgIH0sXG4gICAgZ2V0IHNpbmgoKSB7XG4gICAgICByZXR1cm4gc2luaDtcbiAgICB9LFxuICAgIGdldCB0YW5oKCkge1xuICAgICAgcmV0dXJuIHRhbmg7XG4gICAgfSxcbiAgICBnZXQgYWNvc2goKSB7XG4gICAgICByZXR1cm4gYWNvc2g7XG4gICAgfSxcbiAgICBnZXQgYXNpbmgoKSB7XG4gICAgICByZXR1cm4gYXNpbmg7XG4gICAgfSxcbiAgICBnZXQgYXRhbmgoKSB7XG4gICAgICByZXR1cm4gYXRhbmg7XG4gICAgfSxcbiAgICBnZXQgaHlwb3QoKSB7XG4gICAgICByZXR1cm4gaHlwb3Q7XG4gICAgfSxcbiAgICBnZXQgdHJ1bmMoKSB7XG4gICAgICByZXR1cm4gdHJ1bmM7XG4gICAgfSxcbiAgICBnZXQgZnJvdW5kKCkge1xuICAgICAgcmV0dXJuIGZyb3VuZDtcbiAgICB9LFxuICAgIGdldCBjYnJ0KCkge1xuICAgICAgcmV0dXJuIGNicnQ7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxNYXRoKCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsTWF0aDtcbiAgICB9XG4gIH07XG59KTtcbiR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTWF0aC5qc1wiICsgJycpO1xuJHRyYWNldXJSdW50aW1lLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtNYXAuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtNYXAuanNcIjtcbiAgdmFyICRfXzUgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi4vcHJpdmF0ZS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCIpKSxcbiAgICAgIGNyZWF0ZVByaXZhdGVTeW1ib2wgPSAkX181LmNyZWF0ZVByaXZhdGVTeW1ib2wsXG4gICAgICBkZWxldGVQcml2YXRlID0gJF9fNS5kZWxldGVQcml2YXRlLFxuICAgICAgZ2V0UHJpdmF0ZSA9ICRfXzUuZ2V0UHJpdmF0ZSxcbiAgICAgIGhhc1ByaXZhdGUgPSAkX181Lmhhc1ByaXZhdGUsXG4gICAgICBzZXRQcml2YXRlID0gJF9fNS5zZXRQcml2YXRlO1xuICB2YXIgJF9fNiA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9mcm96ZW4tZGF0YS5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCIpKSxcbiAgICAgIGRlbGV0ZUZyb3plbiA9ICRfXzYuZGVsZXRlRnJvemVuLFxuICAgICAgZ2V0RnJvemVuID0gJF9fNi5nZXRGcm96ZW4sXG4gICAgICBoYXNGcm96ZW4gPSAkX182Lmhhc0Zyb3plbixcbiAgICAgIHNldEZyb3plbiA9ICRfXzYuc2V0RnJvemVuO1xuICB2YXIgJF9fNyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtNYXAuanNcIikpLFxuICAgICAgaXNPYmplY3QgPSAkX183LmlzT2JqZWN0LFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzcucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyIGhhc05hdGl2ZVN5bWJvbCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9oYXMtbmF0aXZlLXN5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha01hcC5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyICRfXzIgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzIuZGVmaW5lUHJvcGVydHksXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAkX18yLmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGlzRXh0ZW5zaWJsZSA9ICRfXzIuaXNFeHRlbnNpYmxlO1xuICB2YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyIHNlbnRpbmVsID0ge307XG4gIHZhciBXZWFrTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gV2Vha01hcCgpIHtcbiAgICAgIHRoaXMubmFtZV8gPSBjcmVhdGVQcml2YXRlU3ltYm9sKCk7XG4gICAgICB0aGlzLmZyb3plbkRhdGFfID0gW107XG4gICAgfVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShXZWFrTWFwLCB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFpc09iamVjdChrZXkpKVxuICAgICAgICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCdrZXkgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUoa2V5KSkge1xuICAgICAgICAgIHNldEZyb3plbih0aGlzLmZyb3plbkRhdGFfLCBrZXksIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRQcml2YXRlKGtleSwgdGhpcy5uYW1lXywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSlcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEZyb3plbih0aGlzLmZyb3plbkRhdGFfLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZXRQcml2YXRlKGtleSwgdGhpcy5uYW1lXyk7XG4gICAgICB9LFxuICAgICAgZGVsZXRlOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKCFpc09iamVjdChrZXkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBkZWxldGVGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywga2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVsZXRlUHJpdmF0ZShrZXksIHRoaXMubmFtZV8pO1xuICAgICAgfSxcbiAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghaXNFeHRlbnNpYmxlKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gaGFzRnJvemVuKHRoaXMuZnJvemVuRGF0YV8sIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhhc1ByaXZhdGUoa2V5LCB0aGlzLm5hbWVfKTtcbiAgICAgIH1cbiAgICB9LCB7fSk7XG4gIH0oKTtcbiAgZnVuY3Rpb24gbmVlZHNQb2x5ZmlsbChnbG9iYWwpIHtcbiAgICB2YXIgJF9fNCA9IGdsb2JhbCxcbiAgICAgICAgV2Vha01hcCA9ICRfXzQuV2Vha01hcCxcbiAgICAgICAgU3ltYm9sID0gJF9fNC5TeW1ib2w7XG4gICAgaWYgKCFXZWFrTWFwIHx8ICFoYXNOYXRpdmVTeW1ib2woKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB2YXIgbyA9IHt9O1xuICAgICAgdmFyIHdtID0gbmV3IFdlYWtNYXAoW1tvLCBmYWxzZV1dKTtcbiAgICAgIHJldHVybiB3bS5nZXQobyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFdlYWtNYXAoZ2xvYmFsKSB7XG4gICAgaWYgKG5lZWRzUG9seWZpbGwoZ2xvYmFsKSkge1xuICAgICAgZ2xvYmFsLldlYWtNYXAgPSBXZWFrTWFwO1xuICAgIH1cbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsV2Vha01hcCk7XG4gIHJldHVybiB7XG4gICAgZ2V0IFdlYWtNYXAoKSB7XG4gICAgICByZXR1cm4gV2Vha01hcDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFdlYWtNYXAoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxXZWFrTWFwO1xuICAgIH1cbiAgfTtcbn0pO1xuJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9XZWFrTWFwLmpzXCIgKyAnJyk7XG4kdHJhY2V1clJ1bnRpbWUucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha1NldC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha1NldC5qc1wiO1xuICB2YXIgJF9fNSA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9wcml2YXRlLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIikpLFxuICAgICAgY3JlYXRlUHJpdmF0ZVN5bWJvbCA9ICRfXzUuY3JlYXRlUHJpdmF0ZVN5bWJvbCxcbiAgICAgIGRlbGV0ZVByaXZhdGUgPSAkX181LmRlbGV0ZVByaXZhdGUsXG4gICAgICBnZXRQcml2YXRlID0gJF9fNS5nZXRQcml2YXRlLFxuICAgICAgaGFzUHJpdmF0ZSA9ICRfXzUuaGFzUHJpdmF0ZSxcbiAgICAgIHNldFByaXZhdGUgPSAkX181LnNldFByaXZhdGU7XG4gIHZhciAkX182ID0gJHRyYWNldXJSdW50aW1lLmdldE1vZHVsZSgkdHJhY2V1clJ1bnRpbWUubm9ybWFsaXplTW9kdWxlTmFtZShcIi4uL2Zyb3plbi1kYXRhLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIikpLFxuICAgICAgZGVsZXRlRnJvemVuID0gJF9fNi5kZWxldGVGcm96ZW4sXG4gICAgICBnZXRGcm96ZW4gPSAkX182LmdldEZyb3plbixcbiAgICAgIHNldEZyb3plbiA9ICRfXzYuc2V0RnJvemVuO1xuICB2YXIgJF9fNyA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuL3V0aWxzLmpzXCIsIFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIikpLFxuICAgICAgaXNPYmplY3QgPSAkX183LmlzT2JqZWN0LFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzcucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyIGhhc05hdGl2ZVN5bWJvbCA9ICR0cmFjZXVyUnVudGltZS5nZXRNb2R1bGUoJHRyYWNldXJSdW50aW1lLm5vcm1hbGl6ZU1vZHVsZU5hbWUoXCIuLi9oYXMtbmF0aXZlLXN5bWJvbHMuanNcIiwgXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjExMS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvV2Vha1NldC5qc1wiKSkuZGVmYXVsdDtcbiAgdmFyICRfXzIgPSBPYmplY3QsXG4gICAgICBkZWZpbmVQcm9wZXJ0eSA9ICRfXzIuZGVmaW5lUHJvcGVydHksXG4gICAgICBpc0V4dGVuc2libGUgPSAkX18yLmlzRXh0ZW5zaWJsZTtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciBXZWFrU2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gV2Vha1NldCgpIHtcbiAgICAgIHRoaXMubmFtZV8gPSBjcmVhdGVQcml2YXRlU3ltYm9sKCk7XG4gICAgICB0aGlzLmZyb3plbkRhdGFfID0gW107XG4gICAgfVxuICAgIHJldHVybiAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShXZWFrU2V0LCB7XG4gICAgICBhZGQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghaXNPYmplY3QodmFsdWUpKVxuICAgICAgICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCd2YWx1ZSBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICBzZXRGcm96ZW4odGhpcy5mcm96ZW5EYXRhXywgdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRQcml2YXRlKHZhbHVlLCB0aGlzLm5hbWVfLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBkZWxldGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghaXNPYmplY3QodmFsdWUpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFpc0V4dGVuc2libGUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGRlbGV0ZUZyb3plbih0aGlzLmZyb3plbkRhdGFfLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlbGV0ZVByaXZhdGUodmFsdWUsIHRoaXMubmFtZV8pO1xuICAgICAgfSxcbiAgICAgIGhhczogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKCFpc09iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIWlzRXh0ZW5zaWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0RnJvemVuKHRoaXMuZnJvemVuRGF0YV8sIHZhbHVlKSA9PT0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhhc1ByaXZhdGUodmFsdWUsIHRoaXMubmFtZV8pO1xuICAgICAgfVxuICAgIH0sIHt9KTtcbiAgfSgpO1xuICBmdW5jdGlvbiBuZWVkc1BvbHlmaWxsKGdsb2JhbCkge1xuICAgIHZhciAkX180ID0gZ2xvYmFsLFxuICAgICAgICBXZWFrU2V0ID0gJF9fNC5XZWFrU2V0LFxuICAgICAgICBTeW1ib2wgPSAkX180LlN5bWJvbDtcbiAgICBpZiAoIVdlYWtTZXQgfHwgIWhhc05hdGl2ZVN5bWJvbCgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHZhciBvID0ge307XG4gICAgICB2YXIgd20gPSBuZXcgV2Vha1NldChbW29dXSk7XG4gICAgICByZXR1cm4gIXdtLmhhcyhvKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsV2Vha1NldChnbG9iYWwpIHtcbiAgICBpZiAobmVlZHNQb2x5ZmlsbChnbG9iYWwpKSB7XG4gICAgICBnbG9iYWwuV2Vha1NldCA9IFdlYWtTZXQ7XG4gICAgfVxuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxXZWFrU2V0KTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgV2Vha1NldCgpIHtcbiAgICAgIHJldHVybiBXZWFrU2V0O1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsV2Vha1NldCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbFdlYWtTZXQ7XG4gICAgfVxuICB9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1dlYWtTZXQuanNcIiArICcnKTtcbiR0cmFjZXVyUnVudGltZS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9wb2x5ZmlsbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3BvbHlmaWxscy5qc1wiO1xuICB2YXIgcG9seWZpbGxBbGwgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKCR0cmFjZXVyUnVudGltZS5ub3JtYWxpemVNb2R1bGVOYW1lKFwiLi91dGlscy5qc1wiLCBcInRyYWNldXItcnVudGltZUAwLjAuMTExL3NyYy9ydW50aW1lL3BvbHlmaWxscy9wb2x5ZmlsbHMuanNcIikpLnBvbHlmaWxsQWxsO1xuICBwb2x5ZmlsbEFsbChSZWZsZWN0Lmdsb2JhbCk7XG4gIHZhciBzZXR1cEdsb2JhbHMgPSAkdHJhY2V1clJ1bnRpbWUuc2V0dXBHbG9iYWxzO1xuICAkdHJhY2V1clJ1bnRpbWUuc2V0dXBHbG9iYWxzID0gZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG4gICAgcG9seWZpbGxBbGwoZ2xvYmFsKTtcbiAgfTtcbiAgcmV0dXJuIHt9O1xufSk7XG4kdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC4xMTEvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3BvbHlmaWxscy5qc1wiICsgJycpO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcInBCR3ZBcFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
