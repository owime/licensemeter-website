import React from "react";
import { C, FONT, SHADOW } from "../lib/theme";
import {
  CARD_HEADER_H,
  CARD_PAD_X,
  CARD_PAD_BOTTOM,
  ROW_H,
} from "../lib/layout";

export const Card: React.FC<{
  title: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}> = ({ title, style, children, headerRight }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 20,
      boxShadow: SHADOW.card,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: CARD_HEADER_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${CARD_PAD_X}px`,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span
        style={{
          fontFamily: FONT.sans,
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.inkFaint,
        }}
      >
        {title}
      </span>
      {headerRight}
    </div>
    <div style={{ paddingBottom: CARD_PAD_BOTTOM }}>{children}</div>
  </div>
);

export const Row: React.FC<{
  label: string;
  children: React.ReactNode;
  height?: number;
}> = ({ label, children, height = ROW_H }) => (
  <div
    style={{
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `0 ${CARD_PAD_X}px`,
      fontFamily: FONT.sans,
    }}
  >
    <span style={{ fontSize: 18, color: C.inkFaint }}>{label}</span>
    {children}
  </div>
);

export const Pill: React.FC<{
  tone: "good" | "outline" | "brand" | "waste" | "slate";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ tone, children, style }) => {
  const tones: Record<string, React.CSSProperties> = {
    good: { background: C.goodSoft, color: C.goodText },
    brand: { background: C.brandSoft, color: C.brandDeep },
    waste: { background: C.wasteSoft, color: C.wasteDeep },
    slate: { background: C.slateSoft, color: C.slateInk },
    outline: {
      background: "transparent",
      color: C.inkSoft,
      border: `1px solid ${C.lineStrong}`,
    },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "5px 14px",
        fontFamily: FONT.sans,
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const MicroButton: React.FC<{
  children: React.ReactNode;
  highlighted?: boolean;
}> = ({ children, highlighted }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 10,
      border: `1px solid ${highlighted ? C.brand : C.line}`,
      background: highlighted ? C.brandSoft : "transparent",
      padding: "7px 14px",
      fontFamily: FONT.sans,
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: highlighted ? C.brandDeep : C.inkSoft,
    }}
  >
    {children}
  </span>
);

export const SelectBox: React.FC<{
  value: string;
  width?: number;
  focused?: boolean;
}> = ({ value, width = 190, focused }) => (
  <div
    style={{
      width,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: `1px solid ${focused ? C.ink : C.line}`,
      background: C.card,
      borderRadius: 10,
      padding: "9px 14px",
      fontFamily: FONT.sans,
      fontSize: 17,
      color: C.ink,
      boxShadow: focused ? `0 0 0 2px ${C.brandSoft}` : undefined,
    }}
  >
    {value}
    <svg width={14} height={14} viewBox="0 0 16 16">
      <path
        d="M4 6l4 4 4-4"
        stroke={C.inkFaint}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export const Toggle: React.FC<{ on: boolean; pop?: number }> = ({
  on,
  pop = 1,
}) => (
  <div
    style={{
      width: 52,
      height: 30,
      borderRadius: 999,
      background: on ? C.brandStrong : C.lineStrong,
      position: "relative",
      transition: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 3,
        left: on ? 25 : 3,
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(12,26,23,0.3)",
        transform: `scale(${0.85 + 0.15 * pop})`,
      }}
    />
  </div>
);

export const StatusDot: React.FC<{ tone: "good" | "gold" | "unknown" }> = ({
  tone,
}) => (
  <span
    style={{
      display: "inline-block",
      width: 12,
      height: 12,
      borderRadius: "50%",
      background:
        tone === "good" ? C.good : tone === "gold" ? C.waste : C.lineStrong,
    }}
  />
);

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = C.good,
}) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path
      d="M4 10.5l4 4 8-9"
      stroke={color}
      strokeWidth={2.2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Spinner: React.FC<{ angle: number; size?: number; color?: string }> = ({
  angle,
  size = 18,
  color = C.wasteText,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    style={{ transform: `rotate(${angle}deg)` }}
  >
    <circle
      cx="10"
      cy="10"
      r="7.5"
      stroke={color}
      strokeWidth={2.4}
      fill="none"
      strokeDasharray="33 14"
      strokeLinecap="round"
    />
  </svg>
);
