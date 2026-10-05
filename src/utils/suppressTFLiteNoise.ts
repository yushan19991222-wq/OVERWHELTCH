/**
 * Suppresses internal TensorFlow Lite / MediaPipe C++ Wasm informational and delegate logs
 * that Emscripten routes to console.error / console.warn / stderr, which false-triggers error catchers.
 */
export function initTFLiteLogSuppression() {
  if (typeof window === 'undefined') return;

  const isTFLiteNoise = (arg: unknown): boolean => {
    if (typeof arg !== 'string') return false;
    const lower = arg.toLowerCase();
    return (
      arg.includes('Created TensorFlow Lite') ||
      arg.includes('XNNPACK delegate') ||
      arg.includes('TensorFlow Lite') ||
      arg.includes('inference_feedback_manager.cc') ||
      arg.includes('landmark_projection_calculator.cc') ||
      arg.includes('feedback tensors') ||
      arg.includes('NORM_RECT without IMAGE_DIMENSIONS') ||
      arg.includes('WebSocket closed without opened') ||
      lower.includes('xnnpack') ||
      lower.includes('websocket closed') ||
      arg.startsWith('INFO:') ||
      arg.includes('INFO: Created TensorFlow Lite')
    );
  };

  const hasTFLiteNoise = (args: unknown[]): boolean => {
    return args.some(isTFLiteNoise);
  };

  const origError = console.error;
  const origWarn = console.warn;
  const origInfo = console.info;
  const origLog = console.log;

  console.error = (...args: unknown[]) => {
    if (hasTFLiteNoise(args)) {
      return;
    }
    origError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    if (hasTFLiteNoise(args)) {
      return;
    }
    origWarn.apply(console, args);
  };

  console.info = (...args: unknown[]) => {
    if (hasTFLiteNoise(args)) {
      return;
    }
    origInfo.apply(console, args);
  };

  console.log = (...args: unknown[]) => {
    if (hasTFLiteNoise(args)) {
      return;
    }
    origLog.apply(console, args);
  };

  window.addEventListener(
    'error',
    (event) => {
      if (event.message && isTFLiteNoise(event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : reason && typeof reason.message === 'string'
          ? reason.message
          : '';
      if (msg && isTFLiteNoise(msg)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

// Execute immediately upon module import
initTFLiteLogSuppression();
