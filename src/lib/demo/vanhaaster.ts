export type VanhaasterAgentStatus = "idle" | "active" | "processing" | "waiting";
export type VanhaasterAgentPhase = "live" | "phase2";

export type VanhaasterPage =
  | "dashboard"
  | "agents"
  | "skills"
  | "projects"
  | "team"
  | "activity"
  | "connectors"
  | "governance";

export interface VanhaasterAgent {
  id: string;
  name: string;
  tag: string;
  phase: VanhaasterAgentPhase;
  status: VanhaasterAgentStatus;
  hook: string;
  connectors: string[];
  lastAction: string;
  metrics: { label: string; value: string }[];
  currentTask?: string;
  progress?: number;
  skills: string[];
  runsToday: number;
  uptime: string;
}

export interface VanhaasterStat {
  id: string;
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "warning" | "accent" | "success";
  trend?: string;
}

export interface VanhaasterKpi {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  spark: number[];
}

export interface VanhaasterException {
  id: string;
  agentId: string;
  title: string;
  detail: string;
  projectId?: string;
  priority: "action" | "review" | "info";
  timestamp: string;
}

export interface VanhaasterActivity {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  projectId?: string;
  tone: "success" | "info" | "warning";
}

export interface VanhaasterProject {
  id: string;
  name: string;
  client: string;
  type: string;
  status: "on-track" | "at-risk" | "waiting" | "review";
  lead: string;
  deadline: string;
  progress: number;
  agentSupport: string[];
}

export interface VanhaasterProjectMilestone {
  label: string;
  done: boolean;
  date?: string;
}

export interface VanhaasterProjectAsset {
  name: string;
  status: "ok" | "missing" | "review";
}

export interface VanhaasterProjectDetail {
  briefing: string;
  deliverables: string[];
  milestones: VanhaasterProjectMilestone[];
  blockers: string[];
  assets: VanhaasterProjectAsset[];
  team: string[];
  budget?: string;
  started: string;
}

export interface VanhaasterTeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  status: "available" | "busy" | "in-meeting" | "offline";
  projects: number;
  load: number;
  agentQuestionsSaved: number;
  currentFocus?: string;
}

export interface VanhaasterSkill {
  id: string;
  name: string;
  agentId: string;
  category: string;
  runs: number;
  successRate: number;
  avgDuration: string;
  status: "live" | "phase2";
}

export interface VanhaasterConnector {
  id: string;
  name: string;
  status: "connected" | "syncing" | "planned";
  lastSync: string;
  records: string;
}

export const VANHAASTER_BRAND = {
  client: "Vanhaaster",
  partner: "Proceda",
  tagline: "Geen chatbot. Een operatielaag.",
  demoLabel: "Demo — voorbeeldweergave",
};

export const NAV_ITEMS: { id: VanhaasterPage; label: string; group?: string }[] = [
  { id: "dashboard", label: "Dashboard", group: "Overzicht" },
  { id: "agents", label: "Agents", group: "Operatie" },
  { id: "skills", label: "Skills", group: "Operatie" },
  { id: "projects", label: "Projecten", group: "Operatie" },
  { id: "team", label: "Team", group: "Mensen" },
  { id: "activity", label: "Activiteit", group: "Mensen" },
  { id: "connectors", label: "Connectors", group: "Systeem" },
  { id: "governance", label: "Governance", group: "Systeem" },
];

export const PAGE_TITLES: Record<VanhaasterPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Command Center",
    subtitle: "KPI's, uitzonderingen en live agent-activiteit — alles in één overzicht.",
  },
  agents: {
    title: "Agents",
    subtitle: "Fase 1 agents draaien live. Fase 2 staat klaar om op te bouwen.",
  },
  skills: {
    title: "Skills Dashboard",
    subtitle: "Welke vaardigheden draaien, hoe vaak, en hoe betrouwbaar ze presteren.",
  },
  projects: {
    title: "Projecten",
    subtitle: "Alle lopende opdrachten met agent-ondersteuning en status per project.",
  },
  team: {
    title: "Team",
    subtitle: "Wie doet wat — en hoeveel onderbrekingen agents vandaag hebben voorkomen.",
  },
  activity: {
    title: "Activiteit",
    subtitle: "Volledige audit trail van agent-acties, beslissingen en escalaties.",
  },
  connectors: {
    title: "Connectors",
    subtitle: "Outlook, OneDrive, Smartsheet en meer — gekoppeld aan jullie stack.",
  },
  governance: {
    title: "Governance",
    subtitle: "Approval-first, audit log, automatiseringniveaus en stopregels.",
  },
};

