import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HuisstijlAdminPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard-admin/mail`);
}
