import { useQuery } from "@tanstack/react-query";
import { getAvailableYears } from "../queries/getAvailableYears";

export const useAvailableYears = () => {
  const {
    data: availableYears,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["availableYears"],
    queryFn: () => getAvailableYears(),
  });

  return {
    availableYears,
    isLoading,
    error,
  };
};