export const KPI_HERO: VanhaasterKpi[] = [
  {
    id: "hours",
    label: "Uren bespaard (week)",
    value: "18.5u",
    change: "+24%",
    positive: true,
    spark: [8, 10, 9, 12, 14, 16, 18],
  },
  {
    id: "automations",
    label: "Agent-runs vandaag",
    value: "147",
    change: "+12%",
    positive: true,
    spark: [18, 22, 28, 35, 41, 52, 61],
  },
  {
    id: "approval",
    label: "Goedkeuringsratio",
    value: "96%",
    change: "+3%",
    positive: true,
    spark: [88, 90, 91, 93, 94, 95, 96],
  },
  {
    id: "interrupts",
    label: "Onderbrekingen voorkomen",
    value: "34",
    change: "+8",
    positive: true,
    spark: [12, 15, 18, 22, 26, 30, 34],
  },
];

export const INITIAL_STATS: VanhaasterStat[] = [
  { id: "decisions", label: "Open beslissingen", value: 6, sub: "3 deadline-kritisch", tone: "warning", trend: "-2 vandaag" },
  { id: "concepts", label: "Concepten wachtend", value: 4, sub: "e-mail", tone: "accent", trend: "+1" },
  { id: "conflicts", label: "Bronconflicten", value: 3, sub: "te bekijken", tone: "default", trend: "0" },
  { id: "answered", label: "Vragen beantwoord", value: 22, sub: "vandaag", tone: "success", trend: "+6" },
];

export const INITIAL_AGENTS: VanhaasterAgent[] = [
  {
    id: "intake",
    name: "Intake & Projectstart",
    tag: "Projectstart",
    phase: "live",
    status: "processing",
    hook: "Van aanvraag naar startklaar project — zonder ontbrekende input.",
    connectors: ["Outlook", "OneDrive", "Smartsheet"],
    lastAction: "VNH-2026-052 briefing gevalideerd · wacht op acceptatie Jacco",
    metrics: [
      { label: "Projecten vandaag", value: "3" },
      { label: "Completeness", value: "94%" },
    ],
    currentTask: "Project Start Sheet genereren voor keuken-rebrand",
    progress: 72,
    skills: ["briefing_parser", "completeness_check", "onedrive_setup", "smartsheet_planning"],
    runsToday: 41,
    uptime: "99.8%",
  },
  {
    id: "email",
    name: "E-mail & Communicatie",
    tag: "Outlook",
    phase: "live",
    status: "active",
    hook: "Triage, conceptantwoorden en goedkeuringen — jullie keuren alleen goed.",
    connectors: ["Outlook", "Smartsheet"],
    lastAction: "4 conceptantwoorden klaar · 1 drukproef-goedkeuring geëscaleerd",
    metrics: [
      { label: "Concepten klaar", value: "4" },
      { label: "Geëscaleerd", value: "1" },
    ],
    currentTask: "Conceptantwoord Concordia — revisie drukproef",
    progress: 88,
    skills: ["thread_triage", "concept_reply", "action_extraction", "escalation"],
    runsToday: 56,
    uptime: "99.9%",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    tag: "Intern",
    phase: "live",
    status: "active",
    hook: "Brongebonden antwoorden zonder de directie te onderbreken.",
    connectors: ["OneDrive", "Outlook", "Brand guides"],
    lastAction: "18 vragen beantwoord · 2 bronconflicten gemeld (PMS vs. RGB)",
    metrics: [
      { label: "Beantwoord", value: "18" },
      { label: "Conflicten", value: "2" },
    ],
    currentTask: "Huisstijl-specs Weghorst opzoeken voor Yvonne",
    progress: 45,
    skills: ["brand_lookup", "spec_search", "conflict_detection", "rights_check"],
    runsToday: 50,
    uptime: "99.7%",
  },
  {
    id: "qa",
    name: "Creative QA",
    tag: "Fase 2",
    phase: "phase2",
    status: "idle",
    hook: "Precheck op huisstijl, specs en spelling vóór directie-review.",
    connectors: ["OneDrive", "Brand guides"],
    lastAction: "Nog niet actief — beschikbaar na Fase 1",
    metrics: [
      { label: "Status", value: "—" },
      { label: "Issues", value: "—" },
    ],
    skills: ["precheck", "issue_log", "review_verify"],
    runsToday: 0,
    uptime: "—",
  },
  {
    id: "social",
    name: "Social & Content",
    tag: "Fase 2",
    phase: "phase2",
    status: "idle",
    hook: "Contentkalender en keuken-posts op schema.",
    connectors: ["Meta", "LinkedIn", "Instagram"],
    lastAction: "Nog niet actief — beschikbaar na Fase 1",
    metrics: [
      { label: "Posts gepland", value: "—" },
      { label: "Campagnes", value: "—" },
    ],
    skills: ["content_calendar", "post_draft", "campaign_plan"],
    runsToday: 0,
    uptime: "—",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    tag: "Fase 2",
    phase: "phase2",
    status: "idle",
    hook: "Cases, consent register en referentieprofielen.",
    connectors: ["OneDrive", "Website"],
    lastAction: "Nog niet actief — beschikbaar na Fase 1",
    metrics: [
      { label: "Cases", value: "—" },
      { label: "Consent", value: "—" },
    ],
    skills: ["consent_register", "asset_scan", "case_builder"],
    runsToday: 0,
    uptime: "—",
  },
];

