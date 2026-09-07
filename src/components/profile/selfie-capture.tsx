'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api/errors';
import { captureFrame, openFrontCamera, SelfieError, stopStream } from '@/lib/selfie';
import { usersService } from '@/services/users';
import { cn } from '@/lib/utils';

type SelfieCaptureProps = {
  /** Hosted Cloudinary URL once the shot has been uploaded. */
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Live selfie capture: front camera -> canvas -> `POST /upload` -> hosted URL.
 *
 * The photo is uploaded the moment it is taken, exactly like the mobile app,
 * so the parent form can gate its submit on `value` being a real https URL
 * instead of carrying a blob around. There is no file picker: KYC and identity
 * edits require a photo taken now.
 */
export function SelfieCapture({ value, onChange, disabled, className }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }, []);

  // The camera must never outlive the component - an orphaned track keeps the
  // capture light on until the tab is closed.
  useEffect(() => closeCamera, [closeCamera]);

  async function startCamera() {
    setError(null);
    setBusy(true);
    try {
      const stream = await openFrontCamera();
      streamRef.current = stream;
      setLive(true);
      // The element only exists after `live` flips, so attach on the next frame.
      window.requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch (caught) {
      setError(caught instanceof SelfieError ? caught.message : 'Could not open the camera.');
      closeCamera();
    } finally {
      setBusy(false);
    }
  }

  async function takeAndUpload() {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setBusy(true);
    try {
      const file = await captureFrame(video);
      closeCamera();
      const { url } = await usersService.uploadFile(file);
      if (!url) throw new SelfieError('A valid uploaded selfie photo is required');
      onChange(url);
    } catch (caught) {
      setError(
        caught instanceof SelfieError
          ? caught.message
          : getApiErrorMessage(caught, 'Could not upload the photo.'),
      );
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2">
          <Image
            src={value}
            alt="Your live selfie"
            width={56}
            height={56}
            unoptimized
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">Live photo captured.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => {
              onChange(null);
              void startCamera();
            }}
          >
            <RefreshCw aria-hidden="true" />
            Retake
          </Button>
        </div>
      ) : live ? (
        <div className="overflow-hidden rounded-xl border border-border bg-brand-900">
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Camera preview"
            // Mirrored so the preview reads like a mirror; `captureFrame`
            // mirrors the canvas to match.
            className="aspect-square w-full -scale-x-100 object-cover"
          />
          <div className="flex items-center gap-2 bg-card p-2">
            <Button
              type="button"
              className="h-10 flex-1 bg-brand-700 text-white"
              disabled={disabled || busy}
              onClick={() => void takeAndUpload()}
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Camera aria-hidden="true" />}
              {busy ? 'Uploading photo…' : 'Capture'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Close camera"
              disabled={busy}
              onClick={closeCamera}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-start"
          disabled={disabled || busy}
          onClick={() => void startCamera()}
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="text-accent-600" />
          )}
          Take a live photo
        </Button>
      )}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
