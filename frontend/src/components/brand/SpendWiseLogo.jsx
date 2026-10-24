
import { useId } from "react";

const styles = `
  @keyframes sw-wallet-in {
    from { opacity: 0; transform: translateY(7px) scale(.94); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes sw-coin-rise {
    from { opacity: 0; transform: translateY(17px) scale(.7); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes sw-arrow-draw {
    from { opacity: 0; stroke-dashoffset: 180; }
    to { opacity: 1; stroke-dashoffset: 0; }
  }

  @keyframes sw-arrow-head-in {
    from { opacity: 0; transform: translate(-8px, 8px); }
    to { opacity: 1; transform: translate(0, 0); }
  }

  @keyframes sw-leaf-in {
    from { opacity: 0; transform: scale(.25); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes sw-wordmark-in {
    from { opacity: 0; transform: translateX(-5px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .sw-logo-wallet {
    animation: sw-wallet-in 380ms ease-out both;
  }

  .sw-logo-coin {
    transform-box: fill-box;
    transform-origin: center;
    animation: sw-coin-rise 520ms 250ms cubic-bezier(.2,.8,.2,1) both;
  }

  .sw-logo-arrow-line {
    stroke-dasharray: 180;
    stroke-dashoffset: 0;
    animation: sw-arrow-draw 600ms 570ms ease-out both;
  }

  .sw-logo-arrow-head {
    transform-box: fill-box;
    transform-origin: center;
    animation: sw-arrow-head-in 300ms 850ms ease-out both;
  }

  .sw-logo-leaf {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: sw-leaf-in 380ms 850ms ease-out both;
  }

  .sw-logo-wordmark {
    animation: sw-wordmark-in 400ms 850ms ease-out both;
  }

  .sw-logo-link {
    transition: filter 180ms ease;
  }

  
/* Smooth, independent movement for each logo element */
.sw-logo-coin {
  transition: translate 240ms cubic-bezier(.2, .8, .2, 1);
}

.sw-logo-arrow-line,
.sw-logo-arrow-head {
  transition: translate 240ms cubic-bezier(.2, .8, .2, 1);
}

.sw-logo-leaf {
  transition: rotate 240ms cubic-bezier(.2, .8, .2, 1);
}

/* Coin rises slightly out of the wallet */
.sw-logo-link:hover .sw-logo-coin {
  translate: 0 -5px;
}

/* Arrow moves upward to emphasize growth */
.sw-logo-link:hover .sw-logo-arrow-line,
.sw-logo-link:hover .sw-logo-arrow-head {
  translate: 0 -3px;
}

/* Leaf tilts clockwise, slightly downward */
.sw-logo-link:hover .sw-logo-leaf {
  rotate: 8deg;
}

/* Keyboard users get the same effect */
.sw-logo-link:focus-visible .sw-logo-coin {
  translate: 0 -5px;
}

.sw-logo-link:focus-visible .sw-logo-arrow-line,
.sw-logo-link:focus-visible .sw-logo-arrow-head {
  translate: 0 -3px;
}

.sw-logo-link:focus-visible .sw-logo-leaf {
  rotate: 8deg;
}


  .sw-logo-link:focus-visible {
    outline: 3px solid #0BB079;
    outline-offset: 5px;
    border-radius: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    .sw-logo-wallet,
    .sw-logo-coin,
    .sw-logo-arrow-line,
    .sw-logo-arrow-head,
    .sw-logo-leaf,
    .sw-logo-wordmark {
      animation: none !important;
      opacity: 1 !important;
      stroke-dashoffset: 0 !important;
    }

    .sw-logo-coin,
    .sw-logo-arrow-line,
    .sw-logo-arrow-head,
    .sw-logo-leaf {
      transition: none !important;
      translate: none !important;
      rotate: none !important;
    }

    .sw-logo-link {
      transition: none;
    }
  }
`;

function WalletMark({ size = 44 }) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="30 25 150 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="44"
          y1="55"
          x2="118"
          y2="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#12B886" />
          <stop offset="1" stopColor="#087F5B" />
        </linearGradient>
      </defs>

      {/* 1. Wallet back flap and dark body */}
      <g className="sw-logo-wallet">
        <path
          d="M44 58 L112 34 C118 32 123 36 123 42 L123 58 Z"
          fill="#168D70"
        />

        <rect
          x="44"
          y="55"
          width="112"
          height="95"
          rx="14"
          fill="#0C1A33"
        />

        <rect
          x="56"
          y="62"
          width="24"
          height="6"
          rx="3"
          fill="#FFFFFF"
        />
      </g>

      {/* 2. Coin rises from behind the wallet's front panel */}
      <g className="sw-logo-coin">
        <circle
          cx="106"
          cy="64"
          r="27"
          fill="#0BB079"
        />

        <circle
          cx="106"
          cy="64"
          r="21"
          fill="#0C1A33"
        />

        <circle
          cx="106"
          cy="64"
          r="15"
          fill="#087F5B"
        />
      </g>

      {/* 3. Green front wallet panel */}
      <g className="sw-logo-wallet">
        <path
          d="M44 60 L54 68 L118 68 L118 150 L58 150 C50 150 44 144 44 136 Z"
          fill={`url(#${gradientId})`}
        />

        <path
          d="M48 146 L86 112 L98 150 L56 150 C51 150 48 146 48 146 Z"
          fill="#067A55"
          opacity=".7"
        />

        <rect
          x="142"
          y="96"
          width="18"
          height="24"
          rx="5"
          fill="#087F5B"
        />
      </g>

      {/* 4. Growth arrow: white outline, then emerald shaft */}
      <g>
        <path
          className="sw-logo-arrow-line"
          d="M44 130 L85 88 L102 105 L154 52"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          className="sw-logo-arrow-line"
          d="M44 138 L85 96 L102 113 L156 56"
          stroke="#0BB079"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          className="sw-logo-arrow-head"
          d="M134 44 L172 36 L164 74 Z"
          fill="#0BB079"
        />
      </g>

      {/* 5. Leaf finishes the mark alongside the arrow */}
      <g className="sw-logo-leaf">
        <path
          d="M105 150 C105 118 126 98 148 98 C148 124 132 148 105 150 Z"
          fill="#FFFFFF"
        />

        <path
          d="M104 150 C114 134 125 120 137 110"
          stroke="#087F5B"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function SpendWiseLogo({
  variant = "full",
  size = 44,
  className = "",
}) {
  const isFull = variant === "full";

  return (
    <>
      <style>{styles}</style>

      <span
        className={`sw-logo-link inline-flex shrink-0 items-center ${
          isFull ? "gap-2" : ""
        } ${className}`}
        aria-label={isFull ? "SpendWise" : undefined}
      >
        <WalletMark size={size} />

        {isFull && (
          <span className="sw-logo-wordmark whitespace-nowrap text-2xl font-extrabold tracking-tight">
            <span className="text-[#0C1A33]">Spend</span>
            <span className="text-[#0BB079]">Wise</span>
          </span>
        )}
      </span>
    </>
  );
}

export default SpendWiseLogo;
