export interface LoadMoreResponse<T> {
  success: boolean;
  payload: {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}
