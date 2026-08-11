# Implementation Plan: MiniERP Frontend UI

## Overview

Triển khai giao diện Frontend hoàn chỉnh cho hệ thống MiniERP theo thiết kế đã đề ra. Kế hoạch chia thành các bước tăng dần: sửa lỗi hiện tại → xây dựng foundation (types, API, AuthContext) → triển khai từng trang → wiring toàn bộ trong App.tsx.

**Language:** TypeScript (React 19 + Ant Design 6 + Axios + React Router v7)

---

## Tasks

- [x] 1. Cập nhật TypeScript types
  - [x] 1.1 Rewrite `src/types/product.ts`
    - Thay `id: number` thành `productId: number`, thêm `sKU`, `categoryName`, `isLowStock`
    - Thêm interface `UpdateProductDto` và `ProductQueryParams`
    - _Requirements: 2.1_

  - [x] 1.2 Tạo `src/types/category.ts`
    - Định nghĩa interfaces `Category`, `CreateCategoryDto`, `UpdateCategoryDto`
    - _Requirements: 4.1, 10.2_

  - [x] 1.3 Tạo `src/types/order.ts`
    - Định nghĩa type `OrderStatus`, interfaces `OrderDetail`, `Order`, `CreateOrderDto`, `CreateOrderItem`, `UpdateOrderStatusDto`
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 10.3_

  - [x] 1.4 Tạo `src/types/dashboard.ts`
    - Định nghĩa interface `DashboardDto` (import từ `product.ts` và `order.ts`)
    - _Requirements: 3.1, 10.4_

  - [x] 1.5 Tạo `src/types/auditLog.ts`
    - Định nghĩa interface `AuditLog` với các trường: `logId`, `userId`, `action`, `tableName`, `recordId`, `oldValues`, `newValues`, `timestamp`
    - _Requirements: 7.1, 10.5_

- [x] 2. Xây dựng API modules
  - [x] 2.1 Rewrite `src/api/productApi.ts`
    - Sửa endpoint từ `/products` thành `/product`
    - Thêm `getById()` và hỗ trợ `ProductQueryParams` trong `getAll()`
    - Cập nhật tất cả methods dùng `productId` thay vì `id`
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 2.2 Tạo `src/api/categoryApi.ts`
    - Implement `getAll()`, `getById()`, `create()`, `update()`, `delete()` gọi đến `/category`
    - _Requirements: 10.2_

  - [x] 2.3 Tạo `src/api/orderApi.ts`
    - Implement `getAll()`, `getById()`, `create()`, `updateStatus()` gọi đến `/order` và `/order/{id}/status`
    - _Requirements: 10.3_

  - [x] 2.4 Tạo `src/api/dashboardApi.ts`
    - Implement `getSummary()` gọi `GET /dashboard`
    - _Requirements: 10.4_

  - [x] 2.5 Tạo `src/api/auditLogApi.ts`
    - Implement `getAll()` gọi `GET /auditlog`
    - _Requirements: 10.5_

- [x] 3. Xây dựng AuthContext và RoleGuard
  - [x] 3.1 Tạo `src/contexts/AuthContext.tsx`
    - Định nghĩa `AuthState`, `AuthContextValue` interfaces
    - Implement `AuthProvider`: đọc trạng thái ban đầu từ `localStorage`, cung cấp `login()` (lưu `token`, `username`, `roleName`) và `logout()` (xóa `localStorage`)
    - Export hook `useAuth()`
    - Chuẩn hóa localStorage key thành `roleName` (không dùng `role`)
    - _Requirements: 1.5, 1.6, 9.1_

  - [x] 3.2 Tạo `src/components/RoleGuard.tsx`
    - Component nhận props `roles`, `children`, `fallback?`
    - Dùng `useAuth()` để lấy `roleName`, chỉ render `children` nếu role được phép
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 3.3 Cập nhật `src/components/PrivateRoute.tsx`
    - Thêm component `RoleRoute` (nhận props `roles`, `redirectTo?`)
    - `RoleRoute` wrap `<Outlet />`, redirect về `/dashboard` nếu role không hợp lệ
    - _Requirements: 1.3, 7.2, 9.5_

  - [ ]* 3.4 Viết unit tests cho AuthContext và RoleGuard
    - Test `login()` lưu đúng giá trị vào `localStorage` và context state
    - Test `logout()` xóa `localStorage` và reset context state
    - Test `RoleGuard` render/ẩn children đúng cho từng role (Admin, InventoryManager, Sales)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 4. Checkpoint — Đảm bảo foundation hoạt động
  - Đảm bảo tất cả types compile không có lỗi, các API modules export đúng, AuthContext và RoleGuard hoạt động. Hỏi người dùng nếu có vấn đề.

