// UNO Reverse Card Style Icon
export const ReverseIcon = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circular background */}
      <circle cx="50" cy="50" r="45" fill="url(#reverseGradient)" opacity="0.2" />

      {/* Top curved arrow */}
      <path
        d="M 30 40 Q 50 25, 70 40"
        stroke="url(#reverseGradient)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Top arrow head */}
      <path
        d="M 70 40 L 65 35 M 70 40 L 65 45"
        stroke="url(#reverseGradient)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Bottom curved arrow */}
      <path
        d="M 70 60 Q 50 75, 30 60"
        stroke="url(#reverseGradient)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom arrow head */}
      <path
        d="M 30 60 L 35 55 M 30 60 L 35 65"
        stroke="url(#reverseGradient)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="reverseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43, 43%, 58%)" />
          <stop offset="100%" stopColor="hsl(350, 59%, 36%)" />
        </linearGradient>
      </defs>
    </svg>
  );
};
