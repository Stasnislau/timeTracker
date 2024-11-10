import { API_URL } from "../consts";

import { WorkEntry } from "../../types/workEntry";

export async function updateWorkEntry(
  data: WorkEntry
): Promise<any> {
  const response = await fetch(`${API_URL}/work/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("An error occurred while updating the work entry");
  }

  const responseData = await response.json();

  return responseData;
}