- [x] 5. Cập nhật MainLayout và Login
  - [x] 5.1 Cập nhật `src/components/MainLayout.tsx`
    - Đọc `username` và `roleName` từ `useAuth()` thay vì `localStorage` trực tiếp
    - Implement hàm `buildMenuItems(roleName)` để tạo menu động theo role
    - Thêm các menu items: Dashboard, Sản phẩm, Danh mục, Đơn hàng; chỉ Admin thấy Audit Log
    - Xóa mục `/users` khỏi menu
    - Gọi `authContext.logout()` khi nhấn nút Đăng xuất
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 9.1_

  - [x] 5.2 Cập nhật `src/pages/Login.tsx`
    - Gọi `authContext.login(token, username, roleName)` sau khi API thành công (thay vì ghi thẳng localStorage)
    - Đảm bảo localStorage key dùng `roleName` (không phải `role`)
    - _Requirements: 1.1, 1.2_

  - [ ]* 5.3 Viết unit tests cho `buildMenuItems`
    - Cho mỗi role (Admin, InventoryManager, Sales), assert đúng menu items được trả về
    - Admin: 5 items (bao gồm Audit Log); InventoryManager/Sales: 4 items (không có Audit Log)
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 6. Rewrite Dashboard
  - [x] 6.1 Rewrite `src/pages/Dashboard.tsx`
    - State: `data: DashboardDto | null`, `loading: boolean`, `error: string | null`
    - Gọi `dashboardApi.getSummary()` khi mount, hiển thị loading trên các card
    - Hiển thị 4 Statistic cards: `totalRevenue`, `totalOrders`, `totalProducts`, `lowStockProductsCount`
    - Format `totalRevenue` bằng `viCurrencyFormatter` (`toLocaleString('vi-VN')` + " VNĐ")
    - Hiển thị `Alert` + nút "Thử lại" khi API thất bại
    - Hiển thị bảng `lowStockProducts` (columns: sKU, productName, stockQuantity, categoryName; rowKey="productId")
    - Hiển thị bảng `recentOrders` (columns: orderCode, customerName, totalAmount, status badge, orderDate)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 6.2 Viết integration test cho Dashboard
    - Mock `GET /api/dashboard` bằng MSW, assert 4 KPI cards render với giá trị đúng
    - Mock API lỗi, assert Alert và nút "Thử lại" hiển thị
    - _Requirements: 3.1, 3.3_

