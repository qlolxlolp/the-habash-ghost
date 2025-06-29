import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest<T = any>(
  method: string = "GET",
  url: string,
  data?: any,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important for session cookies
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }

  return response;
}

export function getQueryFn<T = any>(options?: { on401?: string }) {
  return async (context: { queryKey: string[] }): Promise<T> => {
    try {
      const url = context.queryKey[0];
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for session cookies
      });

      if (response.status === 401) {
        if (options?.on401 === "returnNull") {
          return null as T;
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (
        options?.on401 === "returnNull" &&
        error instanceof Error &&
        error.message.includes("401")
      ) {
        return null as T;
      }
      throw error;
    }
  };
}
