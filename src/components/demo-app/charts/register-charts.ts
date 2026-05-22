import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

let registered = false;

export function registerDemoCharts(): void {
  if (registered) return;
  ChartJS.defaults.font.family =
    "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
  ChartJS.defaults.color = "#667085";
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
  );
  registered = true;
}
