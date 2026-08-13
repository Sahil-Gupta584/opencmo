interface ShortcutKeyProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShortcutKey({ size = "md", className = "" }: ShortcutKeyProps) {
  const textSize =
    size === "sm" ? "text-[11px]" : size === "lg" ? "text-[15px]" : "text-[12px]";
  const kbdBase = `inline-flex items-center justify-center rounded border border-neutral-200 bg-white shadow-sm text-neutral-700 font-mono px-1.5 py-1 leading-none`;

  return (
    <span className={`inline-flex items-center gap-1 p-1 ${textSize} ${className}`}>
      <kbd className={kbdBase}>⌘</kbd>
      <span className="text-neutral-400 font-normal">+</span>
      <kbd className={kbdBase}>Shift</kbd>
      <span className="text-neutral-400 font-normal">+</span>
      <kbd className={kbdBase}>F</kbd>
    </span>
  );
}