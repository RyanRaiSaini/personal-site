"use client";

import dynamic from "next/dynamic";

// The 3D world is browser-only and heavy, so it loads after the page's
// text and never runs on the server.
const World3D = dynamic(() => import("./World3D"), { ssr: false });

export default function WorldShell() {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0">
      <World3D />
    </div>
  );
}
