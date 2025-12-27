import React from "react";

const Sparkline = ({ data, color, label }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 30;
  const width = 100;
  const padding = 2;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const effectiveHeight = height - padding * 2;
      const y = height - padding - ((val - min) / range) * effectiveHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap = {
    indigo: { stroke: "#6366f1", text: "text-indigo-500" },
    emerald: { stroke: "#10b981", text: "text-emerald-500" },
    orange: { stroke: "#f59e0b", text: "text-orange-500" },
  };

  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
        <span>{label}</span>
        <span className={theme.text}>
          {data[data.length - 1]}
          {label === "CPU" ? "%" : label === "RAM" ? "MB" : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8 overflow-visible"
      >
        <polyline
          fill="none"
          stroke={theme.stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
        />
      </svg>
    </div>
  );
};

export default Sparkline;
