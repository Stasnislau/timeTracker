import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../queries/getProjects";

export const useProjects = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  return {
    projects: data,
    isLoading,
    error,
  };
};
