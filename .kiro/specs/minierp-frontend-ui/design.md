# Design Document — MiniERP Frontend UI

## Overview

Tài liệu này mô tả thiết kế kỹ thuật cho giao diện Frontend hoàn chỉnh của hệ thống **MiniERP**.

**Mục tiêu chính:**
- Sửa các lỗi hiện tại: type mismatch (`id` → `productId`), sai API path (`/products` → `/product`), hardcoded Dashboard data.
- Bổ sung 3 trang còn thiếu: Categories, Orders, AuditLog.
- Triển khai phân quyền role-based (Admin / InventoryManager / Sales) thông qua React Context và RoleGuard pattern.
- Tổ chức 6 API module nhất quán với error handling tiếng Việt.

**Stack:** React 19 + TypeScript + Ant Design 6 + Axios + React Router v7 + Vite

---

## Architecture

### High-Level Component Tree

```
App
├── BrowserRouter
│   ├── Route /login → <Login />
│   └── <PrivateRoute> (JWT check)
│       └── <AuthProvider> (Role Context)
│           └── <MainLayout> (Sider + Header + <Outlet>)
│               ├── Route /dashboard      → <Dashboard />
│               ├── Route /products       → <Products />
│               ├── Route /categories     → <Categories />
│               ├── Route /orders         → <Orders />
│               └── Route /audit-log      → <RoleRoute roles={["Admin"]}> → <AuditLog />
```

### File Structure (new/modified files)

```
src/
├── contexts/
│   └── AuthContext.tsx          # AuthProvider + useAuth hook
├── components/
│   ├── MainLayout.tsx           # [MODIFIED] role-based menu
│   ├── PrivateRoute.tsx         # [MODIFIED] adds RoleRoute support
│   └── RoleGuard.tsx            # [NEW] conditional render by role
├── pages/
│   ├── Login.tsx                # [unchanged logic, minor key fix]
│   ├── Dashboard.tsx            # [REWRITE] real API data
│   ├── Products.tsx             # [REWRITE] fix types, search, filter, category dropdown
│   ├── Categories.tsx           # [NEW]
│   ├── Orders.tsx               # [NEW]
│   └── AuditLog.tsx             # [NEW]
├── api/
│   ├── axiosClient.ts           # [unchanged]
│   ├── authApi.ts               # [unchanged]
│   ├── productApi.ts            # [REWRITE] fix paths & types
│   ├── categoryApi.ts           # [NEW]
│   ├── orderApi.ts              # [NEW]
│   ├── dashboardApi.ts          # [NEW]
│   └── auditLogApi.ts           # [NEW]
└── types/
    ├── auth.ts                  # [unchanged]
    ├── product.ts               # [REWRITE] fix interface
    ├── category.ts              # [NEW]
    ├── order.ts                 # [NEW]
    ├── dashboard.ts             # [NEW]
    └── auditLog.ts              # [NEW]
```

### Key Design Decisions

1. **AuthContext over prop drilling**: `roleName` and `username` are read once from `localStorage` and distributed via React Context, so every component accesses role without prop chains.
2. **RoleGuard as a wrapper component**: Instead of scattering `roleName === 'Admin'` checks inline, a reusable `<RoleGuard roles={[...]}>{children}</RoleGuard>` renders children only when the current role is in the allowed list.
3. **RoleRoute for page-level protection**: A `<RoleRoute>` wraps `<PrivateRoute>` semantics but also checks role; unauthorized users are redirected to `/dashboard` rather than `/login`.
4. **Server-side filtering for Products**: Search and category filter params are sent as query params to `GET /api/product`, keeping the client lightweight and consistent with the API contract.
5. **localStorage key consistency**: Current code stores `roleName` under the key `roleName` (Login.tsx) but `MainLayout` reads from `role`. The design standardizes to key `roleName` everywhere.

---

## Components and Interfaces

### AuthContext

```tsx
// src/contexts/AuthContext.tsx

interface AuthState {
  token: string | null;
  username: string | null;
  roleName: string | null;   // "Admin" | "InventoryManager" | "Sales"
}

interface AuthContextValue extends AuthState {
  login: (token: string, username: string, roleName: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Provider reads initial state from localStorage
const AuthProvider: React.FC<{ children: ReactNode }>;

// Hook for consuming context
const useAuth: () => AuthContextValue;
```

### RoleGuard Component

