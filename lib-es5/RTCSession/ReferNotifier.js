"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var JsSIP_C = require('../Constants');
var debug = require('debug')('JsSIP:RTCSession:ReferNotifier');
var C = {
  event_type: 'refer',
  body_type: 'message/sipfrag;version=2.0',
  expires: 300
};
module.exports = /*#__PURE__*/function () {
  function ReferNotifier(session, id, expires) {
    _classCallCheck(this, ReferNotifier);
    this._session = session;
    this._id = id;
    this._expires = expires || C.expires;
    this._active = true;

    // The creation of a Notifier results in an immediate NOTIFY.
    this.notify(100);
  }
  return _createClass(ReferNotifier, [{
    key: "notify",
    value: function notify(code, reason) {
      debug('notify()');
      if (this._active === false) {
        return;
      }
      reason = reason || JsSIP_C.REASON_PHRASE[code] || '';
      var state;
      if (code >= 200) {
        state = 'terminated;reason=noresource';
      } else {
        state = "active;expires=".concat(this._expires);
      }

      // Put this in a try/catch block.
      this._session.sendRequest(JsSIP_C.NOTIFY, {
        extraHeaders: ["Event: ".concat(C.event_type, ";id=").concat(this._id), "Subscription-State: ".concat(state), "Content-Type: ".concat(C.body_type)],
        body: "SIP/2.0 ".concat(code, " ").concat(reason),
        eventHandlers: {
          // If a negative response is received, subscription is canceled.
          onErrorResponse: function onErrorResponse() {
            this._active = false;
          }
        }
      });
    }
  }]);
}();