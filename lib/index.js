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

function startsWith(a, b) {
  return a.slice(0, b.length) == b;
}

function identity(x) {
  return x;
}

function sync(mapFirebaseToProps, mergeProps) {
  if (!mapFirebaseToProps) {
    mapFirebaseToProps = function mapFirebaseToProps() {
      return {};
    };
  }

  return function (WrappedComponent) {
    function panic(message) {
      throw new Error("[react-firebase]" + " " + getDisplayName(WrappedComponent) + " " + message);
    }

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
        key: "cancelCallback",
        value: function cancelCallback(query, key, err) {
          panic("permission denied: " + key + ", " + query.toString());
        }
      }, {
        key: "getFirebase",
        value: function getFirebase(key) {
          return this.data[key];
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
            _this2.callbacks[key] = _this2.bindEvent(key, _this2.firebases[key]);
          });
        }
      }, {
        key: "bindEvent",
        value: function bindEvent(key, mapping) {
          if (!mapping) {
            panic("missing firebase mapping for key: " + key);
          }
          if (startsWith(mapping.toString(), "https")) {
            mapping = { query: mapping, event: "value" };
          }
          mapping = assign({ postprocess: identity }, mapping);
          var _mapping = mapping;
          var event = _mapping.event;
          var query = _mapping.query;

          if (!query) {
            panic("missing query for key: " + key);
          }
          switch (event) {
            case "auth":
              return this.bindAuth(key, mapping);
            case "value":
              return this.bindValue(key, mapping);
            case "child_events":
              return this.bindChildEvents(key, mapping);
            default:
              panic("invalid sync event: " + event);
          }
        }
      }, {
        key: "bindAuth",
        value: function bindAuth(key, _ref) {
          var _this3 = this;

          var query = _ref.query;
          var postprocess = _ref.postprocess;

          var setAuth = function setAuth(auth) {
            _this3.setFirebase(key, postprocess(auth));
          };
          query.onAuth(setAuth);
          return function () {
            query.offAuth(setAuth);
          };
        }
      }, {
        key: "bindValue",
        value: function bindValue(key, _ref2) {
          var _this4 = this;

          var query = _ref2.query;
          var postprocess = _ref2.postprocess;

          var setValue = function setValue(snap) {
            _this4.setFirebase(key, postprocess(snap.val()));
          };
          var onError = function onError(err) {
            _this4.cancelCallback(query, key, err);
          };
          query.on("value", setValue, onError);
          return function () {
            query.off("value", setValue);
          };
        }
      }, {
        key: "bindChildEvents",
        value: function bindChildEvents(key, _ref3) {
          var _this5 = this;

          var query = _ref3.query;
          var postprocess = _ref3.postprocess;

          var setChild = function setChild(snap) {
            var data = assign({}, _this5.data[key]);
            data[snap.key()] = postprocess(snap.val());
            _this5.setFirebase(key, data);
          };
          var removeChild = function removeChild(snap) {
            var data = assign(_this5.data[key]);
            delete data[snap.key()];
            _this5.setFirebase(key, data);
          };
          query.on("child_added", setChild);
          query.on("child_changed", setChild);
          query.on("child_removed", removeChild);
          return function () {
            query.off("child_added", setChild);
            query.off("child_changed", setChild);
            query.off("child_removed", removeChild);
          };
        }
      }, {
        key: "unsubscribe",
        value: function unsubscribe() {
          var _this6 = this;

          keys(this.firebases).forEach(function (key) {
            _this6.callbacks[key]();
          });
          delete this.firebases;
          delete this.callbacks;
          this.setState({ firebase: {} });
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