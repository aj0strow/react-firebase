import { Component, createElement } from "react"
const { assign, keys } = Object

function getDisplayName (WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export function sync(mapFirebaseToProps, mergeProps) {
  if (!mapFirebaseToProps) {
    mapFirebaseToProps = function () {
      return {}
    }
  }
  
  return function(WrappedComponent) {
    class Sync extends Component {
      componentWillMount() {
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
      
      setFirebase(key, value) {
        let firebase = assign({}, this.state.firebase)
        if (value) {
          firebase[key] = value
        } else {
          delete firebase[key]
        }
        this.setState({ firebase })
      }
      
      subscribe(props) {
        this.firebases = mapFirebaseToProps(props)
        this.callbacks = {}
        keys(this.firebases).forEach(key => {
          this.subscribeKey(key)
        })
      }
      
      subscribeKey(key) {
        const callback = (snap) => {
          this.setFirebase(key, snap.val())
        }
        this.callbacks[key] = callback
        this.firebases[key].on("value", callback)
      }
      
      unsubscribe() {
        keys(this.firebases).forEach(key => {
          this.unsubscribeKey(key)
        })
        delete this.firebases
        delete this.callbacks
        this.setState({ firebase: {} })
      }
      
      unsubscribeKey(key) {
        this.firebases[key].off("value", this.callbacks[key])
        delete this.firebases[key]
        delete this.callbacks[key]
        this.setFirebase(key, {})
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
