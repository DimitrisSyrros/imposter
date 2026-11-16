import { useMemo } from "react";
import { encode } from "uqr";

// The join link as a QR code, drawn as one SVG path on a light square (scanners need the light quiet zone).
export function Qr({ text, label }) {
  const { path, size } = useMemo(() => {
    const { data, size } = encode(text, { ecc: "M", border: 2 });
    let d = "";
    data.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x} ${y}h1v1h-1z`; }));
    return { path: d, size };
  }, [text]);

  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#f6ead8" />
      <path d={path} fill="#0b1114" />
    </svg>
  );
}
