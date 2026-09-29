// Isologo DL: flecha ascendente en verde oliva con extrusión negra (misma pieza que las plantillas de redes)
export default function Logo({ size = 44, conTexto = true }: { size?: number; conTexto?: boolean }) {
  const path = "M4 34 L17 23 L25 29 L40 12";
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        {/* extrusión */}
        <g transform="translate(2.2 3)">
          <path d={path} fill="none" stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="butt" />
          <path d="M33 8 L45 6 L42 18 Z" fill="#1A1A1A" />
        </g>
        {/* cara */}
        <path d={path} fill="none" stroke="#4E5E36" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="butt" />
        <path d="M33 8 L45 6 L42 18 Z" fill="#6B7A45" />
      </svg>
      {conTexto && (
        <div className="leading-none">
          <span className="block font-serif text-2xl text-tinta">DL</span>
          <span className="block text-xs font-medium text-oliva">Economía y Finanzas</span>
        </div>
      )}
    </div>
  );
}
