
import { useEffect, useState } from "react";
import SpendWiseLogo from "./SpendWiseLogo";

const loaderStyles = `
  @keyframes sw-loader-exit {
    to {
      opacity: 0;
      visibility: hidden;
    }
  }

  @keyframes sw-loader-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes sw-loader-wallet {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-3px) scale(1.025); }
  }

  @keyframes sw-loader-wordmark {
    from { opacity: 0; transform: translateY(7px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sw-page-loader {
    opacity: 1;
    visibility: visible;
  }

  .sw-page-loader-exit {
    animation: sw-loader-exit 350ms ease forwards;
    pointer-events: none;
  }

  .sw-loader-orbit {
    position: absolute;
    inset: -17px;
    width: calc(100% + 34px);
    height: calc(100% + 34px);
    overflow: visible;
    animation: sw-loader-orbit 2.4s linear infinite;
    pointer-events: none;
  }

  .sw-loader-wallet {
    animation: sw-loader-wallet 1.8s ease-in-out infinite;
  }

  .sw-loader-wordmark {
    animation: sw-loader-wordmark 500ms 180ms ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    .sw-page-loader-exit {
      animation-duration: 1ms;
    }

    .sw-loader-orbit,
    .sw-loader-wallet,
    .sw-loader-wordmark {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

function OrbitArcs() {
  return (
    <svg
      className="sw-loader-orbit"
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M43 52 A61 61 0 0 1 63 35"
        stroke="#0BB079"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M94 29 A61 61 0 0 1 116 34"
        stroke="#0BB079"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M145 65 A61 61 0 0 1 151 91"
        stroke="#0BB079"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M119 145 A61 61 0 0 1 92 151"
        stroke="#0BB079"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M35 113 A61 61 0 0 1 29 91"
        stroke="#0BB079"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PageLoader({
  message = "Getting your finances ready...",
  duration = 3200,
  onComplete,
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, duration);

    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, duration + 350);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`sw-page-loader fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-white ${
        isExiting ? "sw-page-loader-exit" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading SpendWise"
      aria-hidden={isExiting}
    >
      <style>{loaderStyles}</style>

      <div className="flex flex-col items-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <OrbitArcs />

          <div className="sw-loader-wallet relative z-10">
            <SpendWiseLogo variant="icon" size={104} />
          </div>
        </div>

        <div className="sw-loader-wordmark mt-3">
          <div className="text-center text-[32px] font-extrabold leading-tight tracking-tight">
            <span className="text-[#0C1A33]">Spend</span>
            <span className="text-[#0BB079]">Wise</span>
          </div>

          <p className="mt-3 text-center text-sm text-[#475569]">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
