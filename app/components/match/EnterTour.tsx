"use client";

import { useRouter } from "next/navigation";
import { useWorld } from "../../lib/store";

// The button at the end of the match view that opens the 3D stadium,
// and remembers that this visitor wants it
export default function EnterTour({ className = "btn btn-primary" }: { className?: string }) {
  const router = useRouter();
  const enter = () => {
    try {
      localStorage.setItem("view", "tour");
    } catch {
      // Not remembered in private browsing
    }
    useWorld.getState().setMode("tour");
    router.push("/");
  };
  return (
    <button type="button" className={className} onClick={enter}>
      Enter the 3D stadium
    </button>
  );
}
