"use client";

import { useMemo } from "react";
import type { ChartOptions, ScriptableContext } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartPointsToValues, hexToRgba, Q2_WEEK_LABELS } from "@/lib/demo-app/chart-utils";
import type { ChartTrend } from "../demo-ui";
import { registerDemoCharts } from "./register-charts";

registerDemoCharts();

export function DemoKpiChart({
  points,
  color,
  trend = "up",
  height = 88,
  showTooltip = true,
}: {
  points: string;
  color: string;
  trend?: ChartTrend;
  height?: number;
  showTooltip?: boolean;
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
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: stroke,
          pointHoverBorderWidth: 2,
          tension: 0.42,
          fill: true,
          backgroundColor: (ctx: ScriptableContext<"line">) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return hexToRgba(stroke, 0.12);
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, hexToRgba(stroke, 0.32));
            gradient.addColorStop(0.55, hexToRgba(stroke, 0.08));
            gradient.addColorStop(1, hexToRgba(stroke, 0));
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
        duration: 720,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: showTooltip,
          backgroundColor: "#101828",
          titleColor: "#F9FAFB",
          bodyColor: "#D0D5DD",
          borderColor: "#344054",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          titleFont: { size: 11, weight: "bold" },
          bodyFont: { size: 12 },
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y ?? 0}`,
          },
        },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false },
        },
        y: {
          display: false,
          grid: { display: false },
          min:
            values.length > 0 ? Math.min(...values) * 0.92 : 0,
          max:
            values.length > 0 ? Math.max(...values) * 1.06 : 100,
        },
      },
    }),
    [values, showTooltip],
  );

  return (
    <div className="w-full" style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
