import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject, DeleteProjectInput } from "../mutations/deleteProject";

export function useDeleteProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, DeleteProjectInput>({
    mutationFn: async (input: DeleteProjectInput) => {
      return deleteProject(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "projects",
      });
    },
  });

  return {
    deleteProject: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
