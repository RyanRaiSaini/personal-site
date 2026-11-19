import { ImageResponse } from "next/og";
import { profile } from "./data/portfolio";

// The picture shown when a link to the site is shared (LinkedIn,
// messages, Slack): a floodlit pitch with my name on the scoreboard.

export const alt = `${profile.name}: ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, #05070d 0%, #0b1530 46%, #123d22 46%, #1c6b37 100%)",
          color: "#f5f2ea",
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 10, height: 44, background: "#e6c56c" }} />
          <div style={{ fontSize: 26, letterSpacing: 8, color: "#e6c56c", fontWeight: 700 }}>{profile.location.toUpperCase()}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 124, fontWeight: 800, letterSpacing: -3, lineHeight: 1, textTransform: "uppercase" }}>{profile.name}</div>
          <div style={{ marginTop: 22, fontSize: 36, color: "#d7dbe6", maxWidth: 940, lineHeight: 1.25 }}>{profile.headline}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {["Projects", "Experience", "Skills", "Résumé"].map((label) => (
              <div key={label} style={{ border: "2px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "10px 24px", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>A portfolio inside a 3D stadium</div>
        </div>
      </div>
    ),
    size,
  );
}
