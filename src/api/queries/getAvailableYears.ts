import { API_URL } from "../consts";
import { LoadMoreResponse } from "../../types/loadMoreResponse";
import { BaseResponse } from "../../types/baseResponse";

export const getAvailableYears = async () => {
  const response = await fetch(`${API_URL}/work/years`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = (await response.json()) as BaseResponse<string[]>;
  if (!data.success) {
    throw new Error("Failed to get available years");
  }
  return data.payload;
};
