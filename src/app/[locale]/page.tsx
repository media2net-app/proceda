import { getTranslations } from "next-intl/server";
import { BookingModalRoot } from "@/components/booking/BookingModalRoot";
import DevNoticeModal from "@/components/DevNoticeModal";
import OrbaiHeader from "@/components/home/OrbaiHeader";
import OrbaiLanding from "@/components/home/OrbaiLanding";

export default async function HomePage() {
  const t = await getTranslations("home.orbai.nav");
  const tNav = await getTranslations("nav");

  const navLinks = [
    { href: "#platform", label: t("platform") },
    { href: "#features", label: t("features") },
    { href: "#services", label: t("services") },
    { href: "#process", label: t("process") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <BookingModalRoot>
      <DevNoticeModal message={tNav("devNotice")} />
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <OrbaiHeader
          navLinks={navLinks}
          ctaLabel={t("cta")}
          menuLabel={tNav("menu")}
          closeLabel={tNav("closeMenu")}
          languageLabel={tNav("language")}
        />
        <OrbaiLanding />
      </div>
    </BookingModalRoot>
  );
}
