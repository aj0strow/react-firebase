"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.sync = sync;

var _react = require("react");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var assign = Object.assign;
var keys = Object.keys;


function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function sync(mapFirebaseToProps, mergeProps) {
  if (!mapFirebaseToProps) {
    mapFirebaseToProps = function mapFirebaseToProps() {
      return {};
    };
  }

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
          this.data = {};
          this.state = {
            firebase: {}
          };
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
          if (value) {
            this.data[key] = value;
          } else {
            delete this.data[key];
          }
          this.setState({
            firebase: assign({}, this.data)
          });
        }
      }, {
        key: "subscribe",
        value: function subscribe(props) {
          var _this2 = this;

          this.firebases = mapFirebaseToProps(props);
          this.callbacks = {};
          keys(this.firebases).forEach(function (key) {
            _this2.subscribeKey(key);
          });
        }
      }, {
        key: "subscribeKey",
        value: function subscribeKey(key) {
          var _this3 = this;

          var callback = function callback(snap) {
            _this3.setFirebase(key, snap.val());
          };
          this.callbacks[key] = callback;
          this.firebases[key].on("value", callback);
        }
      }, {
        key: "unsubscribe",
        value: function unsubscribe() {
          var _this4 = this;

          keys(this.firebases).forEach(function (key) {
            _this4.unsubscribeKey(key);
          });
          delete this.firebases;
          delete this.callbacks;
          this.setState({ firebase: {} });
        }
      }, {
        key: "unsubscribeKey",
        value: function unsubscribeKey(key) {
          this.firebases[key].off("value", this.callbacks[key]);
          delete this.firebases[key];
          delete this.callbacks[key];
          this.setFirebase(key, {});
        }
      }, {
        key: "render",
        value: function render() {
          var props = assign({}, this.props, mergeProps, this.state.firebase);
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