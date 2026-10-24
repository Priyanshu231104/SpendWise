
import SpendWiseLogo from "./SpendWiseLogo";

function BrandIntroOverlay() {
  return (
    <div
      className="sw-intro-overlay fixed inset-0 z-[100] flex items-center justify-center bg-white"
      role="status"
      aria-label="Loading SpendWise"
    >
      <style>{`
        @keyframes sw-overlay-fade {
          0% { opacity: 1; visibility: visible; }
          78% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }

        @keyframes sw-intro-mark {
          0% { opacity: 0; transform: translateY(12px) scale(.88); }
          35% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .sw-intro-overlay {
          animation: sw-overlay-fade 2.1s ease forwards;
          pointer-events: none;
        }

        .sw-intro-content {
          animation: sw-intro-mark 1.2s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .sw-intro-overlay {
            animation-duration: 0.6s;
          }

          .sw-intro-content {
            animation: none;
          }
        }
      `}</style>

      <div className="sw-intro-content flex flex-col items-center gap-3">
        <SpendWiseLogo size={112} intro loader />
        <p className="text-sm font-medium tracking-wide text-slate-500">
          Your money. Your clarity.
        </p>
      </div>
    </div>
  );
}

export default BrandIntroOverlay;
