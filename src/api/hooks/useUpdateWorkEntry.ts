import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkEntry } from "../../types/workEntry";
import { updateWorkEntry } from "../mutations/updateWorkEntry";

export function useUpdateWorkEntry() {
  const queryClient = useQueryClient();

  const mutation = useMutation<WorkEntry, Error, WorkEntry>({
    mutationFn: async (input: WorkEntry) => {
      return updateWorkEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "workEntries",
      });
    },
  });

  return {
    updateWorkEntry: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
