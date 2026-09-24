export const createClient = (_cookieStore?: any) => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase inactive"),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase inactive"),
      }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          in: async () => ({ data: [], error: null }),
        }),
        in: () => ({ data: [], error: null }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({
        eq: async () => ({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => ({
          in: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    rpc: async () => ({ data: null, error: null }),
  } as any;
};