export const VANHAASTER_PROJECTS: VanhaasterProject[] = [
  {
    id: "VNH-2026-052",
    name: "Keuken-rebrand",
    client: "Concordia Keuken & Bad",
    type: "Branding / Website",
    status: "waiting",
    lead: "Jacco Stoel",
    deadline: "24 jul",
    progress: 35,
    agentSupport: ["intake", "email"],
  },
  {
    id: "VNH-2026-041",
    name: "Website + huisstijl",
    client: "Concordia Keuken & Bad",
    type: "Website",
    status: "review",
    lead: "Yvonne Rieff",
    deadline: "18 jul",
    progress: 82,
    agentSupport: ["email", "knowledge"],
  },
  {
    id: "VNH-2026-038",
    name: "Huisstijl refresh",
    client: "Weghorst",
    type: "Branding / Belettering",
    status: "on-track",
    lead: "Yvonne Rieff",
    deadline: "28 jul",
    progress: 58,
    agentSupport: ["knowledge", "intake"],
  },
  {
    id: "VNH-2026-044",
    name: "Belettering update",
    client: "Wildlands",
    type: "Belettering / Concept",
    status: "at-risk",
    lead: "Aron Staaks",
    deadline: "15 jul",
    progress: 44,
    agentSupport: ["knowledge", "intake"],
  },
  {
    id: "VNH-2026-047",
    name: "Rebrand nieuwe locatie",
    client: "Coster Keukens",
    type: "Branding / Website",
    status: "on-track",
    lead: "Jacco Stoel",
    deadline: "2 aug",
    progress: 28,
    agentSupport: ["intake"],
  },
  {
    id: "VNH-2026-055",
    name: "Hagro social pack",
    client: "Hagro Keukens",
    type: "Social / Drukwerk",
    status: "at-risk",
    lead: "Merel Snoeker",
    deadline: "16 jul",
    progress: 52,
    agentSupport: ["intake", "email"],
  },
  {
    id: "VNH-2026-048",
    name: "Offerte follow-up",
    client: "AXI Keukens",
    type: "E-mail / Sales",
    status: "on-track",
    lead: "Merel Snoeker",
    deadline: "12 jul",
    progress: 67,
    agentSupport: ["email"],
  },
];

