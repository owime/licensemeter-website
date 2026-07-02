import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AppFrame } from "../components/AppFrame";
import { Card, Pill, MicroButton } from "../components/ui";
import { Cursor, type CursorStop } from "../lib/cursor";
import { enter } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import {
  CONTENT_X,
  CONTENT_W,
  CONNECTORS_TOP,
  CONNECTOR_ROW_H,
  CARD_PAD_X,
  SCROLL_TO_CONNECTORS,
  connectorRowY,
} from "../lib/layout";
import { ConnectorDetail } from "./ConnectorDetail";

const CONNECTORS: {
  name: string;
  kind: "API" | "CSV import";
  connected: boolean;
}[] = [
  { name: "Microsoft 365", kind: "API", connected: true },
  { name: "Adobe", kind: "API", connected: true },
  { name: "Zoom", kind: "API", connected: false },
  { name: "Atlassian", kind: "API", connected: false },
  { name: "Salesforce", kind: "API", connected: false },
  { name: "OpenAI", kind: "API", connected: true },
  { name: "Anthropic", kind: "API", connected: false },
  { name: "ChatGPT", kind: "CSV import", connected: true },
  { name: "Claude", kind: "CSV import", connected: false },
];

const CLICK_AT = 46;
const LIST_LEN = 72;
const DETAIL_FROM = 58;
const FADE = 14;

const CONFIGURE_CX = CONTENT_X + CONTENT_W - CARD_PAD_X - 58;
const ATLASSIAN_CY = connectorRowY(3);

const STOPS: CursorStop[] = [
  { at: 0, x: 1460, y: 720 },
  { at: CLICK_AT, x: CONFIGURE_CX, y: ATLASSIAN_CY, click: true },
];

const ConnectorsList: React.FC = () => {
  const frame = useCurrentFrame();
  const atlassianHot = frame >= CLICK_AT - 6;

  return (
    <>
      <AppFrame scrollY={SCROLL_TO_CONNECTORS}>
        <div
          style={{
            position: "absolute",
            left: CONTENT_X,
            top: CONNECTORS_TOP,
            width: CONTENT_W,
          }}
        >
          <Card title="Connectors">
            {CONNECTORS.map((c, i) => {
              const rowIn = enter(frame, 2 + i * 3, 12, 8);
              const hot = c.name === "Atlassian" && atlassianHot;
              return (
                <div
                  key={c.name}
                  style={{
                    height: CONNECTOR_ROW_H,
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${CARD_PAD_X}px`,
                    background: hot ? C.subtle : "transparent",
                    borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                    ...rowIn,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 18,
                      fontWeight: 500,
                      color: C.ink,
                      width: 320,
                    }}
                  >
                    {c.name}
                  </span>
                  <Pill tone={c.kind === "API" ? "slate" : "outline"}>{c.kind}</Pill>
                  <div style={{ flex: 1 }} />
                  <Pill
                    tone={c.connected ? "good" : "outline"}
                    style={{ marginRight: 28 }}
                  >
                    {c.connected ? "Connected" : "Not connected"}
                  </Pill>
                  <MicroButton highlighted={hot}>
                    {c.connected ? "Manage" : "Configure"}
                  </MicroButton>
                </div>
              );
            })}
          </Card>
        </div>
      </AppFrame>
      <Cursor frame={frame} stops={STOPS} />
    </>
  );
};

/**
 * Short-form clip: the connectors list, one click on Atlassian, credentials
 * in, connected. No intro, no outro; ends on the settled connected state.
 */
export const ConnectorsClip: React.FC<{ len: number }> = ({ len }) => {
  const frame = useCurrentFrame();
  const listOpacity = interpolate(
    frame,
    [LIST_LEN - FADE, LIST_LEN],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const detailOpacity = interpolate(
    frame,
    [DETAIL_FROM, DETAIL_FROM + FADE],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <Sequence from={DETAIL_FROM} durationInFrames={len - DETAIL_FROM}>
        <AbsoluteFill style={{ opacity: detailOpacity }}>
          <ConnectorDetail />
        </AbsoluteFill>
      </Sequence>
      <Sequence durationInFrames={LIST_LEN}>
        <AbsoluteFill style={{ opacity: listOpacity }}>
          <ConnectorsList />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
