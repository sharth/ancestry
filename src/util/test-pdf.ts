// Builds a small PDF for tests: one page per size (width x height in
// points), each filled black, with a correct cross-reference table.
export function testPdf(name: string, pageSizes: [number, number][]): File {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageSizes.map((_, i) => `${3 + 2 * i} 0 R`).join(" ")}] /Count ${pageSizes.length} >>`,
    ...pageSizes.flatMap(([width, height], i) => {
      const content = `0 g 0 0 ${width} ${height} re f`;
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${4 + 2 * i} 0 R >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      ];
    }),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new File([pdf], name, { type: "application/pdf" });
}
