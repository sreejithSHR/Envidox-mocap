// MotionRecorder.js
export class MotionRecorder {
    constructor(model) {
      this.model = model;
      this.frames = [];
    }
    
    start() { /* ... */ }
    
    captureFrame() {
      const frameData = this.model.getBoneTransforms();
      this.frames.push(frameData);
    }
  }