```tsx
// src/components/RoleGuard.tsx

interface RoleGuardProps {
  roles: Array<"Admin" | "InventoryManager" | "Sales">;
  children: ReactNode;
  fallback?: ReactNode;   // optional: render something else when unauthorized
}

// Renders children only when useAuth().roleName is in props.roles
const RoleGuard: React.FC<RoleGuardProps>;
```

Usage example:
```tsx
<RoleGuard roles={["Admin", "InventoryManager"]}>
  <Button>Thêm Danh Mục</Button>
</RoleGuard>
```

### RoleRoute Component (page-level protection)

```tsx
// Embedded in PrivateRoute.tsx or separate component

interface RoleRouteProps {
  roles: Array<"Admin" | "InventoryManager" | "Sales">;
  redirectTo?: string;   // default: "/dashboard"
}

// Wraps <Outlet />, redirects to redirectTo if role not allowed
const RoleRoute: React.FC<RoleRouteProps>;
```

### MainLayout

Modified to:
- Read `username` and `roleName` from `useAuth()` instead of `localStorage` directly.
- Build `menuItems` dynamically based on `roleName`:
  - All roles: Dashboard, Sản phẩm, Danh mục, Đơn hàng
  - Admin only: + Audit Log
- Remove the `/users` menu item.
- Call `authContext.logout()` on logout button click.

```tsx
// Role-based menu construction
const buildMenuItems = (roleName: string | null) => {
  const base = [
    { key: '/dashboard',   icon: <DashboardOutlined />,  label: 'Dashboard' },
    { key: '/products',    icon: <ShoppingOutlined />,   label: 'Sản phẩm' },
    { key: '/categories',  icon: <AppstoreOutlined />,   label: 'Danh mục' },
    { key: '/orders',      icon: <OrderedListOutlined />, label: 'Đơn hàng' },
  ];
  if (roleName === 'Admin') {
    base.push({ key: '/audit-log', icon: <AuditOutlined />, label: 'Audit Log' });
  }
  return base;
};
```

---

## Data Models

### src/types/auth.ts (unchanged)

```typescript
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roleName: string;
}
```

### src/types/product.ts (REWRITE)

```typescript
// Matches BackEnd ProductDto — note sKU capitalization matches JSON from .NET
export interface Product {
  productId: number;
  sKU: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  isLowStock: boolean;
}

export interface CreateProductDto {
  sKU: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQueryParams {
  search?: string;
  categoryId?: number;
}
```

### src/types/category.ts (NEW)

```typescript
export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  totalProducts: number;
}

export interface CreateCategoryDto {
  categoryName: string;
  description: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}
```

### src/types/order.ts (NEW)

```typescript
export type OrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Order {
  orderId: number;
  orderCode: string;
  orderDate: string;          // ISO 8601 string from .NET
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: OrderStatus;
  createdByUsername: string;
  details: OrderDetail[];
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  items: CreateOrderItem[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
```

### src/types/dashboard.ts (NEW)

```typescript
import type { Product } from './product';
import type { Order } from './order';

export interface DashboardDto {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProductsCount: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
}
```

### src/types/auditLog.ts (NEW)

```typescript
export interface AuditLog {
  logId: number;
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValues: string;    // JSON string from .NET
  newValues: string;    // JSON string from .NET
  timestamp: string;    // ISO 8601
}
```

---

## API Modules

All modules use the shared `axiosClient` instance. Error handling is done at the page level via `message.error()` from Ant Design, with the error message extracted from `error.response?.data?.message` or a default Vietnamese fallback.

### src/api/productApi.ts (REWRITE)

