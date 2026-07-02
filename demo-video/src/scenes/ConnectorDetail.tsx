import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { AppFrame } from "../components/AppFrame";
import { Card, Pill, CheckIcon, Spinner } from "../components/ui";
import { Cursor, type CursorStop } from "../lib/cursor";
import { enter, prog, pop } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import {
  CONTENT_X,
  PAD_TOP,
  CARD_TOP,
  LEFT_W,
  RIGHT_X,
  RIGHT_W,
  CARD_PAD_X,
} from "../lib/layout";

export type DetailTimings = {
  orgFocus: number;
  orgType: number;
  keyFocus: number;
  keyType: number;
  connectClick: number;
  connected: number;
};

/* Tight pacing for a short-form clip: typing starts immediately. */
const FAST: DetailTimings = {
  orgFocus: 14,
  orgType: 18,
  keyFocus: 62,
  keyType: 66,
  connectClick: 116,
  connected: 146,
};

const T = FAST;

const ORG_VALUE = "meridian-industries";
const KEY_DOTS = 22;

/* Vertical layout inside the connection card. */
const STATUS_Y = CARD_TOP + 56;
const FIELD1_Y = STATUS_Y + 74;
const FIELD_H = 104;
const FIELD2_Y = FIELD1_Y + FIELD_H;
const BUTTON_Y = FIELD2_Y + FIELD_H + 18;

const INPUT_CX = CONTENT_X + LEFT_W / 2;
const BUTTON_CX = CONTENT_X + CARD_PAD_X + 92;
const BUTTON_CY = BUTTON_Y + 27;

const STOPS: CursorStop[] = [
  { at: 0, x: 1620, y: 460 },
  { at: T.orgFocus, x: INPUT_CX, y: FIELD1_Y + 66, click: true },
  { at: T.keyFocus - 8, x: INPUT_CX, y: FIELD1_Y + 66 },
  { at: T.keyFocus, x: INPUT_CX, y: FIELD2_Y + 66, click: true },
  { at: T.connectClick, x: BUTTON_CX, y: BUTTON_CY, click: true },
  { at: T.connectClick + 40, x: BUTTON_CX + 260, y: BUTTON_CY + 40 },
];

const DETECTS = [
  "Disabled accounts still holding seats",
  "Seats with no matching directory account",
  "Seats inactive past your threshold",
];

