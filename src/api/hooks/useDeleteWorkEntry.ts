import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWorkEntry } from "../mutations/deleteWorkEntry";
import { WorkEntry } from "../../types/workEntry";

export function useDeleteWorkEntry() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      return deleteWorkEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "workEntries",
      });
    },
  });

  return {
    deleteWorkEntry: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
