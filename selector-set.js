(function() {
  'use strict';

  function SelectorSet() {
    this.uid = 0;
    this.querySelectors = [];
    this.matchSelectors = {
      'ID': {},
      'CLASS': {},
      'TAG': {},
      'UNIVERSAL': []
    };
  }

  var docElem = document.documentElement;
  var matches = (docElem.webkitMatchesSelector ||
                  docElem.mozMatchesSelector ||
                  docElem.oMatchesSelector ||
                  docElem.msMatchesSelector);

  SelectorSet.matches = function(el, selector) {
    return matches.call(el, selector);
  };

  SelectorSet.queryAll = function(selector, el) {
    return el.querySelectorAll(selector);
  };

  SelectorSet.prototype.add = function(selector, data) {
    var self = this;

    if (typeof selector === 'string') {
      var obj = {
        id: this.uid++,
        selector: selector,
        data: data
      };

      getSelectorGroups(selector).forEach(function(g) {
        var values;
        if (g.key) {
          values = self.matchSelectors[g.type][g.key];
          if (!values) {
            values = [];
            self.matchSelectors[g.type][g.key] = values;
          }
        } else {
          values = self.matchSelectors[g.type];
          if (!values) {
            values = [];
            self.matchSelectors[g.type] = values;
          }

        }
        values.push(obj);
      });

      this.querySelectors.push(selector);
    }
  };

  SelectorSet.prototype.queryAll = function(root) {
    var matches = {};

    var els = SelectorSet.queryAll(this.querySelectors.join(', '), root);

    var i, j, len, len2, el, m, obj;
    for (i = 0, len = els.length; i < len; i++) {
      el = els[i];
      m = this.matches(el);
      for (j = 0, len2 = m.length; j < len2; j++) {
        obj = m[j];
        if (!matches[obj.id]) {
          matches[obj.id] = {
            id: obj.id,
            selector: obj.selector,
            data: obj.data,
            elements: []
          };
        }
        matches[obj.id].elements.push(el);
      }
    }

    var results = [];
    for (m in matches) {
      results.push(matches[m]);
    }

    return results;
  };

  SelectorSet.prototype.matches = function(el) {
    if (!el) {
      return [];
    }

    var selectors = this.matchSelectors;
    var i, j, len, len2;

    var selectorGroup, possibleMatches = [];

    if (selectorGroup = selectors.ID[el.id]) {
      for (i = 0, len = selectorGroup.length; i < len; i++) {
        possibleMatches.push(selectorGroup[i]);
      }
    }

    var className = el.className;
    if (className) {
      var classSelectors = selectors.CLASS;
      var classNames = className.split(/\s/);
      for (j = 0, len2 = classNames.length; j < len2; j++) {
        if (selectorGroup = classSelectors[classNames[j]]) {
          for (i = 0, len = selectorGroup.length; i < len; i++) {
            possibleMatches.push(selectorGroup[i]);
          }
        }
      }
    }

    if (selectorGroup = selectors.TAG[el.nodeName]) {
      for (i = 0, len = selectorGroup.length; i < len; i++) {
        possibleMatches.push(selectorGroup[i]);
      }
    }

    if (selectorGroup = selectors.UNIVERSAL) {
      for (i = 0, len = selectorGroup.length; i < len; i++) {
        possibleMatches.push(selectorGroup[i]);
      }
    }

    var obj, ids = {}, matches = [];
    for (i = 0, len = possibleMatches.length; i < len; i++) {
      obj = possibleMatches[i];
      if (!ids[obj.id] && SelectorSet.matches(el, obj.selector)) {
        ids[obj.id] = true;
        matches.push({
          id: obj.id,
          selector: obj.selector,
          data: obj.data
        });
      }
    }

    matches.sort(function(a, b) {
      return a.id - b.id;
    });

    return matches;
  };

  // Regexps adopted from Sizzle
  //   https://github.com/jquery/sizzle/blob/1.7/sizzle.js
  //
  var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;
  var idRe = /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  var classRe = /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  var tagRe = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;

  // Find best selector groups for CSS selectors.
  //
  // selectors - CSS selector String.
  //
  // Returns an Array of {type, key} objects.
  function getSelectorGroups(selectors) {
    var m, n, last, rest = selectors, groups = [];

    do {
      chunker.exec('');
      if (m = chunker.exec(rest)) {
        rest = m[3];
        if (m[2] || !rest) {
          last = m[1];
          if (n = last.match(idRe)) {
            groups.push({ type: 'ID', key: n[0].slice(1) });
          } else if (n = last.match(classRe)) {
            groups.push({ type: 'CLASS', key: n[0].slice(1) });
          } else if (n = last.match(tagRe)) {
            groups.push({ type: 'TAG', key: n[0].toUpperCase() });
          } else {
            groups.push({ type: 'UNIVERSAL' });
          }
        }
      }
    } while (m);

    return groups;
  }


  window.SelectorSet = SelectorSet;
})();
