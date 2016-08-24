import { Component, createElement } from "react"
const { assign, keys } = Object

function getDisplayName (WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

function startsWith(a, b) {
  return a.slice(0, b.length) == b
}

function identity (x) {
  return x
}

export function sync(mapFirebaseToProps, mergeProps) {
  if (!mapFirebaseToProps) {
    mapFirebaseToProps = function () {
      return {}
    }
  }
  
  return function(WrappedComponent) {
    function panic(message) {
      throw new Error("[react-firebase]" + " " + getDisplayName(WrappedComponent) + " " + message)
    }
    
    class Sync extends Component {
      componentWillMount() {
        this.data = {}
        this.state = {
          firebase: {}
        }
        this.subscribe(this.props)
      }
      
      componentWillReceiveProps(props) {
        this.unsubscribe()
        this.subscribe(props)
      }
      
      componentWillUnmount() {
        this.unsubscribe()
      }
      
      getFirebase(key) {
        return this.data[key]
      }
      
      setFirebase(key, value) {
        if (value) {
          this.data[key] = value
        } else {
          delete this.data[key]
        }
        this.setState({
          firebase: assign({}, this.data)
        })
      }
      
      subscribe(props) {
        this.firebases = mapFirebaseToProps(props)
        this.callbacks = {}
        keys(this.firebases).forEach(key => {
          this.callbacks[key] = this.bindEvent(key, this.firebases[key])
        })
      }
      
      bindEvent(key, mapping) {        
        if (!mapping) {
          panic("missing firebase mapping for key: " + key)
        }
        if (startsWith(mapping.toString(), "https")) {
          mapping = { query: mapping, event: "value" }
        }
        mapping = assign({ postprocess: identity }, mapping)
        const { event, query } = mapping
        if (!query) {
          panic("missing query for key: " + key)
        }
        switch (event) {
        case "auth":
          return this.bindAuth(key, mapping)
        case "value":
          return this.bindValue(key, mapping)
        case "child_events":
          return this.bindChildEvents(key, mapping)
        default:
          panic("invalid sync event: " + event)
        }
      }
      
      bindAuth (key, { query, postprocess }) {
        const setAuth = (auth) => {
          this.setFirebase(key, postprocess(auth))
        }
        query.onAuth(setAuth)
        return function () {
          query.offAuth(setAuth)
        }
      }
      
      bindValue (key, { query, postprocess }) {
        const setValue = (snap) => {
          this.setFirebase(key, postprocess(snap.val()))
        }
        query.on("value", setValue)
        return function () {
          query.off("value", setValue)
        }
      }
      
      bindChildEvents(key, { query, postprocess }) {
        const setChild = (snap) => {
          const data = assign({}, this.data[key])
          data[snap.key()] = postprocess(snap.val())
          this.setFirebase(key, data)
        }
        const removeChild = (snap) => {
          const data = assign(this.data[key])
          delete data[snap.key()]
          this.setFirebase(key, data)
        }
        query.on("child_added", setChild)
        query.on("child_changed", setChild)
        query.on("child_removed", removeChild)
        return function () {
          query.off("child_added", setChild)
          query.off("child_changed", setChild)
          query.off("child_removed", removeChild)
        }
      }
      
      unsubscribe() {
        keys(this.firebases).forEach(key => {
          this.callbacks[key]()
        })
        delete this.firebases
        delete this.callbacks
        this.setState({ firebase: {} })
      }
      
      render() {
        const props = assign({}, this.props, mergeProps, this.state.firebase)
        return createElement(WrappedComponent, props)
      }
    }
    
    const componentName = getDisplayName(WrappedComponent)
    Sync.displayName = `Firebase(${componentName})`
    Sync.WrappedComponent = WrappedComponent
    
    return Sync
  }
}
