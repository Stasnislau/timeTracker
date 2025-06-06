import { useInfiniteQuery } from "@tanstack/react-query";
import { getWorkEntries } from "../queries/getWorkEntries";

export const useWorkEntries = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ["workEntries"],
    queryFn: ({ pageParam }) => getWorkEntries({ monthCursor: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
    initialPageParam: new Date().toISOString()
  });

  const workEntries = data?.pages.flatMap(page => page.items) ?? [];

  return {
    workEntries,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
};
