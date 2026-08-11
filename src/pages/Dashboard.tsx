import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Alert, Button, Typography, Spin } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  WarningOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardDto } from '../types/dashboard';
import type { Product } from '../types/product';
import type { Order } from '../types/order';

const { Title } = Typography;

const viCurrencyFormatter = (val: number | string | undefined) =>
  `${Number(val).toLocaleString('vi-VN')} VNĐ`;

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING:   { color: 'warning', label: 'Chờ duyệt' },
  APPROVED:  { color: 'success', label: 'Đã duyệt' },
  CANCELLED: { color: 'error',   label: 'Đã hủy' },
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardApi.getSummary();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockColumns = [
    { title: 'SKU',           dataIndex: 'sKU',           key: 'sKU',           width: 140 },
    { title: 'Tên Sản Phẩm', dataIndex: 'productName',   key: 'productName' },
    { title: 'Tồn Kho',      dataIndex: 'stockQuantity', key: 'stockQuantity', width: 100 },
    { title: 'Danh Mục',     dataIndex: 'categoryName',  key: 'categoryName' },
  ];

  const recentOrderColumns = [
    { title: 'Mã ĐH',       dataIndex: 'orderCode',     key: 'orderCode' },
    { title: 'Khách hàng',  dataIndex: 'customerName',  key: 'customerName' },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => viCurrencyFormatter(val),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const cfg = statusConfig[s] ?? { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: 'Ngày ĐH', dataIndex: 'orderDate', key: 'orderDate',
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
  ];

  return (
    <div>
      <Title level={3}>Tổng Quan Hệ Thống</Title>

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchData}>
              Thử lại
            </Button>
          }
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Doanh Thu"
                value={data?.totalRevenue ?? 0}
                formatter={(val) => viCurrencyFormatter(val as number)}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Đơn Hàng"
                value={data?.totalOrders ?? 0}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Sản Phẩm"
                value={data?.totalProducts ?? 0}
                prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="SP Sắp Hết Hàng"
                value={data?.lowStockProductsCount ?? 0}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Sản Phẩm Sắp Hết Hàng">
              <Table<Product>
                rowKey="productId"
                columns={lowStockColumns}
                dataSource={data?.lowStockProducts ?? []}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Đơn Hàng Gần Đây">
              <Table<Order>
                rowKey="orderId"
                columns={recentOrderColumns}
                dataSource={data?.recentOrders ?? []}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
