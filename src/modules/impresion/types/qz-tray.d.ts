declare module 'qz-tray' {
  interface Qz {
    api: { setSha256Type(hasher: (message: string) => Promise<string>): void };
    websocket: { isActive(): boolean; connect(options?: { retries?: number; delay?: number }): Promise<void> };
    security: {
      setCertificatePromise(callback: (resolve: (certificate: string | null) => void, reject: (error: unknown) => void) => void): void;
      setSignatureAlgorithm(algorithm: string): void;
      setSignaturePromise(callback: (message: string) => (resolve: (signature: string) => void, reject: (error: unknown) => void) => void): void;
    };
    configs: { create(printer: { host: string; port: number }, options?: Record<string, unknown>): unknown };
    print(config: unknown, data: { type: 'raw'; format: 'command'; flavor: 'plain'; data: string }[]): Promise<void>;
    socket: { open(host: string, port: number): Promise<void>; close(host: string, port: number): Promise<void> };
  }
  const qz: Qz;
  export default qz;
}
