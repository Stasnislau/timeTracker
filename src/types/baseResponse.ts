export type BaseResponse<T> = {
  success: boolean;
  payload: T;
};
