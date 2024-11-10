import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateProjectInput } from "../mutations/createProject";
import { Project } from "../../types/project";
import { createProject } from "../mutations/createProject";

export function useCreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Project, Error, CreateProjectInput>({
    mutationFn: async (input: CreateProjectInput) => {
      return createProject(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "projects",
      });
    },
  });

  return {
    createProject: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
