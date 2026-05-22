export type FundaListing = {
  id: string;
  url: string;
  address: string;
  postcode: string;
  city: string;
  price: string;
  priceNum: number | null;
  livingArea: string;
  plotArea: string;
  rooms: string;
  energyLabel: string;
  agent: string;
  propertyType: string;
  imageUrl: string | null;
  isOwnOffice: boolean;
};

export type FundaCompetitorStat = {
  numId: string;
  name: string;
  url: string;
  count: number;
  sharePct: number;
  isOwnOffice: boolean;
};

export type FundaScrapeResult = {
  area: string;
  region: string;
  scrapedAt: string;
  totalCount: number;
  listings: FundaListing[];
  stats: {
    avgPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    schenkelCount: number;
    competitors: FundaCompetitorStat[];
  };
};
