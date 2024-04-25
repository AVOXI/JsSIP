"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
var EventEmitter = require('events').EventEmitter;
var JsSIP_C = require('../Constants');
var Grammar = require('../Grammar');
var Utils = require('../Utils');
var debug = require('debug')('JsSIP:RTCSession:ReferSubscriber');
module.exports = /*#__PURE__*/function (_EventEmitter) {
  function ReferSubscriber(session) {
    var _this;
    _classCallCheck(this, ReferSubscriber);
    _this = _callSuper(this, ReferSubscriber);
    _this._id = null;
    _this._session = session;
    return _this;
  }
  _inherits(ReferSubscriber, _EventEmitter);
  return _createClass(ReferSubscriber, [{
    key: "id",
    get: function get() {
      return this._id;
    }
  }, {
    key: "sendRefer",
    value: function sendRefer(target) {
      var _this2 = this;
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      debug('sendRefer()');
      var extraHeaders = Utils.cloneArray(options.extraHeaders);
      var eventHandlers = Utils.cloneObject(options.eventHandlers);

      // Set event handlers.
      for (var event in eventHandlers) {
        if (Object.prototype.hasOwnProperty.call(eventHandlers, event)) {
          this.on(event, eventHandlers[event]);
        }
      }

      // Replaces URI header field.
      var replaces = null;
      if (options.replaces) {
        replaces = options.replaces._request.call_id;
        replaces += ";to-tag=".concat(options.replaces._to_tag);
        replaces += ";from-tag=".concat(options.replaces._from_tag);
        replaces = encodeURIComponent(replaces);
      }

      // Refer-To header field.
      var referTo = "Refer-To: <".concat(target).concat(replaces ? "?Replaces=".concat(replaces) : '', ">");
      extraHeaders.push(referTo);

      // Referred-By header field.
      var referredBy = "Referred-By: <".concat(this._session._ua._configuration.uri._scheme, ":").concat(this._session._ua._configuration.uri._user, "@").concat(this._session._ua._configuration.uri._host, ">");
      extraHeaders.push(referredBy);
      extraHeaders.push("Contact: ".concat(this._session.contact));
      var request = this._session.sendRequest(JsSIP_C.REFER, {
        extraHeaders: extraHeaders,
        eventHandlers: {
          onSuccessResponse: function onSuccessResponse(response) {
            _this2._requestSucceeded(response);
          },
          onErrorResponse: function onErrorResponse(response) {
            _this2._requestFailed(response, JsSIP_C.causes.REJECTED);
          },
          onTransportError: function onTransportError() {
            _this2._requestFailed(null, JsSIP_C.causes.CONNECTION_ERROR);
          },
          onRequestTimeout: function onRequestTimeout() {
            _this2._requestFailed(null, JsSIP_C.causes.REQUEST_TIMEOUT);
          },
          onDialogError: function onDialogError() {
            _this2._requestFailed(null, JsSIP_C.causes.DIALOG_ERROR);
          }
        }
      });
      this._id = request.cseq;
    }
  }, {
    key: "receiveNotify",
    value: function receiveNotify(request) {
      debug('receiveNotify()');
      if (!request.body) {
        return;
      }
      var status_line = Grammar.parse(request.body.trim(), 'Status_Line');
      if (status_line === -1) {
        debug("receiveNotify() | error parsing NOTIFY body: \"".concat(request.body, "\""));
        return;
      }
      switch (true) {
        case /^100$/.test(status_line.status_code):
          this.emit('trying', {
            request: request,
            status_line: status_line
          });
          break;
        case /^1[0-9]{2}$/.test(status_line.status_code):
          this.emit('progress', {
            request: request,
            status_line: status_line
          });
          break;
        case /^2[0-9]{2}$/.test(status_line.status_code):
          this.emit('accepted', {
            request: request,
            status_line: status_line
          });
          break;
        default:
          this.emit('failed', {
            request: request,
            status_line: status_line
          });
          break;
      }
    }
  }, {
    key: "_requestSucceeded",
    value: function _requestSucceeded(response) {
      debug('REFER succeeded');
      debug('emit "requestSucceeded"');
      this.emit('requestSucceeded', {
        response: response
      });
    }
  }, {
    key: "_requestFailed",
    value: function _requestFailed(response, cause) {
      debug('REFER failed');
      debug('emit "requestFailed"');
      this.emit('requestFailed', {
        response: response || null,
        cause: cause
      });
    }
  }]);
}(EventEmitter);