- [x] 7. Rewrite Products
  - [x] 7.1 Rewrite `src/pages/Products.tsx`
    - Cập nhật state và table dùng `productId`, `sKU`, `categoryName`, `isLowStock`
    - `rowKey="productId"`, column "Tồn Kho" hiển thị `<Tag color="warning">Sắp hết</Tag>` khi `isLowStock === true`
    - Column "Danh Mục" hiển thị `categoryName` thay vì `categoryId`
    - Filter bar: `<Input.Search>` debounce 400ms → gọi `fetchProducts(search, categoryId)`; `<Select>` categories dropdown → gọi `fetchProducts` với `categoryId`
    - Load categories từ `categoryApi.getAll()` khi mount để dùng cho filter và modal form
    - Modal form: field `categoryId` dùng `<Select>` populate từ categories (không phải InputNumber)
    - `handleSave` dùng `editingProduct.productId` (không phải `id`)
    - Áp dụng `RoleGuard` cho nút Thêm (`Admin`, `InventoryManager`), nút Sửa (`Admin`, `InventoryManager`), nút Xóa (`Admin`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 7.2 Viết integration test cho Products
    - Mock `GET /api/product` và `GET /api/category`, assert bảng hiển thị đúng dữ liệu
    - Assert tag "Sắp hết" hiển thị đúng khi `isLowStock = true`
    - Assert nút Thêm/Sửa/Xóa ẩn đúng theo role Sales
    - _Requirements: 5.2, 5.7_

- [x] 8. Tạo trang Categories
  - [x] 8.1 Tạo `src/pages/Categories.tsx`
    - State: `categories`, `loading`, `isModalOpen`, `editingCategory`, `form`
    - Gọi `categoryApi.getAll()` khi mount
    - Table columns: `categoryName`, `description`, `totalProducts`; `rowKey="categoryId"`
    - Header: nút "Thêm Danh Mục" bọc trong `<RoleGuard roles={["Admin","InventoryManager"]}>`
    - Column Thao Tác: nút Sửa bọc `<RoleGuard roles={["Admin","InventoryManager"]}>`, nút Xóa bọc `<RoleGuard roles={["Admin"]}>`
    - Modal form fields: `categoryName` (Input, required), `description` (Input.TextArea, optional)
    - `handleSave`: `categoryApi.update()` hoặc `categoryApi.create()` → `fetchCategories()`
    - `handleDelete`: `Popconfirm` → `categoryApi.delete()` → `fetchCategories()`
    - Hiển thị `message.error()` khi API thất bại
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 8.2 Viết unit tests cho Categories
    - Assert nút Thêm/Sửa hiển thị cho Admin và InventoryManager, ẩn cho Sales
    - Assert nút Xóa chỉ hiển thị cho Admin
    - _Requirements: 4.5, 4.6_

- [x] 9. Tạo trang Orders
  - [x] 9.1 Tạo `src/pages/Orders.tsx`
    - State: `orders`, `products`, `loading`, `isCreateModalOpen`, `isStatusModalOpen`, `selectedOrder`, `form`
    - Gọi `orderApi.getAll()` và `productApi.getAll()` khi mount
    - Implement hàm `statusConfig` cho PENDING/APPROVED/CANCELLED với màu badge và nhãn tiếng Việt
    - Table columns: `orderCode`, `orderDate` (format `DD/MM/YYYY HH:mm`), `customerName`, `customerPhone`, `totalAmount` (viCurrencyFormatter), `status` (badge), `createdByUsername`; `rowKey="orderId"`
    - Expandable rows: hiển thị `details[]` với columns `productName`, `quantity`, `unitPrice`, `subTotal`
    - Header: nút "Tạo Đơn Hàng" (hiển thị với tất cả roles)
    - Create Order modal: fields `customerName`, `customerPhone`; `Form.List` cho `items` (mỗi item có `productId` Select và `quantity` InputNumber); nút thêm/xóa dòng sản phẩm
    - `handleCreateOrder`: `orderApi.create()` → `fetchOrders()`
    - Column Thao Tác: nút "Cập nhật TT" bọc `<RoleGuard roles={["Admin","InventoryManager"]}>`
    - Update Status modal: `<Select>` với options PENDING/APPROVED/CANCELLED → `orderApi.updateStatus()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 9.2 Viết unit tests cho status badge mapping
    - Cho mỗi giá trị `OrderStatus` (PENDING, APPROVED, CANCELLED), assert đúng color và label trong `statusConfig`
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 10. Tạo trang AuditLog
  - [x] 10.1 Tạo `src/pages/AuditLog.tsx`
    - State: `logs`, `loading`
    - Gọi `auditLogApi.getAll()` khi mount
    - Handle HTTP 403: hiển thị `<Alert type="error" message="Bạn không có quyền truy cập trang này">` thay vì crash
    - Table columns: `timestamp` (dayjs format), `userId`, `action`, `tableName`, `recordId`, `oldValues` (ellipsis), `newValues` (ellipsis); `rowKey="logId"`
    - _Requirements: 7.1, 7.4_

- [x] 11. Checkpoint — Đảm bảo tất cả trang hoạt động độc lập
  - Đảm bảo các trang mới (Categories, Orders, AuditLog) compile và render không lỗi. Hỏi người dùng nếu có vấn đề.

- [x] 12. Wiring — Cập nhật App.tsx và đăng ký routes
  - [x] 12.1 Cập nhật `src/App.tsx`
    - Bọc toàn bộ `<Routes>` trong `<AuthProvider>`
    - Thêm routes: `/categories` → `<Categories />`, `/orders` → `<Orders />`
    - Thêm route `/audit-log` bọc trong `<RoleRoute roles={["Admin"]}>` → `<AuditLog />`
    - Đổi redirect mặc định `path="*"` về `/dashboard`
    - Thêm route `path="/"` redirect về `/dashboard`
    - _Requirements: 7.2, 8.5, 8.6_

  - [ ]* 12.2 Viết integration test cho route protection
    - Mock localStorage với role InventoryManager, điều hướng đến `/audit-log`, assert redirect về `/dashboard`
    - Mock không có token, điều hướng đến `/dashboard`, assert redirect về `/login`
    - _Requirements: 1.3, 7.2, 9.5_

- [x] 13. Final Checkpoint — Đảm bảo toàn bộ ứng dụng hoạt động
  - Chạy `tsc --noEmit` để kiểm tra không có TypeScript error. Chạy tất cả unit/integration tests. Đảm bảo tất cả routes đăng ký đúng và phân quyền hoạt động chính xác. Hỏi người dùng nếu có vấn đề.

---

## Notes

- Tasks đánh dấu `*` là optional (test tasks) — có thể bỏ qua để đạt MVP nhanh hơn
- Mỗi task tham chiếu yêu cầu cụ thể để đảm bảo traceability
- Thứ tự thực hiện quan trọng: Types → API → AuthContext/RoleGuard → Layout → Pages → Wiring
- `viCurrencyFormatter`: `(val) => \`${Number(val).toLocaleString('vi-VN')} VNĐ\``
- `dayjs` cần được cài nếu chưa có (`npm install dayjs`); hoặc dùng `new Date().toLocaleString('vi-VN')` nếu không muốn thêm dependency
- Các module test dùng Vitest + React Testing Library; integration tests dùng MSW để mock API
