class StateManager {
    constructor() {
      this.state = {
        shortcutsRegistered: true,
        mainHidden:false
      };
    }
  
    getState() {
      return this.state;
    }
  
    setState(newState) {
      this.state = { ...this.state, ...newState };
    }
  }
  
  module.exports = new StateManager();
  