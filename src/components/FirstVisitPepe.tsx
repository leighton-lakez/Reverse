import { useEffect, useState } from "react";

const FirstVisitPepe = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("hasVisitedBefore");

    if (!hasVisited) {
      // Show Pepe on first visit
      setShow(true);

      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem("hasVisitedBefore", "true");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500"
      onClick={() => {
        setShow(false);
        localStorage.setItem("hasVisitedBefore", "true");
      }}
    >
      <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-700">
        {/* Pepe emoji with glow effect */}
        <div className="text-[120px] animate-bounce" style={{ textShadow: "0 0 40px rgba(255, 215, 0, 0.5)" }}>
          🐸
        </div>
        <p className="text-primary text-2xl font-bold tracking-wider">
          Welcome to REVERSE
        </p>
        <p className="text-muted-foreground text-sm">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
};

export default FirstVisitPepe;
