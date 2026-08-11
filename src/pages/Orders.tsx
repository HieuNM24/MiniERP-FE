import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber,
  Select, Tag, message, Typography,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { orderApi } from '../api/orderApi';
import { productApi } from '../api/productApi';
import { RoleGuard } from '../components/RoleGuard';
import type { Order, CreateOrderDto, OrderStatus, OrderDetail } from '../types/order';
import type { Product } from '../types/product';

const { Title } = Typography;
const { Option } = Select;

const viCurrencyFormatter = (val: number) =>
  `${Number(val).toLocaleString('vi-VN')} VNĐ`;

const statusConfig: Record<OrderStatus, { color: string; label: string }> = {
  PENDING:   { color: 'warning', label: 'Chờ duyệt' },
  APPROVED:  { color: 'success', label: 'Đã duyệt' },
  CANCELLED: { color: 'error',   label: 'Đã hủy' },
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING');
  const [createForm] = Form.useForm();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll();
      setOrders(data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tải danh sách đơn hàng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch {
      message.error('Không thể tải danh sách sản phẩm!');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const handleCreateOrder = async (values: CreateOrderDto) => {
    try {
      await orderApi.create(values);
      message.success('Tạo đơn hàng thành công!');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchOrders();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Tạo đơn hàng thất bại!');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await orderApi.updateStatus(selectedOrder.orderId, { status: newStatus });
      message.success('Cập nhật trạng thái thành công!');
      setIsStatusModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Cập nhật trạng thái thất bại!');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusModalOpen(true);
  };

  const expandedRowRender = (record: Order) => {
    const detailColumns = [
      { title: 'Tên Sản Phẩm', dataIndex: 'productName', key: 'productName' },
      { title: 'Số Lượng',      dataIndex: 'quantity',    key: 'quantity',    width: 100 },
      {
        title: 'Đơn Giá',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        render: (v: number) => viCurrencyFormatter(v),
      },
      {
        title: 'Thành Tiền',
        dataIndex: 'subTotal',
        key: 'subTotal',
        render: (v: number) => viCurrencyFormatter(v),
      },
    ];
    return (
      <Table<OrderDetail>
        rowKey="orderDetailId"
        columns={detailColumns}
        dataSource={record.details}
        pagination={false}
        size="small"
      />
    );
  };

  const columns = [
    { title: 'Mã ĐH',       dataIndex: 'orderCode',        key: 'orderCode' },
    {
      title: 'Ngày ĐH',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (v: string) => {
        const d = new Date(v);
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      },
    },
    { title: 'Khách hàng',  dataIndex: 'customerName',     key: 'customerName' },
    { title: 'SĐT',         dataIndex: 'customerPhone',    key: 'customerPhone' },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => viCurrencyFormatter(v),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: OrderStatus) => {
        const cfg = statusConfig[s] ?? { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: 'Tạo bởi', dataIndex: 'createdByUsername', key: 'createdByUsername' },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Order) => (
        <RoleGuard roles={['Admin', 'InventoryManager']}>
          <Button size="small" onClick={() => openStatusModal(record)}>
            Cập nhật TT
          </Button>
        </RoleGuard>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản Lý Đơn Hàng</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { createForm.resetFields(); setIsCreateModalOpen(true); }}
        >
          Tạo Đơn Hàng
        </Button>
      </div>

      <Table<Order>
        rowKey="orderId"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{ expandedRowRender }}
      />

      {/* Modal Tạo Đơn Hàng */}
      <Modal
        title="Tạo Đơn Hàng Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        width={640}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item
            name="customerName"
            label="Tên Khách Hàng"
            rules={[{ required: true, message: 'Nhập tên khách hàng!' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="customerPhone"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Nhập số điện thoại!' }]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: 'Chọn sản phẩm!' }]}
                      style={{ marginBottom: 0, minWidth: 240 }}
                    >
                      <Select placeholder="Chọn sản phẩm">
                        {products.map((p) => (
                          <Option key={p.productId} value={p.productId}>
                            {p.productName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Nhập số lượng!' }]}
                      style={{ marginBottom: 0, width: 100 }}
                    >
                      <InputNumber min={1} placeholder="SL" style={{ width: '100%' }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        style={{ marginTop: 8, color: 'red', cursor: 'pointer' }}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  + Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal Cập Nhật Trạng Thái */}
      <Modal
        title="Cập Nhật Trạng Thái Đơn Hàng"
        open={isStatusModalOpen}
        onCancel={() => setIsStatusModalOpen(false)}
        onOk={handleUpdateStatus}
        okText="Lưu"
        cancelText="Hủy"
      >
        <p style={{ marginBottom: 8 }}>
          Đơn hàng: <strong>{selectedOrder?.orderCode}</strong>
        </p>
        <Select
          style={{ width: '100%' }}
          value={newStatus}
          onChange={(val) => setNewStatus(val)}
        >
          <Option value="PENDING">Chờ duyệt</Option>
          <Option value="APPROVED">Đã duyệt</Option>
          <Option value="CANCELLED">Đã hủy</Option>
        </Select>
      </Modal>
    </div>
  );
};
