"use client";

export type MapplsSdkGlobal = {
  Map: new (...args: unknown[]) => unknown;
  Marker: new (...args: unknown[]) => unknown;
};

type MapplsWindow = Window &
  typeof globalThis & {
    mappls?: MapplsSdkGlobal;
    Mappls?: MapplsSdkGlobal;
    __propenuMapplsInit?: () => void;
    __propenuMapplsSdkPromise?: Promise<void>;
  };

const MAPPLS_SCRIPT_SELECTOR = "script[data-mappls-sdk='true']";
const MAPPLS_CALLBACK_NAME = "__propenuMapplsInit";

export function getMapplsGlobal<T = MapplsSdkGlobal>() {
  const win = window as MapplsWindow;
  return (win.mappls ?? win.Mappls) as T | undefined;
}

export function loadMapplsScript(apiKey: string) {
  const win = window as MapplsWindow;

  if (getMapplsGlobal()) {
    return Promise.resolve();
  }

  if (win.__propenuMapplsSdkPromise) {
    return win.__propenuMapplsSdkPromise;
  }

  win.__propenuMapplsSdkPromise = new Promise<void>((resolve, reject) => {
    const resolveWhenReady = () => {
      if (getMapplsGlobal()) {
        resolve();
        return true;
      }

      return false;
    };

    if (resolveWhenReady()) return;

    win[MAPPLS_CALLBACK_NAME] = () => {
      resolveWhenReady();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      MAPPLS_SCRIPT_SELECTOR,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolveWhenReady(), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => {
          win.__propenuMapplsSdkPromise = undefined;
          reject(new Error("Failed to load Mappls SDK"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=${MAPPLS_CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.dataset.mapplsSdk = "true";
    script.onload = () => {
      resolveWhenReady();
    };
    script.onerror = () => {
      win.__propenuMapplsSdkPromise = undefined;
      reject(new Error("Failed to load Mappls SDK script."));
    };

    document.head.appendChild(script);
  });

  return win.__propenuMapplsSdkPromise;
}
