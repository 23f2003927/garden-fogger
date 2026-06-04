"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { useMemo } from "react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
      color: "#111827", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{Number(p.value).toFixed(0)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function SpectralChart({ latest, channels }) {
  // Build single-point spectrum data for the bar/line chart
  const spectrumData = useMemo(() => {
    if (!latest) return [];
    return channels.map((ch) => ({
      name: ch.nm,
      value: Number(latest[ch.key]) || 0,
      color: ch.color,
    }));
  }, [latest, channels]);

  if (!latest) {
    return (
      <div style={{
        height: 320, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#9ca3af", fontSize: 14,
      }}>
        Waiting for spectral data…
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={spectrumData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
              {channels.map((ch, i) => (
                <stop
                  key={ch.key}
                  offset={`${(i / (channels.length - 1)) * 100}%`}
                  stopColor={ch.color}
                  stopOpacity={0.8}
                />
              ))}
            </linearGradient>
            <linearGradient id="specFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
            label={{
              value: "Intensity",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#9ca3af", fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#specGrad)"
            strokeWidth={2.5}
            fill="url(#specFill)"
            dot={(props) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  key={payload.name}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={payload.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
