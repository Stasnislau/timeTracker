import { WorkEntry } from "../../types/workEntry";
import { API_URL } from "../consts";

export interface CreateWorkEntryInput {
  projectId: string;
  startTime: Date;
  endTime: Date;
  description: string;
}

export const createWorkEntry = async (
  data: CreateWorkEntryInput
): Promise<WorkEntry> => {
  const response = await fetch(`${API_URL}/work/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      description: data.description || "",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create work entry");
  }

  return response.json();
};
