export type GenerateReportInput = {
  projectId?: string;
  startDate: string;
  endDate: string;
  type: "csv" | "xlsx";
};
