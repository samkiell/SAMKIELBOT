import { useEffect, useState } from "react";

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    // Reduce particle count slightly for better performance
    const count =
      typeof window !== "undefined" && window.innerWidth < 768 ? 30 : 50;

    const flakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + "%",
      animationDuration: Math.random() * 10 + 10 + "s", // Slower, more elegant
      animationDelay: Math.random() * 5 + "s",
      opacity: Math.random() * 0.5 + 0.1, // Subtle opacity
      size: Math.random() * 3 + 2 + "px", // Smaller, dot-like size
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-10px] bg-indigo-500/30 dark:bg-white rounded-full animate-fall blur-[1px]"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) translateX(0px);
          }
          100% {
            transform: translateY(110vh) translateX(20px);
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
