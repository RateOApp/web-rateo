/**
 * Live selfie capture, the browser equivalent of the mobile app's
 * camera-only `launchCameraAsync({ cameraType: front })`.
 *
 * There is deliberately NO file-upload fallback: a KYC selfie and an
 * identity-edit request must both be a photo taken now, not an image the user
 * already had. `getUserMedia` is the only source.
 *
 * `getUserMedia` needs a secure context (https, or localhost in development).
 */

export const SELFIE_MIME_TYPE = 'image/jpeg';

/** Thrown for every failure so callers can show one message and move on. */
export class SelfieError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SelfieError';
  }
}

/** Whether this browser can capture at all - used to explain rather than fail silently. */
export function cameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

/**
 * Opens the front camera and resolves with the live stream. The caller is
 * responsible for attaching it to a `<video>` and eventually calling
 * `stopStream`.
 */
export async function openFrontCamera(): Promise<MediaStream> {
  if (!cameraSupported()) {
    throw new SelfieError(
      'Your browser cannot access the camera. Try a recent Chrome, Edge or Safari over https.',
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new SelfieError(
        'Camera access is required to take a live selfie. Allow it in your browser and try again.',
      );
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new SelfieError('No camera was found on this device.');
    }
    throw new SelfieError('Could not open the camera. Please try again.');
  }
}

/** Stops every track so the camera light actually goes out. */
export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Grabs the current video frame as a JPEG `File`.
 *
 * The frame is drawn mirrored, matching what the user sees in the preview -
 * an unmirrored capture of a mirrored preview reads as "that isn't me".
 */
export function captureFrame(
  video: HTMLVideoElement,
  fileName = 'selfie.jpg',
  quality = 0.85,
): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    return Promise.reject(new SelfieError('The camera is still starting. Try again in a moment.'));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return Promise.reject(new SelfieError('Could not capture the photo on this device.'));
  }

  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new SelfieError('Could not capture the photo. Please try again.'));
          return;
        }
        resolve(new File([blob], fileName, { type: SELFIE_MIME_TYPE }));
      },
      SELFIE_MIME_TYPE,
      quality,
    );
  });
}
