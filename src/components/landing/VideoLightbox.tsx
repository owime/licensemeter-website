"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Native modal dialog shared by landing-page demo clips. showModal() moves the
 * dialog into the top layer, makes the rest of the page inert, and keeps focus
 * inside until the visitor closes it.
 */
export const VideoLightbox = ({
  open,
  onClose,
  src,
  poster,
  label,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  poster: string;
  label: string;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="backdrop:bg-ink/80 m-0 h-dvh max-h-none w-screen max-w-none overscroll-contain border-0 bg-transparent p-4 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center sm:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="bg-ink/70 text-canvas hover:bg-ink focus-visible:ring-canvas focus-visible:ring-offset-ink absolute top-3 right-3 z-10 flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 sm:top-5 sm:right-5"
      >
        <X className="size-6" aria-hidden="true" />
      </button>
      <div
        className="w-full max-w-6xl"
        onClick={(event) => event.stopPropagation()}
      >
        <video
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          controls
          preload="auto"
          aria-label={label}
          className="shadow-hero block aspect-video w-full rounded-2xl bg-white"
        />
      </div>
    </dialog>
  );
};
