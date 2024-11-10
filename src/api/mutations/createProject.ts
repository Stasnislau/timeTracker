import { API_URL } from "../consts";

export interface CreateProjectInput {
  name: string;
}

export const createProject = async (data: CreateProjectInput): Promise<any> => {
  const url = `${API_URL}/project/create`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("An error occurred while creating the project");
  }

  const responseData = await response.json();

  return responseData;
};
