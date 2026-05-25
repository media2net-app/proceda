export type DemoAppBrand = {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoPath: string;
  homepageDemoPath: string;
};

export type DemoKpi = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  chartPoints: string;
};

export type ListingStatusStyle = "new" | "sale" | "bid" | "sold";

export type PublicationStatus = "live" | "pending" | "error" | "offline";

export type DemoListingRow = {
  id: string;
  address: string;
  city: string;
  price: string;
  status: string;
  statusStyle: ListingStatusStyle;
  agent: string;
  agentName: string;
  daysOnMarket: number;
  thumbSrc?: string | null;
  fundaViews?: number;
  bedrooms?: number;
  livingArea?: string;
  fundaPublished?: boolean;
  websitePublished?: boolean;
  publicationStatus?: PublicationStatus;
  lastSync?: string;
};

export type DemoTask = {
  id: string;
  title: string;
  due: string;
  done?: boolean;
  assignee: string;
  assigneeName: string;
  property?: string;
  priority: "hoog" | "normaal" | "laag";
  category: "taxatie" | "bezichtiging" | "document" | "marketing" | "compliance";
};

export type DemoDocument = {
  id: string;
  name: string;
  type: "pdf" | "doc" | "image";
  size: string;
  uploadedAt: string;
  listingId: string;
  listingAddress: string;
};

export type DemoSellerChecklist = {
  listingId: string;
  address: string;
  sellerName: string;
  progressPct: number;
  items: { id: string; label: string; done: boolean; required: boolean }[];
};

export type DemoEmail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  leadId?: string;
  listingAddress?: string;
};

export type DemoTimelineEvent = {
  id: string;
  at: string;
  title: string;
  detail: string;
  type: "email" | "viewing" | "bid" | "sync" | "document" | "lead";
};

export type DemoBid = {
  id: string;
  amount: string;
  amountNum: number;
  bidder: string;
  date: string;
  status: "actief" | "vervallen" | "geaccepteerd";
  financing: string;
  conditions?: string;
};

export type DemoBidProperty = {
  listingId: string;
  address: string;
  askingPrice: string;
  bids: DemoBid[];
  protocolCompliant: boolean;
};

export type DemoLead = {
  id: string;
  name: string;
  type: "verkoper" | "koper" | "zoeker";
  stage: "nieuw" | "contact" | "bezichtiging" | "onderhandeling" | "afgerond";
  source: string;
  property?: string;
  agent: string;
  agentName: string;
  email: string;
  phone: string;
  lastContact: string;
  score: number;
};

export type DemoViewing = {
  id: string;
  date: string;
  time: string;
  property: string;
  city: string;
  contact: string;
  agent: string;
  agentName: string;
  status: "gepland" | "bevestigd" | "afgerond" | "geannuleerd";
  attendees: number;
};

export type DemoAppraisal = {
  id: string;
  address: string;
  city: string;
  client: string;
  status: "intake" | "opname" | "rapport" | "opgeleverd";
  dueDate: string;
  agent: string;
  agentName: string;
  indicativeValue?: string;
};

export type DemoReportMetric = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

export type DemoAiInsightItem = {
  id: string;
  category: "markt" | "concurrentie" | "advies" | "leads";
  title: string;
  detail: string;
  metric?: string;
};

export type DemoAiInsight = {
  agentName: string;
  headline: string;
  summary: string;
  generatedAt: string;
  confidence: "hoog" | "gemiddeld";
  items: DemoAiInsightItem[];
};

export type DemoDashboardData = {
  kpis: DemoKpi[];
  listings: DemoListingRow[];
  activities: string[];
  tasks: DemoTask[];
  pipelinePoints: string;
  viewsPoints: string;
  aiInsight: DemoAiInsight;
};

export type MakelaarPortalData = DemoDashboardData & {
  leads: DemoLead[];
  viewings: DemoViewing[];
  appraisals: DemoAppraisal[];
  reportMetrics: DemoReportMetric[];
  agents: { initials: string; name: string }[];
  documents: DemoDocument[];
  sellerChecklists: DemoSellerChecklist[];
  emails: DemoEmail[];
  timeline: DemoTimelineEvent[];
  bidProperty: DemoBidProperty;
};

export type RecruitmentCandidateRow = {
  id: string;
  name: string;
  sector: string;
  status: string;
  statusStyle: "new" | "active" | "placed" | "wait";
  lastContact: string;
  language: string;
  growthScore: number;
};

export type RecruitmentVacancyRow = {
  id: string;
  title: string;
  client: string;
  sector: string;
  location: string;
  urgency: string;
  candidates: number;
  slaHours: number;
};

export type RecruitmentAiMatch = {
  id: string;
  candidateName: string;
  vacancyTitle: string;
  sector: string;
  score: number;
  reason: string;
};

export type RecruitmentFollowUp = {
  id: string;
  party: string;
  type: "kandidaat" | "werkgever";
  waitingSince: string;
  action: string;
  draftReady: boolean;
};

export type RecruitmentSkillScore = {
  label: string;
  score: number;
  note?: string;
};

export type RecruitmentTimelineEntry = {
  id: string;
  at: string;
  title: string;
  detail: string;
  aiGenerated?: boolean;
};

export type RecruitmentAiReasonStep = {
  step: number;
  title: string;
  detail: string;
};

export type RecruitmentScoreFactor = {
  label: string;
  weight: number;
  score: number;
  explanation: string;
};

export type RecruitmentCandidateDetail = RecruitmentCandidateRow & {
  email: string;
  phone: string;
  availability: string;
  experienceYears: number;
  aiSummary: string;
  aiStrengths: string[];
  aiRisks: string[];
  skills: RecruitmentSkillScore[];
  topMatchIds: string[];
  timeline: RecruitmentTimelineEntry[];
  consultantNote: string;
};

export type RecruitmentVacancyDetail = RecruitmentVacancyRow & {
  description: string;
  hoursPerWeek: string;
  startDate: string;
  aiIntakeSummary: string;
  requirements: { id: string; label: string; required: boolean; met?: number }[];
  shortlistCandidateIds: string[];
  timeline: RecruitmentTimelineEntry[];
};

export type RecruitmentMatchDetail = RecruitmentAiMatch & {
  candidateId: string;
  vacancyId: string;
  factors: RecruitmentScoreFactor[];
  reasonSteps: RecruitmentAiReasonStep[];
  motivationDraft: string;
  consultantTip: string;
  atsNote: string;
};

export type RecruitmentFollowUpDetail = RecruitmentFollowUp & {
  subject: string;
  draftBody: string;
  aiPersonalization: string[];
  slaDeadline: string;
  relatedVacancyId?: string;
  relatedCandidateId?: string;
};

export type RecruitmentPortalData = {
  kpis: DemoKpi[];
  aiInsight: DemoAiInsight;
  candidates: RecruitmentCandidateRow[];
  vacancies: RecruitmentVacancyRow[];
  aiMatches: RecruitmentAiMatch[];
  followUps: RecruitmentFollowUp[];
  candidateDetails: Record<string, RecruitmentCandidateDetail>;
  vacancyDetails: Record<string, RecruitmentVacancyDetail>;
  matchDetails: Record<string, RecruitmentMatchDetail>;
  followUpDetails: Record<string, RecruitmentFollowUpDetail>;
};