export const VANHAASTER_TEAM: VanhaasterTeamMember[] = [
  {
    id: "ron",
    name: "Ron Stoel",
    role: "Directeur / Adviseur",
    initials: "RS",
    status: "in-meeting",
    projects: 4,
    load: 78,
    agentQuestionsSaved: 6,
    currentFocus: "Klantgesprek Concordia",
  },
  {
    id: "jacco",
    name: "Jacco Stoel",
    role: "Directeur / Art director",
    initials: "JS",
    status: "busy",
    projects: 5,
    load: 85,
    agentQuestionsSaved: 9,
    currentFocus: "Creative review VNH-2026-052",
  },
  {
    id: "merel",
    name: "Merel Snoeker",
    role: "Binnendienst",
    initials: "MS",
    status: "busy",
    projects: 6,
    load: 72,
    agentQuestionsSaved: 14,
    currentFocus: "Intake Hagro social pack",
  },
  {
    id: "yvonne",
    name: "Yvonne Rieff",
    role: "Grafisch vormgever",
    initials: "YR",
    status: "available",
    projects: 3,
    load: 64,
    agentQuestionsSaved: 11,
    currentFocus: "Weghorst drukproef",
  },
  {
    id: "aron",
    name: "Aron Staaks",
    role: "Vormgever / Video / 3D",
    initials: "AS",
    status: "available",
    projects: 2,
    load: 58,
    agentQuestionsSaved: 7,
    currentFocus: "Wildlands belettering",
  },
  {
    id: "fleur",
    name: "Fleur Grit",
    role: "Stagiair vormgeving",
    initials: "FG",
    status: "available",
    projects: 2,
    load: 45,
    agentQuestionsSaved: 8,
    currentFocus: "Social visuals Coster",
  },
  {
    id: "jolanda",
    name: "Jolanda Stoel",
    role: "Financiële administratie",
    initials: "JO",
    status: "offline",
    projects: 0,
    load: 30,
    agentQuestionsSaved: 2,
  },
];

export const VANHAASTER_SKILLS: VanhaasterSkill[] = [
  { id: "s1", name: "Briefing parser", agentId: "intake", category: "Intake", runs: 128, successRate: 97, avgDuration: "1.2s", status: "live" },
  { id: "s2", name: "Completeness check", agentId: "intake", category: "Intake", runs: 112, successRate: 94, avgDuration: "0.8s", status: "live" },
  { id: "s3", name: "OneDrive setup", agentId: "intake", category: "Intake", runs: 89, successRate: 99, avgDuration: "2.1s", status: "live" },
  { id: "s4", name: "Smartsheet planning", agentId: "intake", category: "Intake", runs: 76, successRate: 92, avgDuration: "1.8s", status: "live" },
  { id: "s5", name: "Thread triage", agentId: "email", category: "E-mail", runs: 234, successRate: 96, avgDuration: "0.6s", status: "live" },
  { id: "s6", name: "Concept reply", agentId: "email", category: "E-mail", runs: 67, successRate: 98, avgDuration: "3.4s", status: "live" },
  { id: "s7", name: "Action extraction", agentId: "email", category: "E-mail", runs: 145, successRate: 93, avgDuration: "1.1s", status: "live" },
  { id: "s8", name: "Escalation router", agentId: "email", category: "E-mail", runs: 23, successRate: 100, avgDuration: "0.4s", status: "live" },
  { id: "s9", name: "Brand lookup", agentId: "knowledge", category: "Knowledge", runs: 198, successRate: 95, avgDuration: "0.9s", status: "live" },
  { id: "s10", name: "Spec search", agentId: "knowledge", category: "Knowledge", runs: 156, successRate: 91, avgDuration: "1.0s", status: "live" },
  { id: "s11", name: "Conflict detection", agentId: "knowledge", category: "Knowledge", runs: 34, successRate: 88, avgDuration: "1.5s", status: "live" },
  { id: "s12", name: "Rights check", agentId: "knowledge", category: "Knowledge", runs: 89, successRate: 99, avgDuration: "0.3s", status: "live" },
  { id: "s13", name: "Creative precheck", agentId: "qa", category: "QA", runs: 0, successRate: 0, avgDuration: "—", status: "phase2" },
  { id: "s14", name: "Content calendar", agentId: "social", category: "Social", runs: 0, successRate: 0, avgDuration: "—", status: "phase2" },
  { id: "s15", name: "Case builder", agentId: "portfolio", category: "Portfolio", runs: 0, successRate: 0, avgDuration: "—", status: "phase2" },
];

