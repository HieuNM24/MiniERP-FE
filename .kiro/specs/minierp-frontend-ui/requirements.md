# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu xây dựng giao diện Frontend hoàn chỉnh cho hệ thống **MiniERP** — một hệ thống quản lý doanh nghiệp nhỏ gồm các nghiệp vụ: xác thực người dùng, quản lý sản phẩm, danh mục, đơn hàng, dashboard tổng quan, và audit log.

Frontend sử dụng stack: **React 19 + TypeScript + Ant Design 6 + Axios + React Router v7**, kết nối với Backend .NET đã có sẵn. Yêu cầu bao gồm sửa các lỗi hiện tại (type mismatch, hardcoded data), bổ sung các trang còn thiếu, và triển khai phân quyền dựa trên vai trò (role-based UI).

---

## Glossary

- **App**: Toàn bộ ứng dụng React MiniERP Frontend.
- **AuthService**: Module xử lý đăng nhập, đăng ký, lưu/xóa token JWT trong `localStorage`.
- **AxiosClient**: Instance Axios đã cấu hình base URL và interceptor JWT.
- **Dashboard**: Trang tổng quan hiển thị các chỉ số kinh doanh từ API `/api/dashboard`.
- **ProductPage**: Trang quản lý sản phẩm, tương tác với API `/api/product`.
- **CategoryPage**: Trang quản lý danh mục, tương tác với API `/api/category`.
- **OrderPage**: Trang quản lý đơn hàng, tương tác với API `/api/order`.
- **AuditLogPage**: Trang xem nhật ký kiểm toán, tương tác với API `/api/auditlog`.
- **MainLayout**: Component layout chính gồm Sidebar navigation và Header.
- **PrivateRoute**: Component bảo vệ route, yêu cầu JWT token hợp lệ.
- **RoleGuard**: Cơ chế hiển thị/ẩn UI element dựa trên `roleName` lưu trong `localStorage`.
- **JWT**: JSON Web Token được trả về sau khi đăng nhập thành công.
- **Admin**: Vai trò có toàn quyền — xem, tạo, sửa, xóa tất cả tài nguyên, bao gồm AuditLog.
- **InventoryManager**: Vai trò được tạo, sửa sản phẩm/danh mục, cập nhật trạng thái đơn hàng; không được xóa category hoặc xem AuditLog.
- **Sales**: Vai trò chỉ được tạo đơn hàng và xem sản phẩm/danh mục; không được sửa/xóa.
- **ProductDto**: `{ productId, sKU, productName, unitPrice, stockQuantity, categoryId, categoryName, isLowStock }`.
- **CategoryDto**: `{ categoryId, categoryName, description, totalProducts }`.
- **OrderDto**: `{ orderId, orderCode, orderDate, customerName, customerPhone, totalAmount, status, createdByUsername, details[] }`.
- **DashboardDto**: `{ totalRevenue, totalOrders, totalProducts, lowStockProductsCount, lowStockProducts[], recentOrders[] }`.
- **OrderStatus**: Giá trị enum: `PENDING`, `APPROVED`, `CANCELLED`.

---

## Requirements

### Requirement 1: Xác thực người dùng (Authentication)

**User Story:** Là một nhân viên, tôi muốn đăng nhập bằng tên đăng nhập và mật khẩu, để có thể truy cập vào hệ thống MiniERP.

#### Acceptance Criteria

1. WHEN người dùng gửi form đăng nhập với `username` và `password` hợp lệ, THE AuthService SHALL gọi `POST /api/auth/login`, lưu `token`, `username`, `roleName` vào `localStorage`, và điều hướng người dùng đến `/dashboard`.
2. WHEN người dùng gửi form đăng nhập với thông tin không hợp lệ, THE App SHALL hiển thị thông báo lỗi rõ ràng từ response của API mà không điều hướng trang.
3. WHEN người dùng truy cập bất kỳ route được bảo vệ nào mà không có JWT token trong `localStorage`, THE PrivateRoute SHALL chuyển hướng người dùng về `/login`.
4. WHEN AxiosClient nhận phản hồi HTTP 401 từ bất kỳ API nào, THE AxiosClient SHALL xóa `token` khỏi `localStorage` và điều hướng người dùng về `/login`.
5. WHEN người dùng nhấn nút "Đăng xuất", THE AuthService SHALL xóa toàn bộ dữ liệu trong `localStorage` và điều hướng người dùng về `/login`.
6. THE App SHALL duy trì trạng thái đăng nhập khi người dùng tải lại trang, bằng cách đọc token từ `localStorage`.

