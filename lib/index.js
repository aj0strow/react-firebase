"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.sync = sync;

var _react = require("react");

var _lodash = require("lodash");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function sync(mapQueryProps, methods) {
  return function (WrappedComponent) {
    var Sync = function (_Component) {
      _inherits(Sync, _Component);

      function Sync() {
        _classCallCheck(this, Sync);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Sync).apply(this, arguments));
      }

      _createClass(Sync, [{
        key: "componentWillMount",
        value: function componentWillMount() {
          var _this2 = this;

          this.state = {
            firebase: {}
          };

          (0, _lodash.keys)(mapQueryProps(this.props)).forEach(function (key) {
            _this2.setFirebase(key, {});
          });
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          this.subscribe(this.props);
        }
      }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(props) {
          this.unsubscribe();
          this.subscribe(props);
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          this.unsubscribe();
        }
      }, {
        key: "setFirebase",
        value: function setFirebase(key, value) {
          var firebase = (0, _lodash.assign)({}, this.state.firebase, _defineProperty({}, key, value));
          this.setState({ firebase: firebase });
        }
      }, {
        key: "bindEvent",
        value: function bindEvent(key) {
          var _this3 = this;

          return function (snap) {
            var value = snap.val();
            if (value) {
              _this3.setFirebase(key, value);
            }
          };
        }
      }, {
        key: "subscribe",
        value: function subscribe(props) {
          var _this4 = this;

          this.firebases = mapQueryProps(props);
          this.callbacks = {};
          (0, _lodash.each)(this.firebases, function (query, key) {
            _this4.callbacks[key] = _this4.bindEvent(key);
            query.on("value", _this4.callbacks[key]);
          });
        }
      }, {
        key: "unsubscribe",
        value: function unsubscribe() {
          var _this5 = this;

          (0, _lodash.each)(this.firebases, function (query, key) {
            query.off("value", _this5.callbacks[key]);
          });
          delete this.firebases;
          delete this.callbacks;
          this.setState({ firebase: {} });
        }
      }, {
        key: "render",
        value: function render() {
          var props = (0, _lodash.assign)({}, this.props, this.state.firebase, methods);
          return (0, _react.createElement)(WrappedComponent, props);
        }
      }]);

      return Sync;
    }(_react.Component);

    var componentName = getDisplayName(WrappedComponent);
    Sync.displayName = "Firebase(" + componentName + ")";
    Sync.WrappedComponent = WrappedComponent;

    return Sync;
  };
}