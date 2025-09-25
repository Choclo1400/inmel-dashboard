// Type definitions for Supabase Edge Functions
export {}

declare global {
  const Deno: {
    serve: (handler: (request: Request) => Response | Promise<Response>) => void;
    env: {
      get: (key: string) => string | undefined;
    };
  };
}