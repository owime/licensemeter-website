import Image from "next/image";

export const CONNECTOR_BRANDS = [
  { id: "microsoft", name: "Microsoft 365" },
  { id: "adobe", name: "Adobe" },
  { id: "zoom", name: "Zoom" },
  { id: "atlassian", name: "Atlassian" },
  { id: "salesforce", name: "Salesforce" },
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
] as const;

export type ConnectorBrand = (typeof CONNECTOR_BRANDS)[number]["id"];

/** Decorative next to a connector name; no duplicate screen-reader announcement. */
export function ConnectorLogo({
  brand,
  size = 28,
  className = "",
}: {
  brand: ConnectorBrand;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={`/connectors/${brand === "chatgpt" ? "openai" : brand}.svg`}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
