import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkEntry } from "../mutations/createWorkEntry";
import { CreateWorkEntryInput } from "../mutations/createWorkEntry";
import { WorkEntry } from "../../types/workEntry";

export function useCreateWorkEntry() {
  const queryClient = useQueryClient();

  const mutation = useMutation<WorkEntry, Error, CreateWorkEntryInput>({
    mutationFn: async (input: CreateWorkEntryInput) => {
      return createWorkEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "workEntries",
      });
    },
  });

  return {
    createWorkEntry: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
