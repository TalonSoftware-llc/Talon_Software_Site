"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type Frame = {
  demo: boolean;
  contactHref: string;
  href: (path: string) => string;
};

const FrameContext = createContext<Frame | null>(null);

export function FrameProvider({
  demo,
  contactHref,
  prefix,
  children,
}: {
  demo: boolean;
  contactHref: string;
  prefix: string;
  children: ReactNode;
}) {
  const value = useMemo<Frame>(() => {
    const href = (path: string) => {
      if (!prefix) return path;
      if (path === "/") return prefix;
      return `${prefix}${path}`;
    };
    return { demo, contactHref, href };
  }, [demo, contactHref, prefix]);
  return <FrameContext.Provider value={value}>{children}</FrameContext.Provider>;
}

export function useFrame(): Frame {
  const frame = useContext(FrameContext);
  if (!frame) throw new Error("Support screens render inside the workspace frame.");
  return frame;
}
