"use client";

import { useState } from "react";
import { DEVICE_COLOR } from "@/lib/map-style";

/** Break a short message into lines of at most `max` characters, on word
 *  boundaries, so an SVG tooltip can render it without measuring text. */
function wrapText(text: string, max = 22): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * A device parked at an endpoint, transferring — drawn as a drive/box badge on
 * a short stem so it reads as "the physical device has stopped here", offset
 * clear of the city label, with a hover tooltip that says what it's doing.
 */
export function DeviceStop({
  x,
  y,
  badgeBelow,
  message,
  reduce,
}: {
  x: number;
  y: number;
  /** Drop the badge below the node (when the city label sits above it). */
  badgeBelow: boolean;
  message?: string;
  reduce: boolean;
}) {
  const [hover, setHover] = useState(false);

  const bx = x + 8;
  const by = badgeBelow ? y + 12 : y - 12;

  const lines = message ? wrapText(message) : [];
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const tw = longest * 3.9 + 12;
  const th = lines.length * 8.5 + 8;
  const ttY = badgeBelow ? by + 7 : by - 7 - th;

  return (
    <g
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: "default" }}
    >
      {!reduce && (
        <circle cx={x} cy={y} r={5} fill="none" stroke={DEVICE_COLOR} strokeOpacity={0.7} strokeWidth={0.9} vectorEffect="non-scaling-stroke">
          <animate attributeName="r" values="4;10;4" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.7;0;0.7" dur="2.2s" repeatCount="indefinite" />
        </circle>
      )}
      <line x1={x} y1={y} x2={bx} y2={by} stroke={DEVICE_COLOR} strokeOpacity={0.75} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <g transform={`translate(${bx} ${by})`}>
        <rect x={-5.6} y={-4.2} width={11.2} height={8.4} rx={1.6} fill="#0b1020" stroke={DEVICE_COLOR} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        <rect x={-3.5} y={-1.4} width={7} height={2.8} rx={0.8} fill={DEVICE_COLOR} />
        {/* A larger transparent target so the badge is easy to hover. */}
        <rect x={-9} y={-9} width={18} height={18} fill="transparent" />
      </g>

      {hover && lines.length > 0 && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={bx - tw / 2}
            y={ttY}
            width={tw}
            height={th}
            rx={3}
            fill="#0b1020"
            stroke={DEVICE_COLOR}
            strokeOpacity={0.55}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
          {lines.map((l, i) => (
            <text
              key={i}
              x={bx}
              y={ttY + 9.5 + i * 8.5}
              textAnchor="middle"
              fontSize={6.6}
              fontWeight={500}
              fill="#e8f6ff"
            >
              {l}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

/** The tooltip copy for a device parked at one end of a lane. */
export function deviceMessage(role: "source" | "destination", label?: string): string {
  const where = label ?? (role === "source" ? "the source" : "the destination");
  return role === "source"
    ? `Your device is at ${where}, loading your data`
    : `Your device is at ${where}, uploading your data to the cloud`;
}
