export function GentleBookMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="19" r="11.5" stroke="#6355E4" strokeWidth="5" />
      <path
        d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6"
        stroke="#6355E4"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="34.6" cy="10.4" r="3.1" fill="#17A398" />
    </svg>
  );
}

export function GentleBookWordmark({ height = 40 }: { height?: number }) {
  const width = Math.round(height * (210 / 56));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 210 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(2 8) scale(0.92)">
        <circle cx="24" cy="19" r="11.5" stroke="#6355E4" strokeWidth="5" />
        <path
          d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6"
          stroke="#6355E4"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="34.6" cy="10.4" r="3.1" fill="#17A398" />
      </g>
      <text
        x="46"
        y="37"
        fontFamily="'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif"
        fontWeight="700"
        fontSize="30"
        letterSpacing="-0.8"
        fill="#14162B"
      >
        gentlebook
      </text>
    </svg>
  );
}
