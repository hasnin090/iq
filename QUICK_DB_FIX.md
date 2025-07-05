# ⚡ فحص سريع لحالة الاتصال

## 🔴 إذا كان الموقع لا يتصل بقاعدة البيانات

### فحص فوري (دقيقة واحدة):

1. **اختبر API Status:**
   ```
   اذهب إلى: [your-site-url]/api/db-status
   
   إذا رأيت:
   ✅ "قاعدة البيانات متصلة وتعمل بشكل طبيعي" = كل شيء يعمل
   ❌ "قاعدة البيانات غير متصلة" = مشكلة في Environment Variables
   ❌ "الجداول غير موجودة" = مشكلة في Supabase SQL
   ```

2. **فحص Netlify Environment Variables:**
   ```
   يجب أن تحتوي على:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   
   ⚠️ تأكد من عدم وجود مسافات!
   ```

3. **فحص Supabase Tables:**
   ```
   يجب أن ترى في Table Editor:
   - accounts (7 rows)
   - documents (empty)
   - document_entries (empty)
   ```

## 🛠️ إصلاح سريع (5 دقائق)

### إذا فشل كل شيء:

1. **احذف Environment Variables في Netlify**
2. **أعد إنشاءها:**
   ```
   VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOhc
   ```

3. **أعد تشغيل SQL في Supabase**
4. **أعد النشر:** Clear cache and deploy site
5. **انتظر 2-3 دقائق**
6. **اختبر:** `/api/db-status`

## 📞 أرسل لي النتائج

أرسل لي:
1. رابط موقعك
2. نتيجة `/api/db-status`
3. screenshot من Environment Variables
4. أي رسائل خطأ تراها

**سأحل المشكلة فوراً بمجرد رؤية النتائج!**
