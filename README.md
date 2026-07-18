# Multi-Branch Inventory Management System

واجهة Frontend تجريبية احترافية لإدارة مخزون 6 فروع. لا يحتوي المشروع على Backend أو قاعدة بيانات؛ كل العمليات الحالية تستخدم Mock Data وواجهة Services قابلة للاستبدال لاحقًا.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:3000`.

بيانات الدخول: `admin@demo.com` / `Demo@123`

## الصفحات والمزايا

Dashboard، الفروع، المنتجات، المخزون، الحركات، التحويلات، استلام المشتريات، الجرد، الموردون، التقارير، المستخدمون، سجل النشاط، الإعدادات والملف الشخصي. يدعم العربية/الإنجليزية وRTL/LTR والوضع الداكن والبحث والفلاتر وCSV والطباعة وMock CRUD.

يمكن اختبار حالات الواجهة بإضافة `?state=loading` أو `?state=empty` أو `?state=error`.

## الجودة

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

لإعادة الضبط استخدم زر إعادة ضبط البيانات في صفحة الإعدادات.
