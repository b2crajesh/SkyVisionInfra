import type { ReactNode } from "react";
import { useInView } from "../lib/useInView";

export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
