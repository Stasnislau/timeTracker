export interface StatisticsRequest {
  type: "monthly" | "yearly" | "total";
  month: number;
  year: number;
  projectId?: string;
}
