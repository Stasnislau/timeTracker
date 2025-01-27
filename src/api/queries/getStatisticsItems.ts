import { API_URL } from "../consts";
import { StatisticsRequest } from "../../types/requests/statisticsRequest";
import { StatisticsItem } from "../../types/statisticsItem";
import { BaseResponse } from "../../types/baseResponse";

export const getStatisticsItems = async (statisticsRequest: StatisticsRequest) => {
  const response = await fetch(`${API_URL}/work/statistics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(statisticsRequest),
  });
  const data = (await response.json()) as BaseResponse<StatisticsItem[]>;
  if (!data.success) {
    throw new Error("Failed to get statistics items");
  }
  return data.payload;
};
