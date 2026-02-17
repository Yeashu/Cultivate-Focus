export async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (response.status === 204) {
      return null;
    }
    console.warn("Failed to parse JSON response", error);
    return null;
  }
}

export async function readErrorMessage(response: Response): Promise<string> {
  const data = await readJson<{ message?: string }>(response);
  const fallback = response.statusText || "Unexpected error";
  return data?.message ?? fallback;
}
