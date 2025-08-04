// Global Deno type declarations for Supabase Edge Functions

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
      delete(key: string): void;
      toObject(): Record<string, string>;
    };
    errors: {
      NotFound: typeof Error;
      PermissionDenied: typeof Error;
      ConnectionRefused: typeof Error;
      ConnectionReset: typeof Error;
      ConnectionAborted: typeof Error;
      NotConnected: typeof Error;
      AddrInUse: typeof Error;
      AddrNotAvailable: typeof Error;
      BrokenPipe: typeof Error;
      AlreadyExists: typeof Error;
      InvalidData: typeof Error;
      TimedOut: typeof Error;
      Interrupted: typeof Error;
      WouldBlock: typeof Error;
      WriteZero: typeof Error;
      UnexpectedEof: typeof Error;
      BadResource: typeof Error;
      Http: typeof Error;
      Busy: typeof Error;
      NotSupported: typeof Error;
    };
  };
}

export {};
