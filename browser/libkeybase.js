!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.kbpgp=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Generated by IcedCoffeeScript 1.7.1-f
(function() {
  module.exports = {
    versions: {
      leaf: {
        v1: 1,
        v2: 2
      }
    },
    seqno_types: {
      NONE: 0,
      PUBLIC: 1,
      PRIVATE: 2,
      SEMIPRIVATE: 3
    }
  };

}).call(this);

},{}],2:[function(require,module,exports){
// Generated by IcedCoffeeScript 1.7.1-f
(function() {
  exports.merkle = {
    leaf: require('./merkle/leaf')
  };

  exports.constants = require('./constants');

}).call(this);

},{"./constants":1,"./merkle/leaf":3}],3:[function(require,module,exports){
// Generated by IcedCoffeeScript 1.7.1-f
(function() {
  var C, Leaf, Parser, Triple;

  C = require('../constants');

  exports.Triple = Triple = (function() {
    function Triple(_arg) {
      this.seqno = _arg.seqno, this.payload_hash = _arg.payload_hash, this.sig_id = _arg.sig_id;
    }

    Triple.prototype.to_json = function() {
      return [this.seqno, this.payload_hash, this.sig_id];
    };

    return Triple;

  })();

  Parser = (function() {
    function Parser(val) {
      this.val = val;
    }

    Parser.prototype.parse = function() {
      var version;
      if (!Array.isArray(this.val) || this.val.length < 2) {
        throw new Error("Expected an array of length 2 or more");
      } else if (typeof this.val[0] !== 'number') {
        throw new Error("Need a number for first slot");
      } else if (typeof this.val[1] === 'string') {
        version = 1;
      } else {
        version = this.val[0];
      }
      switch (version) {
        case C.versions.leaf.v1:
          return this.parse_v1();
        case C.versions.leaf.v2:
          return this.parse_v2();
        default:
          throw new Error("unknown leaf version: " + version);
      }
    };

    Parser.prototype.parse_v1 = function() {
      var pub;
      pub = this.parse_triple(this.val);
      return new Leaf({
        pub: pub
      });
    };

    Parser.prototype.parse_v2 = function() {
      var pub, semipriv, _ref;
      if (this.val.length < 2) {
        throw new Error("No public chain");
      }
      pub = this.parse_triple(this.val[1]);
      semipriv = (this.val.length > 2) && ((_ref = this.val[2]) != null ? _ref.length : void 0) ? this.parse_triple(this.val[2]) : null;
      return new Leaf({
        pub: pub,
        semipriv: semipriv
      });
    };

    Parser.prototype.match_hex = function(s) {
      return (typeof s === 'string') && !!(s.match(/^([a-fA-F0-9]*)$/)) && (s.length % 2 === 0);
    };

    Parser.prototype.parse_triple = function(val) {
      var msg;
      msg = val.length < 2 ? "Bad triple with < 2 values" : val.length > 3 ? "Bad triple with > 3 values" : typeof val[0] !== 'number' ? "Bad sequence #" : !this.match_hex(val[1]) ? "bad value[1]" : val.length > 2 && val[2].length && !this.match_hex(val[2]) ? "bad value[2]" : null;
      if (msg != null) {
        throw new Error(msg);
      }
      return new Triple({
        seqno: val[0],
        payload_hash: val[1],
        sig_id: val[2]
      });
    };

    return Parser;

  })();

  exports.Leaf = Leaf = (function() {
    function Leaf(_arg) {
      this.pub = _arg.pub, this.semipriv = _arg.semipriv;
    }

    Leaf.prototype.get_public = function() {
      return this.pub;
    };

    Leaf.prototype.get_semiprivate = function() {
      return this.semipriv;
    };

    Leaf.prototype.to_json = function() {
      var ret;
      ret = [C.versions.leaf.v2, this.pub.to_json()];
      if (this.semipriv != null) {
        ret.push(this.semipriv.to_json());
      }
      return ret;
    };

    Leaf.prototype.to_string = function() {
      return JSON.stringify(this.to_json());
    };

    Leaf.parse = function(version, val) {
      var e, err, leaf, parser;
      parser = new Parser(version, val);
      err = leaf = null;
      try {
        leaf = parser.parse();
      } catch (_error) {
        e = _error;
        err = e;
      }
      return [err, leaf];
    };

    Leaf.prototype.seqno_assertion = function() {
      return (function(_this) {
        return function(rows) {
          var found, seqno, seqno_type, triple, _i, _len, _ref, _ref1, _ref2;
          found = {};
          for (_i = 0, _len = rows.length; _i < _len; _i++) {
            _ref = rows[_i], seqno_type = _ref.seqno_type, seqno = _ref.seqno;
            triple = (function() {
              switch (seqno_type) {
                case C.seqno_types.PUBLIC:
                  return this.pub;
                case C.seqno_types.SEMIPRIVATE:
                  return this.semipriv;
                default:
                  return null;
              }
            }).call(_this);
            if ((triple == null) || (triple.seqno !== seqno)) {
              return false;
            }
            found[seqno_type] = true;
          }
          if (((_ref1 = _this.semipriv) != null ? _ref1.seqno : void 0) && (!found[C.seqno_types.SEMIPRIVATE])) {
            return false;
          }
          if (((_ref2 = _this.pub) != null ? _ref2.seqno : void 0) && (!found[C.seqno_types.PUBLIC])) {
            return false;
          }
          return true;
        };
      })(this);
    };

    return Leaf;

  })();

}).call(this);

},{"../constants":1}]},{},[2])(2)
});