import { useEffect, useState } from "react";

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + "%",
      animationDuration: Math.random() * 3 + 2 + "s",
      animationDelay: Math.random() * 2 + "s",
      opacity: Math.random(),
      size: Math.random() * 10 + 5 + "px",
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-10px] text-white animate-fall"
          style={{
            left: flake.left,
            fontSize: flake.size,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
          }}
        >
          ❄️
        </div>
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) translateX(0px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) translateX(20px) rotate(360deg);
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
