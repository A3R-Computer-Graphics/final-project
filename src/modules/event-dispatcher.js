class EventDispatcher {
  constructor() {
    this.eventsListeners = {};
  }

  addListener(event, callback) {
    // Check if callback is a function
    if (typeof callback !== 'function') {
      console.error('Callback must be a function')
      return false
    }
    // Check if event is a string
    if (typeof event !== 'string') {
      console.error('Event must be a string')
      return false
    }
    // Create event key if it doesn't exist
    if (this.eventsListeners[event] === undefined) {
      this.eventsListeners[event] = [callback]
    } else {
      this.eventsListeners[event].push(callback)
    }
  }

  removeListener(event, callback) {
    // Check if callback is a function
    if (typeof callback !== 'function') {
      console.error('Callback must be a function')
      return false
    }
    // Check if event is a string
    if (typeof event !== 'string') {
      console.error('Event must be a string')
      return false
    }
    const listeners = this.eventsListeners[event]
    if (listeners === undefined) {
      return
    }
    const callbackIndex = listeners.indexOf(callback)
    if (callbackIndex >= 0) {
      listeners.splice(callbackIndex, 1)
    }
  }

  dispatchEvent(event, ...data) {
    // Check if event exists
    if (this.eventsListeners[event] === undefined) {
      // console.error(`Event ${event} does not exist`)
      return false
    }
    this.eventsListeners[event].forEach(listener => listener.apply(this, data))
  }
}