```typescript
import axiosClient from './axiosClient';
import type { Product, CreateProductDto, UpdateProductDto, ProductQueryParams } from '../types/product';

export const productApi = {
  getAll: async (params?: ProductQueryParams): Promise<Product[]> => {
    const response = await axiosClient.get<Product[]>('/product', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await axiosClient.get<Product>(`/product/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await axiosClient.post<Product>('/product', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await axiosClient.put<Product>(`/product/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product/${id}`);
  },
};
```

### src/api/categoryApi.ts (NEW)

```typescript
import axiosClient from './axiosClient';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await axiosClient.get<Category[]>('/category');
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await axiosClient.get<Category>(`/category/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await axiosClient.post<Category>('/category', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await axiosClient.put<Category>(`/category/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/category/${id}`);
  },
};
```

### src/api/orderApi.ts (NEW)

```typescript
import axiosClient from './axiosClient';
import type { Order, CreateOrderDto, UpdateOrderStatusDto } from '../types/order';

export const orderApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await axiosClient.get<Order[]>('/order');
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await axiosClient.get<Order>(`/order/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await axiosClient.post<Order>('/order', data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateOrderStatusDto): Promise<void> => {
    await axiosClient.patch(`/order/${id}/status`, data);
  },
};
```

### src/api/dashboardApi.ts (NEW)

```typescript
import axiosClient from './axiosClient';
import type { DashboardDto } from '../types/dashboard';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardDto> => {
    const response = await axiosClient.get<DashboardDto>('/dashboard');
    return response.data;
  },
};
```

### src/api/auditLogApi.ts (NEW)

```typescript
import axiosClient from './axiosClient';
import type { AuditLog } from '../types/auditLog';

export const auditLogApi = {
  getAll: async (): Promise<AuditLog[]> => {
    const response = await axiosClient.get<AuditLog[]>('/auditlog');
    return response.data;
  },
};
```

### Error Handling Convention

All pages follow this pattern for API errors:

```typescript
const handleApiError = (error: unknown, defaultMsg: string) => {
  const msg = (error as any)?.response?.data?.message || defaultMsg;
  message.error(msg);
};
```

The `axiosClient` response interceptor already handles HTTP 401 globally (removes token + redirect to `/login`). Pages only need to handle 4xx/5xx business errors.

---

## Routing Design

### Route Registration (App.tsx)

```tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/categories"   element={<Categories />} />
          <Route path="/orders"       element={<Orders />} />
          {/* Admin-only route */}
          <Route element={<RoleRoute roles={["Admin"]} />}>
            <Route path="/audit-log"  element={<AuditLog />} />
          </Route>
        </Route>
      </Route>

      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### Route Protection Summary

| Route         | Auth required | Roles allowed                         |
|---------------|---------------|---------------------------------------|
| `/login`      | No            | All                                   |
| `/dashboard`  | Yes           | All authenticated                     |
| `/products`   | Yes           | All authenticated                     |
| `/categories` | Yes           | All authenticated                     |
| `/orders`     | Yes           | All authenticated                     |
| `/audit-log`  | Yes           | Admin only (redirect to /dashboard)   |

---

## Component Design

### Login.tsx

Minor fix: The current code saves `roleName` to `localStorage.setItem('roleName', ...)` which is correct, but `MainLayout` reads from key `'role'`. Both must use `'roleName'`.

```
State:
  loading: boolean

Key behavior:
  - onFinish: call authApi.login() → authContext.login(token, username, roleName) → navigate('/dashboard')
  - Error: message.error(error.response?.data?.message || 'Đăng nhập thất bại...')
```

### Dashboard.tsx (REWRITE)

```
State:
  data: DashboardDto | null
  loading: boolean
  error: string | null

On mount:
  call dashboardApi.getSummary()
  set data, handle errors with retry button

Layout:
  Row gutter=[16,16]:
    Col span=6: <Statistic title="Tổng Doanh Thu" value={data.totalRevenue} formatter={viCurrencyFormatter} />
    Col span=6: <Statistic title="Tổng Đơn Hàng" value={data.totalOrders} />
    Col span=6: <Statistic title="Tổng Sản Phẩm" value={data.totalProducts} />
    Col span=6: <Statistic title="SP Sắp Hết Hàng" value={data.lowStockProductsCount} />

  <Table> lowStockProducts:
    Columns: sKU, productName, stockQuantity, categoryName
    rowKey="productId"

  <Table> recentOrders:
    Columns: orderCode, customerName, totalAmount (VNĐ), status (badge), orderDate

Helper:
  viCurrencyFormatter = (val) => `${Number(val).toLocaleString('vi-VN')} VNĐ`
```

### Products.tsx (REWRITE)