---

### Requirement 2: Sửa lỗi Type mismatch cho Product

**User Story:** Là một developer, tôi muốn kiểu dữ liệu Product trên Frontend khớp đúng với Backend DTO, để các thao tác CRUD không bị lỗi runtime hoặc compile error.

#### Acceptance Criteria

1. THE App SHALL định nghĩa interface `Product` với trường `productId: number` (thay thế `id: number` hiện tại) và bổ sung các trường `sKU`, `categoryName`, `isLowStock` theo đúng `ProductDto` từ Backend.
2. WHEN `productApi.update()` hoặc `productApi.delete()` được gọi, THE ProductPage SHALL truyền `product.productId` làm tham số định danh thay vì `product.id`.
3. THE `productApi` SHALL gọi đúng endpoint `GET /api/product`, `POST /api/product`, `PUT /api/product/{id}`, `DELETE /api/product/{id}` theo đúng cấu hình Backend (không dùng `/products`).
4. WHEN `productApi.getAll()` được gọi với tham số `search` hoặc `categoryId`, THE `productApi` SHALL đính kèm các query params tương ứng vào request URL.

---

### Requirement 3: Dashboard thực tế từ API

**User Story:** Là một quản lý, tôi muốn Dashboard hiển thị dữ liệu thực từ hệ thống, để có thể theo dõi tình trạng kinh doanh chính xác.

#### Acceptance Criteria

1. WHEN Dashboard được render, THE Dashboard SHALL gọi `GET /api/dashboard` và hiển thị `totalRevenue`, `totalOrders`, `totalProducts`, `lowStockProductsCount` dưới dạng các Statistic card.
2. WHILE Dashboard đang tải dữ liệu từ API, THE Dashboard SHALL hiển thị trạng thái loading trên các card thống kê.
3. IF `GET /api/dashboard` trả về lỗi, THEN THE Dashboard SHALL hiển thị thông báo lỗi và cho phép người dùng thử lại.
4. WHEN Dashboard nhận dữ liệu thành công, THE Dashboard SHALL hiển thị danh sách `lowStockProducts` (sản phẩm sắp hết hàng) dưới dạng bảng hoặc danh sách cảnh báo.
5. WHEN Dashboard nhận dữ liệu thành công, THE Dashboard SHALL hiển thị danh sách `recentOrders` (đơn hàng gần đây) dưới dạng bảng.
6. THE Dashboard SHALL format `totalRevenue` theo định dạng tiền tệ Việt Nam (`toLocaleString('vi-VN')` với đơn vị VNĐ).

---

### Requirement 4: Quản lý Danh mục (Categories)

**User Story:** Là một InventoryManager, tôi muốn xem, thêm và sửa danh mục sản phẩm, để có thể tổ chức hàng hóa theo nhóm.

#### Acceptance Criteria

1. WHEN CategoryPage được render, THE CategoryPage SHALL gọi `GET /api/category` và hiển thị danh sách `CategoryDto` dưới dạng bảng với các cột: `categoryName`, `description`, `totalProducts`.
2. WHEN Admin hoặc InventoryManager nhấn "Thêm Danh Mục", THE CategoryPage SHALL hiển thị form modal để nhập `categoryName` và `description`, sau đó gọi `POST /api/category`.
3. WHEN Admin hoặc InventoryManager nhấn "Sửa" trên một danh mục, THE CategoryPage SHALL hiển thị form modal điền sẵn dữ liệu và gọi `PUT /api/category/{id}` khi lưu.
4. WHEN Admin nhấn "Xóa" trên một danh mục, THE CategoryPage SHALL hiển thị hộp thoại xác nhận và gọi `DELETE /api/category/{id}` sau khi được xác nhận.
5. WHEN người dùng có role Sales truy cập CategoryPage, THE RoleGuard SHALL ẩn nút "Thêm Danh Mục", nút "Sửa", và nút "Xóa".
6. WHEN người dùng có role InventoryManager truy cập CategoryPage, THE RoleGuard SHALL ẩn nút "Xóa" nhưng vẫn hiển thị nút "Thêm Danh Mục" và nút "Sửa".
7. IF `POST /api/category` hoặc `PUT /api/category/{id}` trả về lỗi, THEN THE CategoryPage SHALL hiển thị thông báo lỗi từ response API.

---

### Requirement 5: Quản lý Sản phẩm nâng cao (Products Enhanced)

**User Story:** Là một InventoryManager, tôi muốn tìm kiếm và lọc sản phẩm theo tên, SKU và danh mục, để có thể quản lý hàng hóa hiệu quả hơn.

