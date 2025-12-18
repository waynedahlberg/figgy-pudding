"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/hooks/use-canvas-store";

// =============================================================================
// CONSTANTS
// =============================================================================

const RULER_SIZE = 20; // pixels
const MAJOR_TICK_INTERVAL = 100; // canvas units
const MINOR_TICK_INTERVAL = 10; // canvas units

// =============================================================================
// TYPES
// =============================================================================

interface RulerProps {
  orientation: "horizontal" | "vertical";
  containerSize: number;
}

interface TickMark {
  position: number; // screen position
  value: number; // canvas coordinate
  isMajor: boolean;
}

// =============================================================================
// RULER COMPONENT
// =============================================================================

export function Ruler({ orientation, containerSize }: RulerProps) {
  const { panX, panY, zoom } = useCanvasStore();

  const pan = orientation === "horizontal" ? panX : panY;

  // Calculate visible tick marks
  const ticks = useMemo(() => {
    const result: TickMark[] = [];

    // Determine tick interval based on zoom level
    // At low zoom, show fewer ticks; at high zoom, show more
    let majorInterval = MAJOR_TICK_INTERVAL;
    let minorInterval = MINOR_TICK_INTERVAL;

    // Adjust intervals based on zoom
    if (zoom < 0.25) {
      majorInterval = 500;
      minorInterval = 100;
    } else if (zoom < 0.5) {
      majorInterval = 200;
      minorInterval = 50;
    } else if (zoom < 1) {
      majorInterval = 100;
      minorInterval = 20;
    } else if (zoom >= 2) {
      majorInterval = 50;
      minorInterval = 10;
    }

    // Calculate the visible range in canvas coordinates
    const startCanvas = -pan / zoom;
    const endCanvas = (containerSize - pan) / zoom;

    // Find the first tick before the visible range
    const firstMajorTick = Math.floor(startCanvas / majorInterval) * majorInterval;

    // Generate major ticks
    for (let canvasPos = firstMajorTick; canvasPos <= endCanvas; canvasPos += majorInterval) {
      const screenPos = canvasPos * zoom + pan;
      if (screenPos >= 0 && screenPos <= containerSize) {
        result.push({
          position: screenPos,
          value: canvasPos,
          isMajor: true,
        });
      }
    }

    // Generate minor ticks
    const firstMinorTick = Math.floor(startCanvas / minorInterval) * minorInterval;
    for (let canvasPos = firstMinorTick; canvasPos <= endCanvas; canvasPos += minorInterval) {
      // Skip if this is also a major tick
      if (canvasPos % majorInterval === 0) continue;

      const screenPos = canvasPos * zoom + pan;
      if (screenPos >= 0 && screenPos <= containerSize) {
        result.push({
          position: screenPos,
          value: canvasPos,
          isMajor: false,
        });
      }
    }

    return result;
  }, [pan, zoom, containerSize]);

  if (orientation === "horizontal") {
    return (
      <div
        className="absolute top-0 left-0 right-0 bg-surface1 border-b border-border-subtle select-none overflow-hidden"
        style={{ height: RULER_SIZE, marginLeft: RULER_SIZE }}
      >
        <svg width="100%" height={RULER_SIZE} className="text-text-muted">
          {ticks.map((tick, index) => (
            <g key={index}>
              {/* Tick line */}
              <line
                x1={tick.position}
                y1={tick.isMajor ? 8 : 14}
                x2={tick.position}
                y2={RULER_SIZE}
                stroke="currentColor"
                strokeWidth={1}
                opacity={tick.isMajor ? 0.6 : 0.3}
              />
              {/* Label for major ticks */}
              {tick.isMajor && (
                <text
                  x={tick.position + 3}
                  y={10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.8}
                >
                  {tick.value}
                </text>
              )}
            </g>
          ))}
          {/* Origin indicator */}
          <line
            x1={panX}
            y1={0}
            x2={panX}
            y2={RULER_SIZE}
            stroke="var(--color-accent)"
            strokeWidth={1}
            opacity={0.8}
          />
        </svg>
      </div>
    );
  }

  // Vertical ruler
  return (
    <div
      className="absolute top-0 left-0 bottom-0 bg-surface1 border-r border-border-subtle select-none overflow-hidden"
      style={{ width: RULER_SIZE, marginTop: RULER_SIZE }}
    >
      <svg width={RULER_SIZE} height="100%" className="text-text-muted">
        {ticks.map((tick, index) => (
          <g key={index}>
            {/* Tick line */}
            <line
              x1={tick.isMajor ? 8 : 14}
              y1={tick.position}
              x2={RULER_SIZE}
              y2={tick.position}
              stroke="currentColor"
              strokeWidth={1}
              opacity={tick.isMajor ? 0.6 : 0.3}
            />
            {/* Label for major ticks */}
            {tick.isMajor && (
              <text
                x={2}
                y={tick.position + 10}
                fontSize={9}
                fill="currentColor"
                opacity={0.8}
                transform={`rotate(-90, 2, ${tick.position + 10})`}
              >
                {tick.value}
              </text>
            )}
          </g>
        ))}
        {/* Origin indicator */}
        <line
          x1={0}
          y1={panY}
          x2={RULER_SIZE}
          y2={panY}
          stroke="var(--color-accent)"
          strokeWidth={1}
          opacity={0.8}
        />
      </svg>
    </div>
  );
}

// =============================================================================
// RULER CORNER (top-left intersection)
// =============================================================================

export function RulerCorner() {
  return (
    <div
      className="absolute top-0 left-0 bg-surface1 border-r border-b border-border-subtle z-10"
      style={{ width: RULER_SIZE, height: RULER_SIZE }}
    />
  );
}

// =============================================================================
// RULERS CONTAINER
// =============================================================================

interface RulersProps {
  width: number;
  height: number;
}

export function Rulers({ width, height }: RulersProps) {
  const { showRulers } = useCanvasStore();

  if (!showRulers) return null;

  return (
    <>
      <RulerCorner />
      <Ruler orientation="horizontal" containerSize={width} />
      <Ruler orientation="vertical" containerSize={height} />
    </>
  );
}

// =============================================================================
// EXPORT RULER SIZE FOR LAYOUT CALCULATIONS
// =============================================================================

export { RULER_SIZE };
