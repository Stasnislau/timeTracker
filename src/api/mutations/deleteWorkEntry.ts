import { API_URL } from "../consts";

export const deleteWorkEntry = async (id: string): Promise<any> => {
  const url = `${API_URL}/work/delete?id=${id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("An error occurred while deleting the work entry");
  }

  const responseData = await response.json();

  return responseData;
};
