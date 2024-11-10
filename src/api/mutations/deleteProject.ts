import { API_URL } from "../consts";

export interface DeleteProjectInput {
  id: string;
  shouldDeleteWorkEntries: boolean;
}

export const deleteProject = async (data: DeleteProjectInput): Promise<any> => {
  const response = await fetch(`${API_URL}/project/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("An error occurred while deleting the project");
  }

  const responseData = await response.json();

  return responseData;
};
