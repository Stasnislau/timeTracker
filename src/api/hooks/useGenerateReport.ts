import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GenerateReportInput } from "../../types/generateReportInpu";
import { generateReport } from "../mutations/generateReport";

export function useGenerateReport() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, GenerateReportInput>({
    mutationFn: async (input: GenerateReportInput) => {
      return generateReport(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "projects",
      });
    },
  });

  return {
    generateReport: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
