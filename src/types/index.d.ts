
declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}

declare module 'papaparse' {
  export function unparse(data: any): string;
}
