import React from "react";
import { useCurrentFrame } from "remotion";
import { AppFrame } from "../components/AppFrame";
import { Card, Pill, CheckIcon } from "../components/ui";
import { Cursor, type CursorStop } from "../lib/cursor";
import { enter, prog } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import { CONTENT_X, CONTENT_W, PAD_TOP, CARD_PAD_X } from "../lib/layout";
import { euros } from "../lib/format";

/* Interaction timeline. */
const T = {
  filterClick: 48,
  filtered: 60,
  check1: 108,
  check2: 136,
  ackClick: 190,
  acked: 206,
} as const;

type Finding = {
  chip: string;
  chipTone: { bg: string; fg: string };
  name: string;
  upn: string;
  cents: number;
  firstSeen: string;
};

const DANGER = { bg: C.dangerSoft, fg: C.dangerText };
const GOLD = { bg: C.goldSoft, fg: C.gold };
const PLUM = { bg: "#f1e9ff", fg: "#7c3aed" };

const ALL_ROWS: Finding[] = [
  { chip: "Disabled", chipTone: DANGER, name: "Disabled account still licensed: Clara Becker", upn: "clara.becker@meridian.example", cents: 5999, firstSeen: "27 Apr 2026" },
  { chip: "Disabled", chipTone: DANGER, name: "Disabled account still licensed: David Hoffmann", upn: "david.hoffmann@meridian.example", cents: 5999, firstSeen: "03 May 2026" },
  { chip: "Disabled", chipTone: DANGER, name: "Disabled account still licensed: Yusuf Wagner", upn: "yusuf.wagner@meridian.example", cents: 7230, firstSeen: "07 Feb 2026" },
  { chip: "Inactive", chipTone: GOLD, name: "No activity for 95 days: Felix Hoffmann", upn: "felix.hoffmann@meridian.example", cents: 1499, firstSeen: "12 May 2026" },
  { chip: "Copilot idle", chipTone: PLUM, name: "Copilot seat unused: Jonas Maier", upn: "jonas.maier@meridian.example", cents: 3000, firstSeen: "18 May 2026" },
  { chip: "Inactive", chipTone: GOLD, name: "No activity for 112 days: Katrin Hoffmann", upn: "katrin.hoffmann@meridian.example", cents: 1499, firstSeen: "29 Apr 2026" },
];

const DISABLED_ROWS = ALL_ROWS.slice(0, 3);

const FILTERS = [
  "All active (65)",
  "Disabled (8)",
  "Never active (6)",
  "Inactive (12)",
  "Shelfware (1)",
  "Copilot idle (14)",
  "Guest (3)",
  "Resolved",
];

const FILTERS_TOP = PAD_TOP + 104;
const TABLE_TOP = FILTERS_TOP + 64;
const ROW_H = 72;
const HEAD_H = 46;

/* Cursor targets. "Disabled (8)" chip x: measured after "All active (65)". */
const CHIP_X = CONTENT_X + 175 + 78;
const CHIP_Y = FILTERS_TOP + 21;
const CHECK_X = CONTENT_X + CARD_PAD_X + 11;
const rowCY = (i: number) => TABLE_TOP + 56 + HEAD_H + i * ROW_H + ROW_H / 2;
const ACK_X = CONTENT_X + CONTENT_W - 120;
const ACK_Y = PAD_TOP + 30;

const STOPS: CursorStop[] = [
  { at: 0, x: 1360, y: 640 },
  { at: T.filterClick, x: CHIP_X, y: CHIP_Y, click: true },
  { at: T.check1, x: CHECK_X, y: rowCY(0), click: true },
  { at: T.check2, x: CHECK_X, y: rowCY(1), click: true },
  { at: T.ackClick, x: ACK_X, y: ACK_Y, click: true },
  { at: T.ackClick + 34, x: ACK_X - 130, y: ACK_Y + 130 },
];

