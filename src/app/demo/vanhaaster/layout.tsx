import type { Metadata } from "next";
import "./vanhaaster-demo.css";

export const metadata: Metadata = {
  title: "Vanhaaster × Proceda — Command Center Demo",
  description:
    "Demo command center voor Vanhaaster met Intake, E-mail en Knowledge agents.",
};

export default function VanhaasterDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