export const ConnectorDetail: React.FC = () => {
  const frame = useCurrentFrame();

  const orgChars = Math.round(
    interpolate(frame, [T.orgType, T.orgType + 32], [0, ORG_VALUE.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const keyChars = Math.round(
    interpolate(frame, [T.keyType, T.keyType + 30], [0, KEY_DOTS], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const connecting = frame >= T.connectClick + 3 && frame < T.connected;
  const connected = frame >= T.connected;
  const connectedPop = pop(frame, 30, T.connected);
  const caretOn = Math.floor(frame / 16) % 2 === 0;

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    marginTop: 10,
    height: 52,
    display: "flex",
    alignItems: "center",
    borderRadius: 12,
    border: `1px solid ${focused ? C.ink : C.line}`,
    boxShadow: focused ? `0 0 0 2px ${C.brandSoft}` : undefined,
    background: C.card,
    padding: "0 18px",
    fontFamily: FONT.mono,
    fontSize: 17,
    color: C.ink,
  });

  return (
    <>
      <AppFrame activeChild="Atlassian">
        {/* Breadcrumb + heading */}
        <div style={{ position: "absolute", left: CONTENT_X, top: PAD_TOP, ...enter(frame, 0) }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
            Settings / Connectors / Atlassian
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: FONT.sans,
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: C.ink,
            }}
          >
            Atlassian connector
          </div>
        </div>

        {/* Connection card */}
        <div
          style={{
            position: "absolute",
            left: CONTENT_X,
            top: CARD_TOP,
            width: LEFT_W,
            ...enter(frame, 10),
          }}
        >
          <Card title="Connection">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `18px ${CARD_PAD_X}px 0`,
              }}
            >
              <span style={{ fontFamily: FONT.sans, fontSize: 18, color: C.inkFaint }}>
                Status
              </span>
              <span style={{ transform: `scale(${connected ? 0.9 + 0.1 * connectedPop : 1})` }}>
                <Pill tone={connected ? "good" : "outline"}>
                  {connected ? "Connected" : "Not connected"}
                </Pill>
              </span>
            </div>

            {connected ? (
              <div style={{ padding: `22px ${CARD_PAD_X}px 18px`, ...enter(frame, T.connected + 4) }}>
                <div style={{ fontFamily: FONT.sans, fontSize: 20, fontWeight: 500, color: C.ink }}>
                  214 Jira and Confluence seats
                </div>
                <div style={{ marginTop: 8, fontFamily: FONT.sans, fontSize: 16, color: C.inkFaint }}>
                  First sync complete - synced just now
                </div>
                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${C.lineStrong}`,
                      padding: "12px 22px",
                      fontFamily: FONT.sans,
                      fontSize: 16,
                      fontWeight: 500,
                      color: C.inkSoft,
                    }}
                  >
                    Sync now
                  </div>
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${C.line}`,
                      padding: "12px 22px",
                      fontFamily: FONT.sans,
                      fontSize: 16,
                      color: C.dangerText,
                    }}
                  >
                    Disconnect
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: `16px ${CARD_PAD_X}px 14px` }}>
                <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
                  Organization ID
                </div>
                <div style={inputStyle(frame >= T.orgFocus && frame < T.keyFocus)}>
                  {ORG_VALUE.slice(0, orgChars)}
                  {frame >= T.orgFocus && frame < T.keyFocus && caretOn && (
                    <span style={{ color: C.brandText }}>|</span>
                  )}
                </div>

                <div style={{ marginTop: 20, fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
                  API key
                </div>
                <div style={inputStyle(frame >= T.keyFocus && frame < T.connectClick)}>
                  <span style={{ letterSpacing: 3 }}>{"•".repeat(keyChars)}</span>
                  {frame >= T.keyFocus && frame < T.connectClick && caretOn && (
                    <span style={{ color: C.brandText }}>|</span>
                  )}
                </div>

                <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      borderRadius: 12,
                      background: C.brandStrong,
                      padding: "13px 26px",
                      fontFamily: FONT.sans,
                      fontSize: 17,
                      fontWeight: 500,
                      color: "#ffffff",
                      opacity: connecting ? 0.85 : 1,
                    }}
                  >
                    {connecting && <Spinner angle={frame * 14} color="#ffffff" size={17} />}
                    {connecting ? "Connecting" : "Connect"}
                  </div>
                  <span style={{ fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
                    Credentials are stored encrypted
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* What it detects */}
        <div
          style={{
            position: "absolute",
            left: RIGHT_X,
            top: CARD_TOP,
            width: RIGHT_W,
            ...enter(frame, 18),
          }}
        >
          <Card title="What it detects">
            <div style={{ padding: `10px ${CARD_PAD_X}px 12px` }}>
              {DETECTS.map((d, i) => {
                const p = connected ? pop(frame, 30, T.connected + 8 + i * 6) : 0;
                return (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        display: "inline-flex",
                        justifyContent: "center",
                        transform: `scale(${connected ? p : 1})`,
                      }}
                    >
                      {connected ? (
                        <CheckIcon />
                      ) : (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: C.lineStrong,
                          }}
                        />
                      )}
                    </span>
                    <span style={{ fontFamily: FONT.sans, fontSize: 17, color: C.inkSoft }}>
                      {d}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.line}`,
                  fontFamily: FONT.sans,
                  fontSize: 15,
                  color: C.inkFaint,
                  lineHeight: 1.5,
                }}
              >
                Findings from every connector land in the same waste ledger,
                priced with your license costs.
              </div>
            </div>
          </Card>
        </div>
      </AppFrame>

      <Cursor frame={frame} stops={STOPS} />
    </>
  );
};
