// pdf-parse v1.x has no TypeScript declarations
declare module "pdf-parse" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }
  function pdf(
    dataBuffer: Buffer,
    options?: { pagerender?: (pageData: unknown) => string; max?: number },
  ): Promise<PdfData>;
  export default pdf;
}