#### Acceptance Criteria

1. WHEN ProductPage được render, THE ProductPage SHALL hiển thị `categoryName` (lấy từ `ProductDto.categoryName`) thay vì hiển thị `categoryId` thô.
2. WHEN ProductPage được render, THE ProductPage SHALL hiển thị trạng thái tồn kho thấp (`isLowStock: true`) bằng badge hoặc tag màu đỏ/vàng cảnh báo trên hàng sản phẩm tương ứng.
3. WHEN người dùng nhập từ khóa vào ô tìm kiếm và nhấn Enter hoặc ô lọc thay đổi, THE ProductPage SHALL gọi lại `GET /api/product` với query param `search` tương ứng.
4. WHEN người dùng chọn một danh mục từ dropdown lọc, THE ProductPage SHALL gọi lại `GET /api/product` với query param `categoryId` tương ứng.
5. WHEN form tạo/sửa sản phẩm được mở, THE ProductPage SHALL hiển thị dropdown `categoryId` được populate từ `GET /api/category` thay vì ô nhập số thô.
6. WHEN Admin hoặc InventoryManager nhấn "Thêm Sản Phẩm" hoặc "Sửa", THE ProductPage SHALL hiển thị form modal CRUD tương ứng.
7. WHEN người dùng có role Sales truy cập ProductPage, THE RoleGuard SHALL ẩn nút "Thêm Sản Phẩm", nút "Sửa", và nút "Xóa".

---

### Requirement 6: Quản lý Đơn hàng (Orders)

**User Story:** Là một nhân viên Sales, tôi muốn tạo đơn hàng mới và xem danh sách đơn hàng, để có thể theo dõi giao dịch với khách hàng.

#### Acceptance Criteria

1. WHEN OrderPage được render, THE OrderPage SHALL gọi `GET /api/order` và hiển thị danh sách `OrderDto` dưới dạng bảng với các cột: `orderCode`, `orderDate`, `customerName`, `customerPhone`, `totalAmount`, `status`, `createdByUsername`.
2. WHEN người dùng nhấn vào một đơn hàng, THE OrderPage SHALL hiển thị chi tiết đơn hàng bao gồm `details[]` (danh sách sản phẩm trong đơn).
3. WHEN người dùng nhấn "Tạo Đơn Hàng", THE OrderPage SHALL hiển thị form modal cho phép nhập `customerName`, `customerPhone` và thêm nhiều dòng sản phẩm (`productId`, `quantity`), sau đó gọi `POST /api/order`.
4. WHEN trường `status` của `OrderDto` có giá trị `PENDING`, THE OrderPage SHALL hiển thị badge màu vàng với nhãn "Chờ duyệt".
5. WHEN trường `status` của `OrderDto` có giá trị `APPROVED`, THE OrderPage SHALL hiển thị badge màu xanh với nhãn "Đã duyệt".
6. WHEN trường `status` của `OrderDto` có giá trị `CANCELLED`, THE OrderPage SHALL hiển thị badge màu đỏ với nhãn "Đã hủy".
7. WHEN Admin hoặc InventoryManager nhấn "Cập nhật trạng thái" trên một đơn hàng, THE OrderPage SHALL hiển thị dropdown chọn trạng thái mới và gọi `PATCH /api/order/{id}/status`.
8. WHEN người dùng có role Sales truy cập OrderPage, THE RoleGuard SHALL ẩn nút "Cập nhật trạng thái".
9. THE OrderPage SHALL format `totalAmount` và `orderDate` theo định dạng tiền tệ và ngày tháng Việt Nam.

---

### Requirement 7: Nhật ký kiểm toán (Audit Log)

**User Story:** Là một Admin, tôi muốn xem toàn bộ nhật ký hoạt động của hệ thống, để có thể kiểm tra lịch sử thao tác của người dùng.

#### Acceptance Criteria

1. WHEN Admin truy cập AuditLogPage, THE AuditLogPage SHALL gọi `GET /api/auditlog` và hiển thị kết quả dưới dạng bảng.
2. WHEN người dùng có role khác Admin (InventoryManager, Sales) cố truy cập route `/audit-log`, THE PrivateRoute SHALL chuyển hướng họ về `/dashboard`.
3. THE MainLayout SHALL chỉ hiển thị mục "Audit Log" trong sidebar khi `roleName` lưu trong `localStorage` là `Admin`.
4. IF `GET /api/auditlog` trả về HTTP 403, THEN THE AuditLogPage SHALL hiển thị thông báo "Bạn không có quyền truy cập trang này" thay vì crash.

