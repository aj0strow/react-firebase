import EventEmitter from "events"

class MockRef extends EventEmitter {
  off(event, func) {
    if (event && func) {
      this.removeListener(event, func)
    } else if (event) {
      this.removeAllListeners(event)
    } else {
      this.removeAllListeners()
    }
  }
  
  simulate(event, value) {
    const snap = {
      val() { return value }
    }
    this.emit(event, snap)
  }
}

export default MockRef