```
State:
  products: Product[]
  categories: Category[]       // for dropdown
  loading: boolean
  search: string               // debounced, triggers API call
  selectedCategoryId: number | undefined
  isModalOpen: boolean
  editingProduct: Product | null
  form: FormInstance

On mount:
  fetchProducts()
  fetchCategories()            // populate category dropdown in filter & form

fetchProducts(search?, categoryId?):
  productApi.getAll({ search, categoryId })

Table columns:
  { title: 'SKU',        dataIndex: 'sKU',           key: 'sKU',           width: 140 }
  { title: 'Tên SP',     dataIndex: 'productName',   key: 'productName' }
  { title: 'Đơn Giá',   dataIndex: 'unitPrice',      render: viCurrencyFormatter }
  { title: 'Tồn Kho',   dataIndex: 'stockQuantity',  width: 100,
    render: (val, record) => (
      <>
        {val}
        {record.isLowStock && <Tag color="warning" style={{marginLeft:8}}>Sắp hết</Tag>}
      </>
    )
  }
  { title: 'Danh Mục',  dataIndex: 'categoryName',   key: 'categoryName' }
  { title: 'Thao Tác',  render: (_, record) => (
      <>
        <RoleGuard roles={["Admin","InventoryManager"]}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
        </RoleGuard>
        <RoleGuard roles={["Admin"]}>
          <Popconfirm onConfirm={() => handleDelete(record.productId)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </RoleGuard>
      </>
    )
  }

rowKey="productId"

Filter bar:
  <Input.Search> → onChange debounce 400ms → fetchProducts(search, selectedCategoryId)
  <Select> categories → onChange → fetchProducts(search, categoryId)

Modal form fields:
  sKU (Input, required)
  productName (Input, required)
  unitPrice (InputNumber, min=0, required)
  stockQuantity (InputNumber, min=0, required)
  categoryId (Select from categories[], required)

handleSave:
  if editingProduct: productApi.update(editingProduct.productId, values)
  else: productApi.create(values)
  → fetchProducts()

Header button:
  <RoleGuard roles={["Admin","InventoryManager"]}>
    <Button icon={<PlusOutlined />}>Thêm Sản Phẩm</Button>
  </RoleGuard>
```

### Categories.tsx (NEW)

```
State:
  categories: Category[]
  loading: boolean
  isModalOpen: boolean
  editingCategory: Category | null
  form: FormInstance

On mount: categoryApi.getAll()

Table columns:
  { title: 'Tên Danh Mục', dataIndex: 'categoryName' }
  { title: 'Mô Tả',        dataIndex: 'description' }
  { title: 'Số Sản Phẩm',  dataIndex: 'totalProducts', width: 130 }
  { title: 'Thao Tác', render: (_, record) => (
      <>
        <RoleGuard roles={["Admin","InventoryManager"]}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
        </RoleGuard>
        <RoleGuard roles={["Admin"]}>
          <Popconfirm onConfirm={() => handleDelete(record.categoryId)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </RoleGuard>
      </>
    )
  }

rowKey="categoryId"

Modal form fields:
  categoryName (Input, required)
  description (Input.TextArea, optional)

handleSave:
  if editingCategory: categoryApi.update(editingCategory.categoryId, values)
  else: categoryApi.create(values)
  → fetchCategories()

Header button:
  <RoleGuard roles={["Admin","InventoryManager"]}>
    <Button icon={<PlusOutlined />}>Thêm Danh Mục</Button>
  </RoleGuard>
```

### Orders.tsx (NEW)

```
State:
  orders: Order[]
  products: Product[]          // for create-order form product dropdown
  loading: boolean
  isCreateModalOpen: boolean
  isStatusModalOpen: boolean
  selectedOrder: Order | null  // for status update
  form: FormInstance           // create order form

On mount:
  orderApi.getAll()
  productApi.getAll()          // populate product dropdown in create form

Status badge helper:
  const statusConfig = {
    PENDING:   { color: 'warning', label: 'Chờ duyệt' },
    APPROVED:  { color: 'success', label: 'Đã duyệt' },
    CANCELLED: { color: 'error',   label: 'Đã hủy' },
  }

Table columns:
  { title: 'Mã ĐH',      dataIndex: 'orderCode' }
  { title: 'Ngày ĐH',    dataIndex: 'orderDate',     render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm') }
  { title: 'Khách hàng', dataIndex: 'customerName' }
  { title: 'SĐT',        dataIndex: 'customerPhone' }
  { title: 'Tổng Tiền',  dataIndex: 'totalAmount',   render: viCurrencyFormatter }
  { title: 'Trạng Thái', dataIndex: 'status',        render: (s) => <Badge ... /> }
  { title: 'Tạo bởi',    dataIndex: 'createdByUsername' }
  { title: 'Thao Tác', render: (_, record) => (
      <RoleGuard roles={["Admin","InventoryManager"]}>
        <Button onClick={() => openStatusModal(record)}>Cập nhật TT</Button>
      </RoleGuard>
    )
  }

rowKey="orderId"

Expandable rows:
  expandedRowRender: (record) => (
    <Table dataSource={record.details} rowKey="orderDetailId"
      columns: [productName, quantity, unitPrice, subTotal] />
  )

Create Order Modal form fields:
  customerName (Input, required)
  customerPhone (Input, required)
  items: Form.List → each item has:
    productId (Select from products[], required)
    quantity (InputNumber, min=1, required)
  [Add Item] / [Remove Item] buttons within Form.List

handleCreateOrder:
  orderApi.create({ customerName, customerPhone, items }) → fetchOrders()

Update Status Modal:
  Select with options PENDING / APPROVED / CANCELLED
  → orderApi.updateStatus(selectedOrder.orderId, { status }) → fetchOrders()

Header button (visible to all roles — Sales can create orders):
  <Button icon={<PlusOutlined />}>Tạo Đơn Hàng</Button>
```

