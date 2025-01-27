import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getStatisticsItems } from "../queries/getStatisticsItems";
import { StatisticsRequest } from "../../types/requests/statisticsRequest";

export const useStatistics = (statisticsRequest: StatisticsRequest) => {
  const { data: statisticsItems, isLoading, error } = useQuery({
    queryKey: ["statistics", statisticsRequest],
    queryFn: () => getStatisticsItems(statisticsRequest),
  });

  return {
    statisticsItems,
    isLoading,
    error,
  };
};
