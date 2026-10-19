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
    print(config: unknown, data: (
      | { type: 'raw'; format: 'command'; flavor: 'plain'; data: string }
      // QZ convierte la imagen a raster ESC/POS en la PC antes de enviarla a la impresora.
      | { type: 'raw'; format: 'image'; flavor: 'base64'; data: string; options: { language: 'ESCPOS'; dotDensity: 'single' | 'double' } }
    )[]): Promise<void>;
    socket: { open(host: string, port: number): Promise<void>; close(host: string, port: number): Promise<void> };
  }
  const qz: Qz;
  export default qz;
}
