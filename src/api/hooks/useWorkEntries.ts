import { useQuery } from "@tanstack/react-query";
import { getWorkEntries } from "../queries/getWorkEntries";

export const useWorkEntries = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workEntries"],
    queryFn: () => getWorkEntries(),
  });

  return {
    workEntries: data,
    isLoading,
    error,
  };
};
