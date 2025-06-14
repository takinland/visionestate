const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const supabase = createClient(
  'https://tdvimwqotnuvcdvhvbjj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

module.exports = async (req, res) => {
  const { id, lang } = req.query;

  if (!id || !lang) {
    return res.status(400).send('Missing id or lang parameter');
  }

  const { data, error } = await supabase
    .from('laws')
    .select('*')
    .eq('law_id', id)
    .single();

  if (error || !data) {
    return res.status(404).send('Law not found');
  }

  const textField = lang === 'fa' ? 'pdf_text_fa' :
                    lang === 'en' ? 'pdf_text_en' :
                    lang === 'ru' ? 'pdf_text_ru' :
                    'pdf_text_original';

  const titleField = lang === 'fa' ? 'title_fa' :
                     lang === 'en' ? 'title_en' :
                     lang === 'ru' ? 'title_ru' :
                     'title_original';

  const title = data[titleField] || '';
  const body = data[textField] || '';

  // قالب HTML اولیه (راست‌چین برای فارسی)
  const direction = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr';
  const fontFamily = lang === 'fa' ? `'Tahoma', sans-serif` : `'Arial', sans-serif`;

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            direction: ${direction};
            font-family: ${fontFamily};
            padding: 40px;
            line-height: 1.8;
            font-size: 16px;
            white-space: pre-line;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${body}
      </body>
    </html>
  `;

  // تولید PDF با puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  // ارسال PDF به مرورگر کاربر
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${id}_${lang}.pdf"`);
  res.send(pdfBuffer);
};
