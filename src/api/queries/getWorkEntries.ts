import { API_URL } from "../consts";
import { WorkEntry } from "../../types/workEntry"
import { LoadMoreResponse } from "../../types/loadMoreResponse";
import { LoadMoreRequest } from "../../types/requests/loadMoreRequest";

export const getWorkEntries = async (loadMoreRequest: LoadMoreRequest) => {
  const response = await fetch(`${API_URL}/work/all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loadMoreRequest),
  });
  const data = (await response.json()) as LoadMoreResponse<WorkEntry>;
  if (!data.success) {
    throw new Error("Failed to get work entries");
  }
  return data.payload;
};
