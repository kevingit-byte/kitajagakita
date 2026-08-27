"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Wraps the map so a MapLibre GL failure (WebGL unavailable, basemap style
 * unreachable, a third-party library throwing) can never crash the rest of
 * the app - without this, an uncaught error during the map's render commit
 * takes down the whole React tree, silently breaking navigation and every
 * other view, not just the map itself.
 */
export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Peta gagal dimuat:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-neutral-900 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-2xl" aria-hidden>
            🗺️
          </span>
          <p className="text-sm text-neutral-300">Peta tidak dapat dimuat saat ini.</p>
          <p className="text-xs text-neutral-500">
            Data kejadian tetap tersedia di tab Beranda, Sekitar Saya, dan Indonesia.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
