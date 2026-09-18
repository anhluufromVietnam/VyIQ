class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0]) {
      this.port.postMessage(new Float32Array(input[0])) // ✅ Cast to Float32Array
    }
    return true
  }
}
registerProcessor("pcm-processor", PCMProcessor)
