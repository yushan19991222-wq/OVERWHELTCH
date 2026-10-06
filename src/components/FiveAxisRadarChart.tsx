import React from 'react';

export interface RadarDataPoint {
  label: string;
  value: number; // 0 ~ 100
  color?: string;
}

interface FiveAxisRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
  fillColor?: string;
  strokeColor?: string;
}

/**
 * 5-Axis Pentagon Biometric Radar Chart
 * Uses standard SVG math to plot 5 biometric axes centered at (center, center)
 */
export const FiveAxisRadarChart: React.FC<FiveAxisRadarChartProps> = ({
  data,
  size = 260,
  className = '',
  fillColor = 'rgba(6, 182, 212, 0.22)',
  strokeColor = '#06b6d4',
}) => {
  const center = size / 2;
  const radius = size * 0.35; // optimal radius leaving ample margin for labels on all 5 sides
  const totalAxes = data.length || 5;
  const angleStep = (Math.PI * 2) / totalAxes;
  const startAngle = -Math.PI / 2; // start from top (12 o'clock)

  // Calculate coordinates for a specific axis index & percentage (0 ~ 1)
  const getCoordinates = (index: number, pct: number) => {
    const angle = startAngle + index * angleStep;
    const r = radius * pct;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Concentric pentagon rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getRingPoints = (pct: number) => {
    return Array.from({ length: totalAxes })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, pct);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Data polygon points
  const polygonPoints = data
    .map((item, i) => {
      const pct = Math.max(0.12, Math.min(1.0, item.value / 100));
      const { x, y } = getCoordinates(i, pct);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible select-none drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]"
      >
        {/* Background Pentagon Web Rings */}
        {rings.map((ringPct, idx) => (
          <polygon
            key={idx}
            points={getRingPoints(ringPct)}
            fill={idx === rings.length - 1 ? 'rgba(4, 7, 14, 0.92)' : 'none'}
            stroke="rgba(6, 182, 212, 0.25)"
            strokeWidth={idx === rings.length - 1 ? '1.5' : '1'}
            strokeDasharray={idx < rings.length - 1 ? '2 2' : 'none'}
          />
        ))}

        {/* 5 Spoke Axis Lines */}
        {Array.from({ length: totalAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Data Polygon Area */}
        <polygon
          points={polygonPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Data Vertices (Dots) & Value Tags */}
        {data.map((item, i) => {
          const pct = Math.max(0.12, Math.min(1.0, item.value / 100));
          const { x, y } = getCoordinates(i, pct);
          const vertexColor = item.color || strokeColor;

          // Outer label position
          const labelDist = radius + 24;
          const angle = startAngle + i * angleStep;
          const labelX = center + labelDist * Math.cos(angle);
          const labelY = center + labelDist * Math.sin(angle);

          return (
            <g key={i}>
              {/* Vertex glow & circle */}
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill="#ffffff"
                stroke={vertexColor}
                strokeWidth="2"
                className="drop-shadow-[0_0_8px_currentColor]"
              />

              {/* Axis Label & Score */}
              <text
                x={labelX}
                y={labelY - 5}
                textAnchor="middle"
                dominantBaseline="central"
                fill={item.color || '#38bdf8'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                className="select-none tracking-wide"
              >
                {item.label}
              </text>
              <text
                x={labelX}
                y={labelY + 7}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="900"
                className="select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              >
                {item.value}%
              </text>
            </g>
          );
        })}

        {/* Center Origin Mark */}
        <circle cx={center} cy={center} r="2.5" fill="#38bdf8" opacity="0.8" />
      </svg>
    </div>
  );
};