export const VANHAASTER_CONNECTORS: VanhaasterConnector[] = [
  { id: "outlook", name: "Microsoft Outlook", status: "connected", lastSync: "2 min geleden", records: "4.821 threads" },
  { id: "onedrive", name: "OneDrive", status: "syncing", lastSync: "Nu bezig", records: "312 mappen" },
  { id: "smartsheet", name: "Smartsheet", status: "connected", lastSync: "8 min geleden", records: "47 rijen" },
  { id: "meta", name: "Meta Business", status: "planned", lastSync: "Fase 2", records: "—" },
  { id: "linkedin", name: "LinkedIn", status: "planned", lastSync: "Fase 2", records: "—" },
  { id: "website", name: "vanhaaster.nl", status: "connected", lastSync: "1 uur geleden", records: "28 cases" },
];

export const INITIAL_EXCEPTIONS: VanhaasterException[] = [
  {
    id: "ex-1",
    agentId: "intake",
    title: "VNH-2026-052 keuken-rebrand",
    detail: "Briefing compleet · wacht op acceptatie Jacco",
    projectId: "VNH-2026-052",
    priority: "action",
    timestamp: "14:22",
  },
  {
    id: "ex-2",
    agentId: "email",
    title: "5 conceptantwoorden klaar",
    detail: "1 klacht geëscaleerd naar directie",
    priority: "review",
    timestamp: "14:18",
  },
  {
    id: "ex-3",
    agentId: "email",
    title: "Drukproef Concordia",
    detail: "Goedkeuring verlopen · herinnering verstuurd",
    projectId: "VNH-2026-041",
    priority: "action",
    timestamp: "13:55",
  },
  {
    id: "ex-4",
    agentId: "knowledge",
    title: "2 bronconflicten",
    detail: "PMS 485 C vs. RGB in Weghorst brand guide",
    projectId: "VNH-2026-038",
    priority: "review",
    timestamp: "13:41",
  },
  {
    id: "ex-5",
    agentId: "intake",
    title: "VNH-2026-055 Hagro social pack",
    detail: "Ontbrekende logo-variant · back-up niet gekoppeld",
    projectId: "VNH-2026-055",
    priority: "action",
    timestamp: "12:30",
  },
  {
    id: "ex-6",
    agentId: "knowledge",
    title: "Deadline-risico Wildlands",
    detail: "Belettering-specs niet gevonden in projectmap",
    projectId: "VNH-2026-044",
    priority: "info",
    timestamp: "11:15",
  },
];

