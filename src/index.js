import { Component, createElement } from "react"
const { assign, keys } = Object

function getDisplayName (WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

function startsWith(a, b) {
  return a.slice(0, b.length) == b
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
        const { query, event } = mapping
        if (!query) {
          panic("missing query for key: " + key)
        }
        switch (event) {
        case "auth":
          return this.bindAuth(key, query)
        case "value":
          return this.bindValue(key, query)
        case "child_events":
          return this.bindChildEvents(key, query)
        default:
          panic("invalid sync event: " + event)
        }
      }
      
      bindAuth (key, query) {
        const setAuth = (auth) => {
          this.setFirebase(key, auth)
        }
        query.onAuth(setAuth)
        return function () {
          query.offAuth(setAuth)
        }
      }
      
      bindValue (key, query) {
        const setValue = (snap) => {
          this.setFirebase(key, snap.val())
        }
        query.on("value", setValue)
        return function () {
          query.off("value", setValue)
        }
        
        const callback = (snap) => {
          this.setFirebase(key, snap.val())
        }
        query.on("value", callback)
        return function () {
          query.off("value", callback)
        }
      }
      
      bindChildEvents(key, query) {
        const setChild = (snap) => {
          const data = assign({}, this.data[key])
          data[snap.key()] = snap.val()
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
