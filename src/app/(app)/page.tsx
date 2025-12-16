"use client";

import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { CommandMenu } from "@/components/canvas/command-menu";

export default function CanvasPage() {
  return (
    <>
      <InfiniteCanvas />
      <CommandMenu />
    </>
  );
}