### AuditLog.tsx (NEW)

```
State:
  logs: AuditLog[]
  loading: boolean

On mount: auditLogApi.getAll()
  If HTTP 403: show Alert "Bạn không có quyền truy cập trang này"

Table columns:
  { title: 'Thời gian',   dataIndex: 'timestamp',  render: dayjs format }
  { title: 'Người dùng',  dataIndex: 'userId' }
  { title: 'Hành động',   dataIndex: 'action' }
  { title: 'Bảng',        dataIndex: 'tableName' }
  { title: 'Record ID',   dataIndex: 'recordId' }
  { title: 'Giá trị cũ', dataIndex: 'oldValues', ellipsis: true }
  { title: 'Giá trị mới', dataIndex: 'newValues', ellipsis: true }

rowKey="logId"
```

---

## Error Handling

### Global (axiosClient interceptors)
- **Request**: Attach `Authorization: Bearer {token}` if token exists in `localStorage`.
- **Response 401**: Remove `token` from `localStorage`, redirect to `/login` via `window.location.href`.

### Page-level pattern
Every API call is wrapped in try/catch. On failure:
```typescript
message.error(
  (error as any)?.response?.data?.message || 'Thao tác thất bại, vui lòng thử lại!'
);
```

### Dashboard retry
Dashboard shows an Ant Design `Alert` with a "Thử lại" button when `getSummary()` fails, allowing the user to reload data without refreshing the whole page.

### AuditLog 403
Since `RoleRoute` already redirects non-Admin users before reaching the page, a 403 at the API level is an edge case (e.g., token tampered). The component renders an `<Alert type="error">` instead of crashing.

---

## Testing Strategy

This feature is a **React UI layer** connecting to a known API. It consists of form rendering, table display, role-based conditional rendering, and API integration — categories for which **property-based testing is not the primary tool**.

PBT is not appropriate here because:
- The core logic is UI rendering and API wiring — not pure transformations with large input spaces.
- "For all inputs" properties are not naturally expressible for CRUD pages.
- Role visibility rules have a small, discrete input space (3 roles × ~5 actions = ~15 combinations) that exhaustive example-based tests cover completely.

**Recommended test approach:**

### Unit / Component Tests (Vitest + React Testing Library)
Focus on the few functions that contain real logic:

- `buildMenuItems(roleName)`: given each of the 3 roles, assert correct menu items returned.
- `RoleGuard`: render with each role permutation, assert children visible or absent.
- `AuthContext`: login() sets localStorage and context state; logout() clears both.
- `statusConfig` badge mapping: each of the 3 `OrderStatus` values maps to correct color and label.
- `viCurrencyFormatter(value)`: formats numbers correctly (e.g., 125000000 → "125.000.000 VNĐ").

### Integration Tests (Vitest + MSW for API mocking)
- Dashboard: mock `GET /api/dashboard`, assert 4 KPI cards rendered with correct values.
- Products: mock `GET /api/product`, assert table rows; mock `DELETE /api/product/1`, assert confirmation dialog triggers API call.
- RoleRoute: simulate navigation to `/audit-log` as InventoryManager, assert redirect to `/dashboard`.

### Manual / E2E Tests (Playwright — optional)
- Full login flow: enter credentials → dashboard rendered.
- Role visibility: log in as Sales → "Thêm Sản Phẩm" button absent.
- Create order: multi-item form → submit → new row appears in table.
