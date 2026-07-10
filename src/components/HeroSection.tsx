export default function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8f9fc]">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% -5%, rgba(127, 86, 217, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 10%, rgba(105, 65, 198, 0.08) 0%, transparent 50%),
            linear-gradient(to bottom, #f9f5ff 0%, #f8f9fc 30%, #f8f9fc 100%)
          `,
        }}
      />
      {children}
    </section>
  );
}
