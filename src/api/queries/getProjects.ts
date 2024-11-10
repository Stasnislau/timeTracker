import { API_URL } from "../consts";
import { BaseResponse } from "../../types/baseResponse";
import { Project } from "../../types/project";

export const getProjects = async () => {
  const response = await fetch(`${API_URL}/project/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = (await response.json()) as BaseResponse<Project[]>;
  if (!data.success) {
    throw new Error("Failed to get available models");
  }
  return data.payload;
};
