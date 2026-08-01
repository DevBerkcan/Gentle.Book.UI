// Global Vitest setup. Runs for every test file, including node-environment ones —
// keep this side-effect-free for anything that doesn't render JSX.
// No JSX syntax here on purpose: this file goes through Vite's SSR transform pipeline for
// setupFiles, which (unlike the test-file pipeline) doesn't reliably parse .tsx JSX.
import { createElement } from "react";
import { vi } from "vitest";

// next/image does srcSet/loader work that only makes sense inside a real Next.js build;
// every booking template already passes `unoptimized`, so a plain <img> is a faithful stand-in.
function MockNextImage(props: Record<string, unknown>) {
  const rest = { ...props };
  delete rest.unoptimized;
  return createElement("img", rest);
}

vi.mock("next/image", () => ({ default: MockNextImage }));
