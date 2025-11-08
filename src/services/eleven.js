// services/elevenlabsService.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

class ElevenLabsService {
  constructor(apiKey) {
    // Support Vite environment variables
    const key = apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.ELEVENLABS_API_KEY;
    
    if (!key) {
      console.warn("Missing ELEVENLABS_API_KEY. Text-to-speech will be disabled.");
      this.client = null;
      return;
    }

    this.client = new ElevenLabsClient({ apiKey: key });
  }

  /**
   * Convert text to speech and return audio buffer
   * @param {string} voiceId - ElevenLabs voice ID
   * @param {string} text - Text to convert
   * @param {object} options - Additional options (modelId, retries, timeout)
   * @returns {Promise<ArrayBuffer>}
   */
  async textToSpeech(voiceId, text, options = {}) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized. Check your API key.");
    }

    const {
      modelId = "eleven_multilingual_v2",
      maxRetries = 2,
      timeoutInSeconds = 60,
    } = options;

    try {
      const audio = await this.client.textToSpeech.convert(
        voiceId,
        { text, modelId },
        { maxRetries, timeoutInSeconds }
      );
      return audio;
    } catch (err) {
      console.error("[ElevenLabsService] textToSpeech error:", err.message);
      throw err;
    }
  }

  /**
   * Convert ReadableStream to ArrayBuffer
   * @param {ReadableStream} stream - The stream to convert
   * @returns {Promise<ArrayBuffer>}
   */
  async streamToArrayBuffer(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalLength += value.length;
    }

    // Combine all chunks into a single ArrayBuffer
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  /**
   * Play audio in browser using HTML5 Audio API
   * @param {ArrayBuffer|Uint8Array|ReadableStream} audioBuffer - Audio buffer from textToSpeech
   * @returns {Promise<void>}
   */
  async playAudioInBrowser(audioBuffer) {
    return new Promise(async (resolve, reject) => {
      try {
        let buffer;
        
        // Handle ReadableStream
        if (audioBuffer instanceof ReadableStream) {
          buffer = await this.streamToArrayBuffer(audioBuffer);
        }
        // Convert to ArrayBuffer if needed (browser environment)
        else if (audioBuffer instanceof ArrayBuffer) {
          buffer = audioBuffer;
        } else if (audioBuffer instanceof Uint8Array) {
          buffer = audioBuffer.buffer.slice(
            audioBuffer.byteOffset, 
            audioBuffer.byteOffset + audioBuffer.byteLength
          );
        } else if (audioBuffer && audioBuffer.buffer instanceof ArrayBuffer) {
          // Handle other TypedArray types
          buffer = audioBuffer.buffer.slice(
            audioBuffer.byteOffset || 0,
            (audioBuffer.byteOffset || 0) + (audioBuffer.byteLength || audioBuffer.length)
          );
        } else {
          // Try to use as-is
          buffer = audioBuffer;
        }

        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        };
        
        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert text to speech and play it in the browser
   * @param {string} voiceId - ElevenLabs voice ID
   * @param {string} text - Text to convert and play
   * @param {object} options - Additional options
   * @returns {Promise<void>}
   */
  async speak(voiceId, text, options = {}) {
    // Return early if client is not initialized (no API key)
    if (!this.client) {
      console.warn("[ElevenLabsService] Cannot speak: API key not configured");
      return;
    }

    try {
      const audioBuffer = await this.textToSpeech(voiceId, text, options);
      console.log("[ElevenLabsService] Audio buffer type:", audioBuffer?.constructor?.name, audioBuffer);
      await this.playAudioInBrowser(audioBuffer);
    } catch (err) {
      console.error("[ElevenLabsService] speak error:", err.message);
      throw err;
    }
  }
}

// Export a singleton instance for convenience
// Initialize with API key from environment
const elevenLabsService = new ElevenLabsService();
export default elevenLabsService;
