export const ADMIN_VERTICAL_LEAD_TARGET = 2000;

export type AdminVerticalHubRow = {
  id: string;
  name: string;
  status: "active" | "planned";
  businessCount: number;
  withEmail: number;
  leadTarget: number;
  mail: {
    concept: number;
    /** Bedrijven met e-mail (pool voor mail-concepten). */
    pool: number;
    sent: number;
    booked: number;
    followupReady: number;
    demoClicked: number;
  };
};

export type AdminVerticalSummariesResponse = {
  rows: AdminVerticalHubRow[];
  updatedAt: string;
};
