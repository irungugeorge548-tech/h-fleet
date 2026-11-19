// H-Fleet mascots: the "Black Mamba" roadster bicycle (kind="bike") and the H-Fleet car (kind="car").
// `ride` spins the wheels and animates the speed lines.
const Spokes = () => <g stroke="#e6ebe8" strokeWidth="1"><path d="M-33 0H33M0 -33V33M-23 -23L23 23M23 -23L-23 23" /></g>
const Lines = ({ ys }) => (
  <g className="speed" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6">
    {ys.map((y, i) => <path key={i} d={`M${4 + (i % 2) * 8} ${y} H${40 + (i % 2) * 8}`} />)}
  </g>
)

function Bike({ size, ride, className }) {
  const tube = { stroke: '#0a0a0a', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  const Wheel = ({ x }) => (
    <g transform={`translate(${x} 105)`}>
      <g className="wheel"><circle r="33" fill="none" stroke="#0d0d0d" strokeWidth="5" /><Spokes /></g>
      <circle r="4" fill="#0d0d0d" />
    </g>
  )
  return (
    <svg viewBox="0 0 270 150" width={size} height={(size * 150) / 270} className={`mamba ${ride ? 'mamba-ride' : ''} ${className}`} role="img" aria-label="H-Fleet Black Mamba bicycle">
      <Lines ys={[70, 92, 114]} />
      <ellipse cx="140" cy="140" rx="100" ry="4" fill="#000" opacity=".18" />
      <Wheel x={75} /><Wheel x={205} />
      <g {...tube}>
        <path d="M105 52 L186 48" /><path d="M110 68 L188 62" /><path d="M105 52 L127 108" /><path d="M188 50 L127 108" />
        <path d="M127 108 L75 105" /><path d="M105 54 L75 105" /><path d="M188 48 L205 105" /><path d="M188 48 L186 30" /><path d="M186 30 C176 24 168 26 162 32" />
      </g>
      <path d="M90 46 C96 40 116 40 120 46 C116 52 98 52 90 46z" fill="#6b3f20" />
      <path d="M40 58 H100" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 106 L124 103 C133 103 133 118 124 118 L78 112z" fill="#0a0a0a" />
      <path d="M88 108 c5-5 10 3 15-1 c5-4 10 2 14-1" stroke="#e8c35a" strokeWidth="1.600" fill="none" />
      <path d="M196 34 h10 l3 6 h-12z" fill="#fff" />
    </svg>
  )
}

function Car({ size, ride, className }) {
  const Wheel = ({ x }) => (
    <g transform={`translate(${x} 96)`}>
      <g className="wheel"><circle r="15" fill="#111" /><circle r="7" fill="#d9dedb" /><path d="M-7 0H7M0 -7V7" stroke="#111" strokeWidth="1.500" /></g>
    </g>
  )
  return (
    <svg viewBox="0 0 270 130" width={size} height={(size * 130) / 270} className={`mamba ${ride ? 'mamba-ride' : ''} ${className}`} role="img" aria-label="H-Fleet car">
      <Lines ys={[52, 72, 92]} />
      <ellipse cx="150" cy="116" rx="100" ry="4" fill="#000" opacity=".18" />
      <path d="M60 92 L62 70 C64 62 76 58 88 56 L112 34 C116 30 122 28 128 28 H170 C178 28 184 32 190 38 L206 56 C222 58 236 62 240 74 L242 92 Z" fill="#fff" />
      <path d="M114 56 L128 38 H168 C172 38 176 40 180 44 L192 56z" fill="#9fdcc0" /><path d="M152 38 V56" stroke="#fff" strokeWidth="3" />
      <path d="M236 70 h10 v8 h-10z" fill="#ffd34d" /><path d="M60 72 h8 v8 h-8z" fill="#e5322d" />
      <text x="150" y="82" fontSize="14" fontWeight="800" fill="#1f9d5f" textAnchor="middle">H-Fleet</text>
      <Wheel x={96} /><Wheel x={206} />
    </svg>
  )
}

export default function Mascot({ kind = 'bike', size = 220, ride = false, className = '' }) {
  return kind === 'car' ? <Car size={size} ride={ride} className={className} /> : <Bike size={size} ride={ride} className={className} />
}
