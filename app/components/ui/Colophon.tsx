import { colophon } from "../../data/portfolio";

// The small print: how the site was built, whose work it leans on, and
// that it is a fan project
export default function Colophon({ className = "" }: { className?: string }) {
  return (
    <p className={`max-w-3xl text-xs leading-relaxed ${className}`}>
      {colophon.built} {colophon.credits} {colophon.disclaimer}
    </p>
  );
}
