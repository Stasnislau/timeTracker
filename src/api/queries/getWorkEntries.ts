import { API_URL } from "../consts";
import { BaseResponse } from "../../types/baseResponse";
import { WorkEntry } from "../../types/workEntry"

export const getWorkEntries = async () => {
  const response = await fetch(`${API_URL}/work/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = (await response.json()) as BaseResponse<WorkEntry[]>;
  if (!data.success) {
    throw new Error("Failed to get available models");
  }
  return data.payload;
};
