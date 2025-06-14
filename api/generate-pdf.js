const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tdvimwqotnuvcdvhvbjj.supabase.co'; // ← جایگزین کن اگر تغییر کرده
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';     // ← کلید عمومی آنون (همونی که تو HTML استفاده کردی)
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // انتخاب متن مناسب با توجه به lang
  const textField = lang === 'fa' ? 'pdf_text_fa' :
                    lang === 'en' ? 'pdf_text_en' :
                    lang === 'ru' ? 'pdf_text_ru' :
                    'pdf_text_original';

  const text = data[textField];

  if (!text) {
    return res.status(404).send('Translation not available');
  }

  // ذخیره برای مرحله بعد
  res.status(200).send(`✅ Data received for ${id} (${lang})\n\n${text}`);
};