export const ACTIVITY_POOL: Omit<VanhaasterActivity, "id">[] = [
  {
    agentId: "intake",
    agentName: "Intake Agent",
    message: "Completeness-check VNH-2026-052 afgerond — 12/12 velden ingevuld",
    projectId: "VNH-2026-052",
    tone: "success",
  },
  {
    agentId: "email",
    agentName: "E-mail Agent",
    message: "Conceptantwoord geschreven voor AXI Keukens — wacht op review",
    projectId: "VNH-2026-048",
    tone: "info",
  },
  {
    agentId: "knowledge",
    agentName: "Knowledge Agent",
    message: "Beantwoord: welk lettertype gebruikt Concordia in headlines?",
    projectId: "VNH-2026-041",
    tone: "success",
  },
  {
    agentId: "intake",
    agentName: "Intake Agent",
    message: "OneDrive-structuur aangemaakt voor VNH-2026-055",
    projectId: "VNH-2026-055",
    tone: "success",
  },
  {
    agentId: "email",
    agentName: "E-mail Agent",
    message: "Goedkeuring drukproef geëxtraheerd uit thread — actie aangemaakt",
    projectId: "VNH-2026-041",
    tone: "warning",
  },
  {
    agentId: "knowledge",
    agentName: "Knowledge Agent",
    message: "Bronconflict gemeld: PMS vs. RGB in Weghorst huisstijl",
    projectId: "VNH-2026-038",
    tone: "warning",
  },
  {
    agentId: "intake",
    agentName: "Intake Agent",
    message: "Smartsheet planning-concept gegenereerd voor keuken-rebrand",
    projectId: "VNH-2026-052",
    tone: "info",
  },
  {
    agentId: "email",
    agentName: "E-mail Agent",
    message: "Interne actie: herinner Merel om logo-variant aan te leveren",
    projectId: "VNH-2026-055",
    tone: "info",
  },
  {
    agentId: "knowledge",
    agentName: "Knowledge Agent",
    message: "Beantwoord: wat is de bleed-marge voor Coster drukwerk?",
    projectId: "VNH-2026-047",
    tone: "success",
  },
  {
    agentId: "intake",
    agentName: "Intake Agent",
    message: "Uitvoerder Yvonne gekoppeld · back-up Aron voorgesteld",
    projectId: "VNH-2026-052",
    tone: "info",
  },
  {
    agentId: "email",
    agentName: "E-mail Agent",
    message: "Klacht geëscaleerd naar Jacco — geen auto-reply verstuurd",
    projectId: "VNH-2026-048",
    tone: "warning",
  },
  {
    agentId: "knowledge",
    agentName: "Knowledge Agent",
    message: "Rechten-check: Fleur heeft geen toegang tot financiële thread",
    tone: "info",
  },
];

export const AGENT_TASK_ROTATIONS: Record<
  string,
  { task: string; action: string; progress: number }[]
> = {
  intake: [
    {
      task: "Project Start Sheet genereren voor keuken-rebrand",
      action: "VNH-2026-052 briefing gevalideerd · wacht op acceptatie Jacco",
      progress: 72,
    },
    {
      task: "Ontbrekende assets opvragen bij Hagro social pack",
      action: "Logo-variant ontbreekt · herinnering voorbereid",
      progress: 38,
    },
    {
      task: "Smartsheet planning synchroniseren",
      action: "Deadline-risico gedetecteerd voor VNH-2026-044",
      progress: 61,
    },
  ],
  email: [
    {
      task: "Conceptantwoord Concordia — revisie drukproef",
      action: "4 conceptantwoorden klaar · 1 escalatie actief",
      progress: 88,
    },
    {
      task: "Thread triage: offerte-aanvraag AV Keukens",
      action: "Besluit en scopewijziging geëxtraheerd uit mail",
      progress: 54,
    },
    {
      task: "Herinnering drukproef-goedkeuring opstellen",
      action: "Goedkeuring verlopen · concept klaar voor review",
      progress: 95,
    },
  ],
  knowledge: [
    {
      task: "Huisstijl-specs Weghorst opzoeken voor Yvonne",
      action: "18 vragen beantwoord · 2 bronconflicten gemeld",
      progress: 45,
    },
    {
      task: "Projectstatus Wildlands belettering delen",
      action: "Specs niet gevonden · escalatie naar directie",
      progress: 28,
    },
    {
      task: "Brand guide Concordia samenvatten",
      action: "Antwoord geleverd zonder onderbreking directie",
      progress: 100,
    },
  ],
};

export const GOVERNANCE_LEVELS = [
  { level: "A0", label: "Lezen", desc: "Alleen informatie ophalen en samenvatten", active: true },
  { level: "A1", label: "Intern voorbereiden", desc: "Concepten, taken en checklists genereren", active: true },
  { level: "A2", label: "Intern uitvoeren", desc: "Mappen, planning en interne notities bijwerken", active: true },
  { level: "A3", label: "Extern concept", desc: "Conceptmail en bestandskoppeling — altijd review", active: true },
  { level: "A4", label: "Beperkte externe actie", desc: "Whitelist-only, audit + stopregels", active: false },
];

