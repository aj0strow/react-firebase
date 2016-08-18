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
  
  onAuth(func) {
    this.on("auth", func)
  }
  
  offAuth(func) {
    this.off("auth", func)
  }
  
  toString() {
    return "https://mock.firebaseio.com/"
  }
}

export default MockRef
