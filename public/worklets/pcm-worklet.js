/**
 * PCM AudioWorklet Processor
 *
 * Captures mic audio from AudioContext, converts Float32 samples
 * to Int16 PCM, and posts base64-encoded chunks to the main thread.
 *
 * Input:  Float32Array from getUserMedia (44100Hz or 48000Hz)
 * Output: base64-encoded Int16 PCM at 16kHz (downsampled)
 */

class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = new Float32Array(0);
        // sampleRate is provided by AudioWorkletGlobalScope
        this._inputSampleRate = sampleRate;
        this._targetSampleRate = 16000;
        // How many input samples per output sample
        this._ratio = this._inputSampleRate / this._targetSampleRate;
        // Send a chunk every ~100ms worth of 16kHz samples = 1600 samples
        this._chunkSize = 1600;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0]; // mono

        // Append to buffer
        const newBuf = new Float32Array(this._buffer.length + channelData.length);
        newBuf.set(this._buffer);
        newBuf.set(channelData, this._buffer.length);
        this._buffer = newBuf;

        // Downsample and send chunks
        const samplesNeeded = this._chunkSize * this._ratio;
        while (this._buffer.length >= samplesNeeded) {
            // Downsample from input rate to 16kHz
            const pcm16 = new Int16Array(this._chunkSize);
            for (let i = 0; i < this._chunkSize; i++) {
                const srcIdx = Math.floor(i * this._ratio);
                const sample = Math.max(-1, Math.min(1, this._buffer[srcIdx]));
                pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }

            // Convert Int16Array to base64
            const bytes = new Uint8Array(pcm16.buffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            // btoa is available in AudioWorkletGlobalScope in modern browsers
            // but as a fallback, we'll send the raw bytes and encode in main thread
            this.port.postMessage({
                type: "pcm",
                data: bytes,
            });

            // Shift buffer
            this._buffer = this._buffer.slice(Math.floor(this._chunkSize * this._ratio));
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
