import React from "react";

const Sparkline = ({ data, color, label }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col gap-1 opacity-50">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span>{label}</span>
          <span>--</span>
        </div>
        <div className="h-8 flex items-center justify-center border-t border-dashed border-gray-700/30 mt-2">
          <span className="text-[9px] text-gray-500">Awaiting data...</span>
        </div>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 120;
  const padding = 4;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const effectiveHeight = height - padding * 2;
      const y = height - padding - ((val - min) / range) * effectiveHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap = {
    indigo: {
      stroke: "#818cf8",
      text: "text-indigo-400",
      fill: "rgba(129, 140, 248, 0.1)",
    },
    emerald: {
      stroke: "#34d399",
      text: "text-emerald-400",
      fill: "rgba(52, 211, 153, 0.1)",
    },
    orange: {
      stroke: "#fbbf24",
      text: "text-orange-400",
      fill: "rgba(251, 191, 36, 0.1)",
    },
    rose: {
      stroke: "#fb7185",
      text: "text-rose-400",
      fill: "rgba(251, 113, 133, 0.1)",
    },
  };

  const theme = colorMap[color] || colorMap.indigo;

  // Determine unit
  const unit = label.toLowerCase().includes("cpu")
    ? "%"
    : label.toLowerCase().includes("ram")
    ? "MB"
    : "";

  const lastValue = data[data.length - 1];
  const formattedValue =
    typeof lastValue === "number" ? lastValue.toFixed(unit ? 1 : 0) : lastValue;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
          {label}
        </span>
        <span className={`text-sm font-mono font-bold ${theme.text}`}>
          {formattedValue}
          {unit}
        </span>
      </div>
      <div className="relative h-10 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle area fill */}
          <path
            d={`M 0 ${height} L ${points} L ${width} ${height} Z`}
            fill={theme.fill}
          />
          <polyline
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]"
          />
        </svg>
      </div>
    </div>
  );
};

export default Sparkline;
