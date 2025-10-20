import { useEffect, useState } from "react";
import { ReverseIcon } from "./ReverseIcon";

const FirstVisitReverse = () => {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("hasVisitedBefore");

    if (!hasVisited) {
      // Show Reverse card on first visit
      setShow(true);

      // Trigger animation after a brief delay
      setTimeout(() => setAnimate(true), 100);

      // Hide after 4 seconds to give users more time to enjoy the animation
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem("hasVisitedBefore", "true");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500"
      onClick={() => {
        setShow(false);
        localStorage.setItem("hasVisitedBefore", "true");
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-700">
        {/* UNO Reverse Card with animation */}
        <div
          className={`relative transition-all duration-1000 ${
            animate ? 'rotate-[360deg] scale-100' : 'rotate-0 scale-50'
          }`}
          style={{
            filter: 'drop-shadow(0 0 40px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 80px rgba(212, 175, 55, 0.3))',
          }}
        >
          <div className="relative">
            {/* Glowing ring effect */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse bg-gradient-to-br from-primary via-secondary to-primary"
                 style={{ transform: 'scale(1.3)' }} />

            {/* Card background */}
            <div className="relative bg-gradient-to-br from-primary via-secondary to-primary p-8 rounded-3xl border-4 border-primary/50 shadow-2xl">
              <ReverseIcon className="w-32 h-32 sm:w-40 sm:h-40" />
            </div>
          </div>
        </div>

        {/* Welcome text with gradient */}
        <div className="text-center space-y-3 animate-in slide-in-from-bottom duration-1000">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-gradient">
            REVERSE
          </h1>
          <p className="text-lg sm:text-xl text-primary font-semibold tracking-wide">
            Luxury Fashion Marketplace
          </p>
          <p className="text-muted-foreground text-sm animate-pulse">
            Click anywhere to continue
          </p>
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"
               style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-secondary rounded-full animate-ping opacity-75"
               style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"
               style={{ animationDelay: '1s', animationDuration: '2s' }} />
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-secondary rounded-full animate-ping opacity-75"
               style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
        </div>
      </div>
    </div>
  );
};

export default FirstVisitReverse;
