export type MailLeadStatus = "draft" | "sent" | "booked";

export type OutreachPipelineStatus =
  | "lead"
  | "contacted"
  | "meeting"
  | "proposal"
  | "won"
  | "lost";

export type MailOutreachRecord = {
  businessId: string;
  token: string;
  status: MailLeadStatus;
  recipientEmail?: string;
  sentAt?: string;
  followupSentAt?: string;
  bookedAt?: string;
  appointmentId?: string;
  sendBatch?: string;
  subjectVariant?: string;
  pipelineStatus?: OutreachPipelineStatus;
  doNotMail?: boolean;
  sequenceStep?: number;
  sequenceNextAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MailTemplatePreview = {
  businessId: string;
  slug: string;
  businessName: string;
  city: string;
  email?: string;
  leadQuality?: string;
  overallScore?: number;
  subject: string;
  plainBody: string;
  htmlBody: string;
  demoUrl: string;
  demoAppUrl?: string;
  dashboardScreenshotUrl?: string | null;
  logoPath?: string | null;
  source?: "demo" | "report";
  token: string;
  status: MailLeadStatus;
  sentAt?: string;
  followupSentAt?: string;
  /** Follow-up mail (alleen verstuurd + demo geklikt + nog geen follow-up). */
  followupSubject?: string;
  followupPlainBody?: string;
  followupHtmlBody?: string;
  /** initial | followup — voor preview in admin */
  mailVariant?: "initial" | "followup";
  /** Bezoek aan persoonlijke /demo/{token} pagina (uit analytics). */
  demoVisited?: boolean;
  demoClickCount?: number;
  demoSessionCount?: number;
  demoFirstClickAt?: string;
  demoLastClickAt?: string;
  sendBatch?: string;
  pipelineStatus?: OutreachPipelineStatus;
  /** E-mail waarschijnlijk geraden (info@domein) — extra voorzichtig versturen */
  emailGuessed?: boolean;
};

export type MailKpiStats = {
  /** Aantal met status concept (te versturen). */
  readyToSend: number;
  /** Alle demo-klaare makelaars in de verzendlijst. */
  demoReadyPool: number;
  sent: number;
  booked: number;
  conversionSentToBooked: number;
  /** Verstuurd/geboekt met minstens één demo-pagina-bezoek */
  demoClicked: number;
  demoClickRate: number;
  /** Verstuurd, demo-link geopend, follow-up nog niet verzonden. */
  followupReady: number;
  draft: number;
  inboxTotal: number;
  inboxInbound: number;
  inboxUnread: number;
  mailConfigured: boolean;
  inboxSyncedAt: string | null;
  updatedAt: string;
};

export type InboxMessage = {
  uid: number;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  preview: string;
  bodyText?: string;
  bodyHtml?: string | null;
  seen: boolean;
  direction: "inbound" | "outbound";
};

export type MailInboxCache = {
  messages: InboxMessage[];
  syncedAt: string | null;
  lastSyncError?: string | null;
  accountOk?: boolean;
};

export type MailSyncStatus = {
  configured: boolean;
  connected: boolean;
  syncedAt: string | null;
  unread: number;
  inboxTotal: number;
  syncing: boolean;
  lastSyncError: string | null;
  from?: string;
};

export type MailAccountStatus = {
  configured: boolean;
  from?: string;
  imapHost?: string;
  smtpHost?: string;
  smtpOk?: boolean;
  imapOk?: boolean;
  error?: string;
};

export type DemoLeadInfo = {
  businessName: string;
  city?: string;
  token: string;
};

export type BookingSlot = {
  iso: string;
  dayKey: string;
  timeLabel: string;
  dayLabel: string;
};

export type BookingDaysResponse = {
  days: { key: string; label: string; date: string }[];
  slots: BookingSlot[];
};
