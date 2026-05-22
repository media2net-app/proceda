"use client";

import { useMemo } from "react";
import type { ChartOptions, ScriptableContext } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartPointsToValues, hexToRgba, Q2_WEEK_LABELS } from "@/lib/demo-app/chart-utils";
import type { ChartTrend } from "../demo-ui";
import { registerDemoCharts } from "./register-charts";

registerDemoCharts();

export function DemoAreaChart({
  points,
  color,
  trend = "up",
  height = 208,
  valueSuffix = "",
}: {
  points: string;
  color: string;
  trend?: ChartTrend;
  height?: number;
  valueSuffix?: string;
}) {
  const stroke =
    trend === "down" ? "#F04438" : trend === "neutral" ? "#98A2B3" : color;

  const values = useMemo(() => chartPointsToValues(points), [points]);
  const labels = useMemo(
    () => Q2_WEEK_LABELS.slice(0, values.length),
    [values.length],
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          borderColor: stroke,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: stroke,
          pointHoverBorderWidth: 2,
          tension: 0.38,
          fill: true,
          backgroundColor: (ctx: ScriptableContext<"line">) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return hexToRgba(stroke, 0.1);
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, hexToRgba(stroke, 0.28));
            gradient.addColorStop(1, hexToRgba(stroke, 0.02));
            return gradient;
          },
        },
      ],
    }),
    [labels, values, stroke],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#101828",
          titleColor: "#F9FAFB",
          bodyColor: "#EAECF0",
          borderColor: "#475467",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          boxPadding: 4,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y ?? 0;
              return ` ${v}${valueSuffix}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: { display: false },
          ticks: {
            color: "#98A2B3",
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
        y: {
          position: "right",
          grid: {
            color: "#F2F4F7",
            drawTicks: false,
          },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: "#98A2B3",
            font: { size: 10 },
            padding: 8,
            maxTicksLimit: 4,
          },
          min:
            values.length > 0 ? Math.min(...values) * 0.88 : 0,
          max:
            values.length > 0 ? Math.max(...values) * 1.08 : 100,
        },
      },
    }),
    [values, valueSuffix],
  );

  return (
    <div className="h-full w-full" style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
