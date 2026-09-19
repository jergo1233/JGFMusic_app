import React from 'react';

export const DjCdHand = ({ isPlaying = false, onClick, className = "" }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20 transition-all duration-300 ${className}`}
    >
      <div
        onClick={onClick}
        className={`pointer-events-auto cursor-pointer relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
          isPlaying
            ? 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
            : 'opacity-100 scale-100'
        }`}
        title={isPlaying ? "Hawakan / tapikin ang CD para i-pause" : "Bitiwan ang CD para mag-play"}
      >
        <svg
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        >
          <defs>
            <radialGradient id="touchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="skinBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="50%" stopColor="#fdba74" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="skinHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>
            <linearGradient id="sleeveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {!isPlaying && (
            <g transform="translate(112, 118)">
              <circle cx="0" cy="0" r="32" fill="url(#touchGlow)" className="animate-pulse" />
              <circle cx="0" cy="0" r="22" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" opacity="0.8" />
              <circle cx="0" cy="0" r="14" stroke="#fef08a" strokeWidth="1.5" opacity="0.9" />
              <circle cx="28" cy="-12" r="16" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
              <circle cx="28" cy="-12" r="8" fill="#38bdf8" opacity="0.3" />
            </g>
          )}
          <g id="authentic-cd-hand" transform="translate(10, 5)">
            <path
              d="M235 295 L190 220 L240 190 L295 260 Z"
              fill="url(#sleeveGrad)"
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            <path d="M188 222 L242 188" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
            <path d="M194 229 L247 195" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse
              cx="165"
              cy="165"
              rx="45"
              ry="25"
              transform="rotate(-25 165 165)"
              fill="rgba(0,0,0,0.35)"
              filter="blur(5px)"
            />
            <path
              d="M195 190 C190 178 185 170 172 173 C164 175 165 186 172 192 L185 200 Z"
              fill="#fb923c"
              stroke="#431407"
              strokeWidth="3"
            />
            <path
              d="M180 175 C172 158 165 150 152 154 C143 157 144 170 154 177 L172 188 Z"
              fill="#fdba74"
              stroke="#431407"
              strokeWidth="3"
            />
            <path d="M152 163 L157 167" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M190 220 C182 205 175 190 162 178 C155 172 145 168 135 172 C125 176 122 185 125 198 C128 210 138 225 155 235 C172 245 192 235 190 220 Z"
              fill="url(#skinBase)"
              stroke="#431407"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M175 212 C168 198 160 188 150 182"
              stroke="#ffedd5"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M178 225 C185 215 195 195 198 178 C200 168 194 160 186 162 C178 164 175 175 172 188 L168 215 Z"
              fill="url(#skinHighlight)"
              stroke="#431407"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M192 167 C190 163 186 163 184 166" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" />
            <g id="middle-finger">
              <path
                d="M165 170 L140 135 L125 110 C120 102 110 105 106 112 C102 120 108 128 116 135 L142 162 Z"
                fill="url(#skinHighlight)"
                stroke="#431407"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <ellipse cx="112" cy="114" rx="6.5" ry="5" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
              <path d="M112 108 C115 105 120 107 121 110" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
              <path d="M136 136 L143 131" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              <path d="M125 122 L131 117" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g id="index-finger">
              <path
                d="M152 180 L130 148 L108 122 C102 115 92 118 89 126 C86 134 92 142 100 148 L126 178 Z"
                fill="url(#skinHighlight)"
                stroke="#431407"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <ellipse cx="95" cy="128" rx="6.5" ry="5.5" fill="#ffedd5" stroke="#c2410c" strokeWidth="1.2" />
              <path d="M93 121 C97 118 102 120 104 124" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
              <path d="M125 150 L131 144" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              <path d="M112 136 L118 130" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
          <g transform="translate(155, 238)">
            <rect
              x="0"
              y="0"
              width="78"
              height="24"
              rx="12"
              fill={isPlaying ? "#0f172a" : "#dc2626"}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="4" fill={isPlaying ? "#22c55e" : "#fef08a"} className={isPlaying ? "animate-ping" : ""} />
            <circle cx="12" cy="12" r="4" fill={isPlaying ? "#22c55e" : "#fef08a"} />
            <text
              x="46"
              y="16"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="900"
              letterSpacing="1"
            >
              {isPlaying ? "SPINNING" : "HELD / CD"}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DjCdHand;
