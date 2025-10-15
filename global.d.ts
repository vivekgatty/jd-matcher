// global.d.ts — project root

// Shims so TS understands the browser builds we import dynamically
declare module "pdfjs-dist/build/pdf" {
  const anything: any;
  export = anything;
}

declare module "mammoth/mammoth.browser" {
  const anything: any;
  export = anything;
}
