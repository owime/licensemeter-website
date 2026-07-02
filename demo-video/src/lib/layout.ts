/**
 * Fixed layout grid for the app mockup, in composition pixels (1920x1080).
 * Everything the cursor interacts with derives its coordinates from these
 * constants so the pointer choreography stays aligned with the UI.
 */
export const SIDEBAR_W = 300;
export const PAD_X = 72;
export const PAD_TOP = 52;

export const CONTENT_X = SIDEBAR_W + PAD_X; // 372
export const CONTENT_W = 1920 - SIDEBAR_W - PAD_X * 2; // 1476

export const COL_GAP = 40;
export const LEFT_W = 780;
export const RIGHT_W = CONTENT_W - LEFT_W - COL_GAP; // 656
export const RIGHT_X = CONTENT_X + LEFT_W + COL_GAP;

export const H1_BLOCK = 108; // "Settings" heading + breadcrumb space
export const CARD_TOP = PAD_TOP + H1_BLOCK; // 160

export const CARD_HEADER_H = 56;
export const ROW_H = 66;
export const CARD_PAD_X = 28;
export const CARD_PAD_BOTTOM = 14;

/* Workspace card: 6 field rows. */
export const WORKSPACE_ROWS = 6;
export const WORKSPACE_CARD_H =
  CARD_HEADER_H + WORKSPACE_ROWS * ROW_H + CARD_PAD_BOTTOM; // 466

/* Notifications card: 3 toggle rows. */
export const NOTIF_ROWS = 3;
export const NOTIF_CARD_H = CARD_HEADER_H + NOTIF_ROWS * ROW_H + CARD_PAD_BOTTOM; // 268

/* Detection capabilities card: 3 dot rows. */
export const DETECT_CARD_TOP = CARD_TOP + NOTIF_CARD_H + 32;
export const DETECT_CARD_H = CARD_HEADER_H + 3 * ROW_H + CARD_PAD_BOTTOM;

/* Connectors card sits below both columns, full content width. */
export const CONNECTORS_TOP =
  CARD_TOP + Math.max(WORKSPACE_CARD_H, NOTIF_CARD_H + 32 + DETECT_CARD_H) + 40;
export const CONNECTOR_ROW_H = 62;

/* Scroll offset that brings the connectors card near the top of the frame. */
export const SCROLL_TO_CONNECTORS = CONNECTORS_TOP - 150;

/* Y center of workspace field row i (before scroll). */
export const workspaceRowY = (i: number) =>
  CARD_TOP + CARD_HEADER_H + i * ROW_H + ROW_H / 2;

/* Y center of notifications toggle row i. */
export const notifRowY = (i: number) =>
  CARD_TOP + CARD_HEADER_H + i * ROW_H + ROW_H / 2;

/* Y center of connector row i, after scrolling. */
export const connectorRowY = (i: number) =>
  CONNECTORS_TOP - SCROLL_TO_CONNECTORS + CARD_HEADER_H + i * CONNECTOR_ROW_H + CONNECTOR_ROW_H / 2;
