import { FilesetResolver } from '@mediapipe/tasks-vision';

// Shared FilesetResolver Promise to avoid duplicate WASM downloads and compilation collisions
let sharedResolverPromise: Promise<unknown> | null = null;

export async function getSharedVisionFilesetResolver(): Promise<any> {
  if (sharedResolverPromise) {
    return sharedResolverPromise;
  }

  sharedResolverPromise = (async () => {
    try {
      // Primary: matching package.json tasks-vision 1.0.1
      return await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
      );
    } catch (primaryErr) {
      console.warn('Primary WASM CDN failed, attempting fallback resolver:', primaryErr);
      try {
        return await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
      } catch (fallbackErr) {
        console.error('All FilesetResolvers failed:', fallbackErr);
        // Reset promise so subsequent retry can attempt again
        sharedResolverPromise = null;
        throw fallbackErr;
      }
    }
  })();

  return sharedResolverPromise;
}