export function getAgentName(agentId: string): string {
  return INITIAL_AGENTS.find((a) => a.id === agentId)?.name ?? agentId;
}

export function getProject(id: string): VanhaasterProject | undefined {
  return VANHAASTER_PROJECTS.find((p) => p.id === id);
}

export function getAgent(id: string): VanhaasterAgent | undefined {
  return INITIAL_AGENTS.find((a) => a.id === id);
}

export function getTeamMember(id: string): VanhaasterTeamMember | undefined {
  return VANHAASTER_TEAM.find((m) => m.id === id);
}

export const PROJECT_DETAILS: Record<string, VanhaasterProjectDetail> = {
  "VNH-2026-052": {
    briefing:
      "Volledige keuken-rebrand voor Concordia: nieuwe huisstijl, website en drukwerk. Hagro-afstemming vereist. Start na goedkeuring Jacco op scope en planning.",
    deliverables: ["Huisstijlgids", "Website redesign", "Drukwerk templates", "Social starter pack"],
    milestones: [
      { label: "Briefing gevalideerd", done: true, date: "8 jul" },
      { label: "Moodboards goedgekeurd", done: true, date: "10 jul" },
      { label: "Scope-acceptatie directie", done: false, date: "11 jul" },
      { label: "Website wireframes", done: false, date: "18 jul" },
      { label: "Eindoplevering", done: false, date: "24 jul" },
    ],
    blockers: ["Wacht op acceptatie Jacco op Project Start Sheet", "Logo-variant PMS nog niet aangeleverd"],
    assets: [
      { name: "Logo vector (.ai)", status: "ok" },
      { name: "Brand photography", status: "ok" },
      { name: "Hagro template pack", status: "missing" },
      { name: "Klant copy deck", status: "review" },
    ],
    team: ["Jacco Stoel", "Yvonne Rieff", "Aron Staaks"],
    budget: "€ 18.500",
    started: "1 jul 2026",
  },
  "VNH-2026-041": {
    briefing: "Website en huisstijlwijziging Concordia. Drukproef revisie wacht op klantgoedkeuring.",
    deliverables: ["Website live", "Huisstijl update", "E-mail handtekeningen"],
    milestones: [
      { label: "Design goedgekeurd", done: true, date: "20 jun" },
      { label: "Development", done: true, date: "5 jul" },
      { label: "Drukproef review", done: false, date: "12 jul" },
      { label: "Go-live", done: false, date: "18 jul" },
    ],
    blockers: ["Drukproef-goedkeuring verlopen — herinnering verstuurd"],
    assets: [
      { name: "Website staging", status: "ok" },
      { name: "Drukproef PDF", status: "review" },
      { name: "Favicon set", status: "ok" },
    ],
    team: ["Yvonne Rieff", "Merel Snoeker"],
    budget: "€ 12.200",
    started: "15 jun 2026",
  },
  "VNH-2026-038": {
    briefing: "Huisstijl refresh Weghorst inclusief belettering en social templates.",
    deliverables: ["Logo update", "Belettering ontwerp", "Social templates", "Brand guide"],
    milestones: [
      { label: "Kick-off", done: true, date: "25 jun" },
      { label: "Concepten", done: true, date: "3 jul" },
      { label: "Belettering specs", done: false, date: "15 jul" },
      { label: "Oplevering", done: false, date: "28 jul" },
    ],
    blockers: ["Bronconflict PMS 485 C vs. RGB in brand guide"],
    assets: [
      { name: "Logo files", status: "ok" },
      { name: "Pantone specs", status: "review" },
      { name: "Belettering DXF", status: "missing" },
    ],
    team: ["Yvonne Rieff", "Fleur Grit"],
    budget: "€ 8.900",
    started: "25 jun 2026",
  },
  "VNH-2026-044": {
    briefing: "Belettering update Wildlands — continue ontwikkeling, meerdere locaties.",
    deliverables: ["Belettering ontwerp", "Productiefiles", "Montage-instructie"],
    milestones: [
      { label: "Locatie-inventarisatie", done: true, date: "1 jul" },
      { label: "Ontwerp fase 1", done: false, date: "10 jul" },
      { label: "Productie", done: false, date: "15 jul" },
    ],
    blockers: [
      "Belettering-specs niet gevonden in projectmap",
      "Deadline 15 jul — risico op vertraging",
    ],
    assets: [
      { name: "Bestaande belettering foto's", status: "ok" },
      { name: "Specs vorige levering", status: "missing" },
      { name: "Pand maten", status: "ok" },
    ],
    team: ["Aron Staaks", "Jacco Stoel"],
    budget: "€ 6.400",
    started: "28 jun 2026",
  },
  "VNH-2026-047": {
    briefing: "Rebrand Coster Keukens nieuwe locatie — logo, signing en website.",
    deliverables: ["Logo", "Gevelbelettering", "Website landingspagina"],
    milestones: [
      { label: "Intake afgerond", done: true, date: "5 jul" },
      { label: "Logo concepten", done: false, date: "14 jul" },
      { label: "Website draft", done: false, date: "25 jul" },
      { label: "Oplevering", done: false, date: "2 aug" },
    ],
    blockers: [],
    assets: [
      { name: "Pand foto's", status: "ok" },
      { name: "Bestaand logo", status: "ok" },
    ],
    team: ["Jacco Stoel", "Yvonne Rieff"],
    budget: "€ 14.800",
    started: "5 jul 2026",
  },
  "VNH-2026-055": {
    briefing: "Hagro social pack — posts, templates en drukwerk voor keukenpromotie.",
    deliverables: ["6 social posts", "Drukwerk A3/A4", "Hagro-compliant templates"],
    milestones: [
      { label: "Briefing", done: true, date: "3 jul" },
      { label: "Templates", done: false, date: "10 jul" },
      { label: "Klantgoedkeuring", done: false, date: "14 jul" },
      { label: "Levering", done: false, date: "16 jul" },
    ],
    blockers: ["Logo-variant ontbreekt", "Back-up designer niet gekoppeld"],
    assets: [
      { name: "Hagro richtlijnen", status: "ok" },
      { name: "Logo varianten", status: "missing" },
      { name: "Productfoto's", status: "review" },
    ],
    team: ["Merel Snoeker", "Fleur Grit"],
    budget: "€ 4.200",
    started: "3 jul 2026",
  },
  "VNH-2026-048": {
    briefing: "Offerte follow-up AXI Keukens — conceptantwoord en meeting planning.",
    deliverables: ["Offerte verstuurd", "Follow-up mail", "Meeting ingepland"],
    milestones: [
      { label: "Offerte opgesteld", done: true, date: "2 jul" },
      { label: "Follow-up verstuurd", done: true, date: "8 jul" },
      { label: "Meeting bevestigd", done: false, date: "12 jul" },
    ],
    blockers: [],
    assets: [{ name: "Offerte PDF", status: "ok" }],
    team: ["Merel Snoeker"],
    budget: "€ 9.500 (offerte)",
    started: "28 jun 2026",
  },
};

export function getProjectDetail(id: string): VanhaasterProjectDetail | undefined {
  return PROJECT_DETAILS[id];
}

export function getProjectActivities(projectId: string): Omit<VanhaasterActivity, "id">[] {
  return ACTIVITY_POOL.filter((a) => a.projectId === projectId);
}

export function getProjectExceptions(projectId: string): VanhaasterException[] {
  return INITIAL_EXCEPTIONS.filter((e) => e.projectId === projectId);
}

export function getTeamMemberProjects(memberName: string): VanhaasterProject[] {
  return VANHAASTER_PROJECTS.filter((p) => p.lead === memberName);
}

export function getAgentProjects(agentId: string): VanhaasterProject[] {
  return VANHAASTER_PROJECTS.filter((p) => p.agentSupport.includes(agentId));
}
