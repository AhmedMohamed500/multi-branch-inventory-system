# Backend Integration Contract

## API shape

الاستجابة العامة: `{ success: boolean, data: T, message?: string }`. القوائم: `{ data: T[], page, pageSize, total, totalPages }`. الخطأ: `{ code, message, details? }`.

## Endpoints المقترحة

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST /api/branches`, `GET|PATCH /api/branches/:id`
- `GET|POST /api/products`, `GET|PATCH /api/products/:id`
- `GET /api/inventory?branchId=&productId=&status=&page=&pageSize=`
- `GET /api/stock-movements?branchId=&productId=&from=&to=`
- `GET|POST /api/transfers`, `PATCH /api/transfers/:id/status`
- `GET|POST /api/suppliers`, `PATCH /api/suppliers/:id`
- `GET|POST /api/purchase-receipts`
- `GET|POST /api/stock-counts`, `POST /api/stock-counts/:id/post`
- `GET /api/reports/inventory-value`, `GET /api/reports/low-stock`
- `GET|POST /api/users`, `PATCH /api/users/:id`
- `GET /api/notifications`, `GET /api/audit-logs`

طلبات الكتابة تستخدم JSON مطابقًا للواجهات في `types/index.ts`. يلزم Bearer token حقيقي، وتطبيق الصلاحيات على الخادم: Admin، Branch Manager، Storekeeper، Auditor، Viewer.

لا تعتمد على تحقق الواجهة لحماية العمليات أو تحديث الرصيد. التحويل والاستلام والجرد يجب أن تكون معاملات ذرية داخل Backend. لتفعيل الربط، استخدم `NEXT_PUBLIC_API_BASE_URL` واستبدل Mock implementations داخل `services/` دون تعديل Components.
