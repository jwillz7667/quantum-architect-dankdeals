// Script to generate minified polyfills for inlining
const fs = require('fs');
const path = require('path');

const polyfillsContent = `
// Polyfills for production compatibility
(function () {
  // Polyfill for __name function
  if (typeof globalThis.__name !== 'function') {
    globalThis.__name = function (fn, name) {
      if (typeof fn === 'function' && name) {
        try {
          Object.defineProperty(fn, 'name', {
            value: name,
            configurable: true,
            writable: false,
          });
        } catch (e) {
          // Ignore errors on older browsers
        }
      }
      return fn;
    };
  }

  // Polyfill for __assign (Object.assign for older environments)
  if (typeof globalThis.__assign !== 'function') {
    globalThis.__assign = function () {
      globalThis.__assign =
        Object.assign ||
        function (t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
        };
      return globalThis.__assign.apply(this, arguments);
    };
  }

  // Polyfill for __extends (used for class inheritance)
  if (typeof globalThis.__extends !== 'function') {
    globalThis.__extends = function (d, b) {
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  }

  // Polyfill for __rest (object rest properties)
  if (typeof globalThis.__rest !== 'function') {
    globalThis.__rest = function (s, e) {
      var t = {};
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    };
  }

  // Polyfill for __spreadArray (array spread)
  if (typeof globalThis.__spreadArray !== 'function') {
    globalThis.__spreadArray = function (to, from, pack) {
      if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
  }

  // Ensure globalThis exists
  if (typeof globalThis === 'undefined') {
    window.globalThis = window;
  }

  // Polyfill for Object.hasOwn (used by some libraries)
  if (!Object.hasOwn) {
    Object.hasOwn = function (obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }
})();
`;

// Simple minification - remove comments and excessive whitespace
const minified = polyfillsContent
  .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
  .replace(/\s+/g, ' ') // Replace multiple spaces with single space
  .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
  .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
  .trim();

console.log('Original size:', polyfillsContent.length, 'bytes');
console.log('Minified size:', minified.length, 'bytes');
console.log('Reduction:', Math.round((1 - minified.length / polyfillsContent.length) * 100) + '%');
console.log('\nMinified polyfills:');
console.log(minified);

// Save to file for reference
fs.writeFileSync(path.join(__dirname, 'polyfills.min.js'), minified);
