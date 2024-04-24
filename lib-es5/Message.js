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
var JsSIP_C = require('./Constants');
var SIPMessage = require('./SIPMessage');
var Utils = require('./Utils');
var RequestSender = require('./RequestSender');
var Exceptions = require('./Exceptions');
var debug = require('debug')('JsSIP:Message');
module.exports = /*#__PURE__*/function (_EventEmitter) {
  function Message(ua) {
    var _this;
    _classCallCheck(this, Message);
    _this = _callSuper(this, Message);
    _this._ua = ua;
    _this._request = null;
    _this._closed = false;
    _this._direction = null;
    _this._local_identity = null;
    _this._remote_identity = null;

    // Whether an incoming message has been replied.
    _this._is_replied = false;

    // Custom message empty object for high level use.
    _this._data = {};
    return _this;
  }
  _inherits(Message, _EventEmitter);
  return _createClass(Message, [{
    key: "direction",
    get: function get() {
      return this._direction;
    }
  }, {
    key: "local_identity",
    get: function get() {
      return this._local_identity;
    }
  }, {
    key: "remote_identity",
    get: function get() {
      return this._remote_identity;
    }
  }, {
    key: "send",
    value: function send(target, body) {
      var _this2 = this;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var originalTarget = target;
      if (target === undefined || body === undefined) {
        throw new TypeError('Not enough arguments');
      }

      // Check target validity.
      target = this._ua.normalizeTarget(target);
      if (!target) {
        throw new TypeError("Invalid target: ".concat(originalTarget));
      }

      // Get call options.
      var extraHeaders = Utils.cloneArray(options.extraHeaders);
      var eventHandlers = Utils.cloneObject(options.eventHandlers);
      var contentType = options.contentType || 'text/plain';

      // Set event handlers.
      for (var event in eventHandlers) {
        if (Object.prototype.hasOwnProperty.call(eventHandlers, event)) {
          this.on(event, eventHandlers[event]);
        }
      }
      extraHeaders.push("Content-Type: ".concat(contentType));
      this._request = new SIPMessage.OutgoingRequest(JsSIP_C.MESSAGE, target, this._ua, null, extraHeaders);
      if (body) {
        this._request.body = body;
      }
      var request_sender = new RequestSender(this._ua, this._request, {
        onRequestTimeout: function onRequestTimeout() {
          _this2._onRequestTimeout();
        },
        onTransportError: function onTransportError() {
          _this2._onTransportError();
        },
        onReceiveResponse: function onReceiveResponse(response) {
          _this2._receiveResponse(response);
        }
      });
      this._newMessage('local', this._request);
      request_sender.send();
    }
  }, {
    key: "init_incoming",
    value: function init_incoming(request) {
      this._request = request;
      this._newMessage('remote', request);

      // Reply with a 200 OK if the user didn't reply.
      if (!this._is_replied) {
        this._is_replied = true;
        request.reply(200);
      }
      this._close();
    }

    /**
     * Accept the incoming Message
     * Only valid for incoming Messages
     */
  }, {
    key: "accept",
    value: function accept() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var extraHeaders = Utils.cloneArray(options.extraHeaders);
      var body = options.body;
      if (this._direction !== 'incoming') {
        throw new Exceptions.NotSupportedError('"accept" not supported for outgoing Message');
      }
      if (this._is_replied) {
        throw new Error('incoming Message already replied');
      }
      this._is_replied = true;
      this._request.reply(200, null, extraHeaders, body);
    }

    /**
     * Reject the incoming Message
     * Only valid for incoming Messages
     */
  }, {
    key: "reject",
    value: function reject() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var status_code = options.status_code || 480;
      var reason_phrase = options.reason_phrase;
      var extraHeaders = Utils.cloneArray(options.extraHeaders);
      var body = options.body;
      if (this._direction !== 'incoming') {
        throw new Exceptions.NotSupportedError('"reject" not supported for outgoing Message');
      }
      if (this._is_replied) {
        throw new Error('incoming Message already replied');
      }
      if (status_code < 300 || status_code >= 700) {
        throw new TypeError("Invalid status_code: ".concat(status_code));
      }
      this._is_replied = true;
      this._request.reply(status_code, reason_phrase, extraHeaders, body);
    }
  }, {
    key: "_receiveResponse",
    value: function _receiveResponse(response) {
      if (this._closed) {
        return;
      }
      switch (true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          // Ignore provisional responses.
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          this._succeeded('remote', response);
          break;
        default:
          {
            var cause = Utils.sipErrorCause(response.status_code);
            this._failed('remote', response, cause);
            break;
          }
      }
    }
  }, {
    key: "_onRequestTimeout",
    value: function _onRequestTimeout() {
      if (this._closed) {
        return;
      }
      this._failed('system', null, JsSIP_C.causes.REQUEST_TIMEOUT);
    }
  }, {
    key: "_onTransportError",
    value: function _onTransportError() {
      if (this._closed) {
        return;
      }
      this._failed('system', null, JsSIP_C.causes.CONNECTION_ERROR);
    }
  }, {
    key: "_close",
    value: function _close() {
      this._closed = true;
      this._ua.destroyMessage(this);
    }

    /**
     * Internal Callbacks
     */
  }, {
    key: "_newMessage",
    value: function _newMessage(originator, request) {
      if (originator === 'remote') {
        this._direction = 'incoming';
        this._local_identity = request.to;
        this._remote_identity = request.from;
      } else if (originator === 'local') {
        this._direction = 'outgoing';
        this._local_identity = request.from;
        this._remote_identity = request.to;
      }
      this._ua.newMessage(this, {
        originator: originator,
        message: this,
        request: request
      });
    }
  }, {
    key: "_failed",
    value: function _failed(originator, response, cause) {
      debug('MESSAGE failed');
      this._close();
      debug('emit "failed"');
      this.emit('failed', {
        originator: originator,
        response: response || null,
        cause: cause
      });
    }
  }, {
    key: "_succeeded",
    value: function _succeeded(originator, response) {
      debug('MESSAGE succeeded');
      this._close();
      debug('emit "succeeded"');
      this.emit('succeeded', {
        originator: originator,
        response: response
      });
    }
  }]);
}(EventEmitter);