// File: /api/generate-pdf.js

import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tdvimwqotnuvcdvhvbjj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdmltd3FvdG51dmNkdmh2YmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDY2MjcsImV4cCI6MjA2NDY4MjYyN30.CWNPk-S-ECq0c1LRugDJYOchY3mgC2Zchyr8X8-mDeE"
);

export default async function handler(req, res) {
  const { id, lang } = req.query;

  if (!id || !lang) {
    return res.status(400).send("Missing id or lang");
  }

  const { data, error } = await supabase
    .from("laws")
    .select("law_id, title_en, title_fa, title_original, title_ru, pdf_text_en, pdf_text_fa, pdf_text_ru")
    .eq("law_id", id)
    .single();

  if (error || !data) {
    return res.status(404).send("Law not found");
  }

  const title =
    lang === "fa"
      ? data.title_fa
      : lang === "ru"
      ? data.title_ru
      : lang === "tr"
      ? data.title_original
      : data.title_en;

  const body =
    lang === "fa"
      ? data.pdf_text_fa
      : lang === "ru"
      ? data.pdf_text_ru
      : lang === "tr"
      ? data.pdf_text_original
      : data.pdf_text_en;

  const html = `
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: sans-serif; padding: 40px; line-height: 1.8; }
        h1 { font-size: 24px; margin-bottom: 16px; }
        .law-text { white-space: pre-line; }
        html[lang="fa"] body { direction: rtl; font-family: Tahoma, sans-serif; }
        html[lang="ru"] body { font-family: DejaVu Sans, sans-serif; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="law-text">${body}</div>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=law-${id}-${lang}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
}
