import { API_URL } from "../consts";
import { GenerateReportInput } from "../../types/generateReportInpu";

export const generateReport = async (
  data: GenerateReportInput
): Promise<void> => {
  const response = await fetch(`${API_URL}/report/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("An error occurred while generating the report");
  }

  const blob = await response.blob();

  const fileName = `time_report_${data.startDate.split("T")[0]}_${
    data.endDate.split("T")[0]
  }.${data.type}`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
