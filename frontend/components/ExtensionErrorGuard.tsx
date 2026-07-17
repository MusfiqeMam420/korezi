"use client";

import { useEffect } from "react";

function isExtensionFetchError(value: unknown) {
  const text =
    value instanceof Error
      ? `${value.message}\n${value.stack || ""}`
      : typeof value === "string"
      ? value
      : "";

  return text.includes("Failed to fetch") && text.includes("chrome-extension://");
}

export default function ExtensionErrorGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (event.filename?.startsWith("chrome-extension://") && event.message.includes("Failed to fetch")) {
        event.preventDefault();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionFetchError(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