const Checkbox: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    style={{
      width: 22,
      height: 22,
      borderRadius: 6,
      border: `1.5px solid ${checked ? C.brandStrong : C.lineStrong}`,
      background: checked ? C.brandStrong : C.card,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {checked && <CheckIcon size={14} color="#ffffff" />}
  </span>
);

/**
 * Short-form clip of the Findings page: filter to Disabled, select two
 * findings, acknowledge them in bulk.
 */
export const FindingsClip: React.FC = () => {
  const frame = useCurrentFrame();
  const filtered = frame >= T.filtered;
  const rows = filtered ? DISABLED_ROWS : ALL_ROWS;
  const swap = filtered ? prog(frame, T.filtered, 10) : 1;
  const selCount = (frame >= T.check1 + 2 ? 1 : 0) + (frame >= T.check2 + 2 ? 1 : 0);
  const acked = frame >= T.acked;

  const isChecked = (i: number) =>
    !acked &&
    ((i === 0 && frame >= T.check1 + 2) || (i === 1 && frame >= T.check2 + 2));

  return (
    <>
      <AppFrame active="Findings">
        {/* Header */}
        <div style={{ position: "absolute", left: CONTENT_X, top: PAD_TOP, ...enter(frame, 0) }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 42, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink }}>
            Findings
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT.sans, fontSize: 16, color: C.inkFaint }}>
            65 findings worth 2.979,86 €/mo
          </div>
        </div>

        {/* Bulk bar / actions, top right */}
        <div
          style={{
            position: "absolute",
            left: CONTENT_X + CONTENT_W - 480,
            top: PAD_TOP + 6,
            width: 480,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 16,
          }}
        >
          {acked ? (
            <span
              style={{
                fontFamily: FONT.sans,
                fontSize: 16,
                color: C.goodText,
                fontWeight: 500,
                ...enter(frame, T.acked, 10, 6),
              }}
            >
              2 findings acknowledged
            </span>
          ) : (
            <>
              {selCount > 0 && (
                <span
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 16,
                    color: C.inkSoft,
                    fontVariantNumeric: "tabular-nums",
                    ...enter(frame, T.check1 + 2, 8, 4),
                  }}
                >
                  {selCount} selected
                </span>
              )}
              <div
                style={{
                  borderRadius: 12,
                  border: `1px solid ${selCount > 0 ? C.brandStrong : C.line}`,
                  background: selCount > 0 ? C.brandStrong : C.card,
                  padding: "11px 20px",
                  fontFamily: FONT.sans,
                  fontSize: 15,
                  fontWeight: 500,
                  color: selCount > 0 ? "#ffffff" : C.inkFaint,
                  opacity: selCount > 0 ? 1 : 0.6,
                }}
              >
                Acknowledge selected
              </div>
            </>
          )}
        </div>

        {/* Filter chips */}
        <div
          style={{
            position: "absolute",
            left: CONTENT_X,
            top: FILTERS_TOP,
            display: "flex",
            gap: 10,
            ...enter(frame, 8),
          }}
        >
          {FILTERS.map((f) => {
            const isDisabledChip = f.startsWith("Disabled");
            const selected = filtered ? isDisabledChip : f.startsWith("All active");
            const hot = isDisabledChip && frame >= T.filterClick - 8 && !filtered;
            return (
              <span
                key={f}
                style={{
                  borderRadius: 999,
                  padding: "9px 18px",
                  fontFamily: FONT.sans,
                  fontSize: 15,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  background: selected ? C.ink : C.card,
                  color: selected ? C.canvas : C.inkSoft,
                  border: `1px solid ${selected ? C.ink : hot ? C.ink : C.line}`,
                }}
              >
                {f}
              </span>
            );
          })}
        </div>

        {/* Findings table */}
        <div
          style={{
            position: "absolute",
            left: CONTENT_X,
            top: TABLE_TOP,
            width: CONTENT_W,
            ...enter(frame, 14),
          }}
        >
          <Card title={filtered ? "Disabled account still licensed" : "All active findings"}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: HEAD_H,
                padding: `0 ${CARD_PAD_X}px`,
                fontFamily: FONT.sans,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.inkFaint,
              }}
            >
              <span style={{ width: 54 }} />
              <span style={{ width: 160 }}>Rule</span>
              <span style={{ flex: 1 }}>Finding</span>
              <span style={{ width: 140, textAlign: "right" }}>Impact / mo</span>
              <span style={{ width: 170, paddingLeft: 40 }}>First seen</span>
              <span style={{ width: 150 }}>Status</span>
            </div>
            <div style={{ opacity: swap }}>
              {rows.map((r, i) => {
                const checked = isChecked(i);
                const rowAcked = acked && i < 2;
                return (
                  <div
                    key={r.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: ROW_H,
                      padding: `0 ${CARD_PAD_X}px`,
                      borderTop: `1px solid ${C.line}`,
                      background: checked ? C.brandSoft : "transparent",
                      ...(!filtered ? enter(frame, 18 + i * 4, 12, 8) : {}),
                    }}
                  >
                    <span style={{ width: 54 }}>
                      <Checkbox checked={checked} />
                    </span>
                    <span style={{ width: 160 }}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontFamily: FONT.sans,
                          fontSize: 13,
                          fontWeight: 500,
                          background: r.chipTone.bg,
                          color: r.chipTone.fg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.chip}
                      </span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontFamily: FONT.sans,
                          fontSize: 16,
                          color: C.ink,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginTop: 3,
                          fontFamily: FONT.mono,
                          fontSize: 13,
                          color: C.inkFaint,
                        }}
                      >
                        {r.upn}
                      </span>
                    </span>
                    <span
                      style={{
                        width: 140,
                        textAlign: "right",
                        fontFamily: FONT.mono,
                        fontSize: 15.5,
                        color: C.wasteText,
                      }}
                    >
                      {euros(r.cents)} €
                    </span>
                    <span
                      style={{
                        width: 170,
                        paddingLeft: 40,
                        fontFamily: FONT.sans,
                        fontSize: 15,
                        color: C.inkSoft,
                      }}
                    >
                      {r.firstSeen}
                    </span>
                    <span style={{ width: 150 }}>
                      <Pill tone={rowAcked ? "outline" : "brand"}>
                        {rowAcked ? "acknowledged" : "open"}
                      </Pill>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </AppFrame>

      <Cursor frame={frame} stops={STOPS} />
    </>
  );
};