---

### Requirement 8: Điều hướng và Layout nâng cao

**User Story:** Là một người dùng, tôi muốn hệ thống điều hướng hiển thị đúng các mục menu phù hợp với vai trò của mình, để không bị nhầm lẫn khi sử dụng.

#### Acceptance Criteria

1. THE MainLayout SHALL hiển thị đầy đủ các mục menu: Dashboard, Quản lý Sản phẩm, Quản lý Danh mục, Quản lý Đơn hàng, và Audit Log.
2. WHEN `roleName` trong `localStorage` là `Admin`, THE MainLayout SHALL hiển thị tất cả 5 mục menu.
3. WHEN `roleName` trong `localStorage` là `InventoryManager`, THE MainLayout SHALL hiển thị các mục: Dashboard, Sản phẩm, Danh mục, Đơn hàng — ẩn mục Audit Log.
4. WHEN `roleName` trong `localStorage` là `Sales`, THE MainLayout SHALL hiển thị các mục: Dashboard, Sản phẩm, Danh mục, Đơn hàng — ẩn mục Audit Log.
5. THE App SHALL đăng ký đầy đủ các routes: `/dashboard`, `/products`, `/categories`, `/orders`, `/audit-log` trong `App.tsx` với `PrivateRoute` bảo vệ.
6. WHEN người dùng truy cập route `/`, THE App SHALL chuyển hướng người dùng đến `/dashboard`.
7. THE MainLayout SHALL xóa mục "/users" khỏi sidebar vì route này chưa được triển khai.

---

### Requirement 9: Phân quyền dựa trên vai trò (Role-based UI)

**User Story:** Là một Admin hệ thống, tôi muốn các nút hành động (thêm, sửa, xóa) chỉ hiển thị với người dùng có đủ quyền, để tránh thao tác sai phân quyền.

#### Acceptance Criteria

1. THE App SHALL đọc `roleName` từ `localStorage` và cung cấp giá trị này qua React Context để các component con có thể truy cập mà không cần prop drilling.
2. WHEN `roleName` là `Admin`, THE RoleGuard SHALL hiển thị tất cả nút hành động trên tất cả các trang (Thêm, Sửa, Xóa, Cập nhật trạng thái).
3. WHEN `roleName` là `InventoryManager`, THE RoleGuard SHALL hiển thị nút Thêm và Sửa trên trang Sản phẩm và Danh mục, hiển thị nút Cập nhật trạng thái trên trang Đơn hàng, nhưng ẩn nút Xóa danh mục.
4. WHEN `roleName` là `Sales`, THE RoleGuard SHALL ẩn tất cả nút Thêm, Sửa, Xóa trên trang Sản phẩm và Danh mục, và ẩn nút Cập nhật trạng thái trên trang Đơn hàng.
5. IF người dùng cố gắng truy cập trực tiếp một route bị cấm qua URL (không qua UI), THEN THE PrivateRoute SHALL chuyển hướng người dùng về `/dashboard`.

---

### Requirement 10: API Integration và Error Handling

**User Story:** Là một developer, tôi muốn tất cả các module API được tổ chức nhất quán và xử lý lỗi đúng cách, để dễ bảo trì và mở rộng.

#### Acceptance Criteria

1. THE App SHALL tổ chức các API module riêng biệt: `authApi`, `productApi`, `categoryApi`, `orderApi`, `dashboardApi`, `auditLogApi` — tất cả sử dụng cùng `AxiosClient`.
2. THE `categoryApi` SHALL cung cấp các hàm: `getAll()`, `create(data)`, `update(id, data)`, `delete(id)` tương ứng với các endpoint `/api/category`.
3. THE `orderApi` SHALL cung cấp các hàm: `getAll()`, `getById(id)`, `create(data)`, `updateStatus(id, status)` tương ứng với các endpoint `/api/order`.
4. THE `dashboardApi` SHALL cung cấp hàm `getSummary()` gọi `GET /api/dashboard` và trả về `DashboardDto`.
5. THE `auditLogApi` SHALL cung cấp hàm `getAll()` gọi `GET /api/auditlog`.
6. WHEN một API call thất bại với lỗi HTTP 4xx hoặc 5xx, THE App SHALL hiển thị thông báo lỗi bằng Ant Design `message.error()` với nội dung từ `error.response.data` hoặc thông báo mặc định tiếng Việt.
7. THE AxiosClient SHALL giữ nguyên cơ chế interceptor hiện tại: tự động gắn JWT Bearer token vào mọi request và xử lý redirect về `/login` khi nhận HTTP 401.
