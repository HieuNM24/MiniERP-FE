import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber,
  Select, Popconfirm, message, Typography, Card, Tag, Row, Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { RoleGuard } from '../components/RoleGuard';
import type { Product, CreateProductDto } from '../types/product';
import type { Category } from '../types/category';

const { Title } = Typography;
const { Option } = Select;

const viCurrencyFormatter = (val: number) =>
  `${Number(val).toLocaleString('vi-VN')} VNĐ`;

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (searchVal?: string, categoryId?: number) => {
    setLoading(true);
    try {
      const data = await productApi.getAll({
        search: searchVal || undefined,
        categoryId: categoryId || undefined,
      });
      setProducts(data);
    } catch {
      message.error('Không thể tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch {
      message.error('Không thể tải danh sách danh mục!');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchProducts(val, selectedCategoryId);
    }, 400);
  };

  const handleCategoryFilter = (value: number | undefined) => {
    setSelectedCategoryId(value);
    fetchProducts(search, value);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        sKU: product.sKU,
        productName: product.productName,
        unitPrice: product.unitPrice,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId,
      });
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values: CreateProductDto) => {
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.productId, values);
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        await productApi.create(values);
        message.success('Thêm mới sản phẩm thành công!');
      }
      setIsModalOpen(false);
      fetchProducts(search, selectedCategoryId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại, vui lòng thử lại!');
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await productApi.delete(productId);
      message.success('Xóa sản phẩm thành công!');
      fetchProducts(search, selectedCategoryId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa sản phẩm này!');
    }
  };

  const columns = [
    { title: 'SKU',          dataIndex: 'sKU',           key: 'sKU',           width: 140 },
    { title: 'Tên Sản Phẩm', dataIndex: 'productName',  key: 'productName' },
    {
      title: 'Đơn Giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => viCurrencyFormatter(val),
    },
    {
      title: 'Tồn Kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 130,
      render: (val: number, record: Product) => (
        <>
          {val}
          {record.isLowStock && (
            <Tag color="warning" style={{ marginLeft: 8 }}>Sắp hết</Tag>
          )}
        </>
      ),
    },
    { title: 'Danh Mục', dataIndex: 'categoryName', key: 'categoryName' },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Product) => (
        <Space>
          <RoleGuard roles={['Admin', 'InventoryManager']}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenModal(record)}
            />
          </RoleGuard>
          <RoleGuard roles={['Admin']}>
            <Popconfirm
              title="Xác nhận xóa sản phẩm này?"
              onConfirm={() => handleDelete(record.productId)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </RoleGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản Lý Sản Phẩm</Title>
        <RoleGuard roles={['Admin', 'InventoryManager']}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm Sản Phẩm
          </Button>
        </RoleGuard>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12}>
          <Col xs={24} sm={14}>
            <Input.Search
              placeholder="Tìm theo tên hoặc SKU..."
              value={search}
              onChange={handleSearchChange}
              onSearch={(val) => fetchProducts(val, selectedCategoryId)}
              allowClear
              onClear={() => { setSearch(''); fetchProducts('', selectedCategoryId); }}
            />
          </Col>
          <Col xs={24} sm={10}>
            <Select
              placeholder="Lọc theo danh mục"
              style={{ width: '100%' }}
              allowClear
              value={selectedCategoryId}
              onChange={(val) => handleCategoryFilter(val)}
            >
              {categories.map((c) => (
                <Option key={c.categoryId} value={c.categoryId}>{c.categoryName}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table<Product>
        rowKey="productId"
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="sKU" label="Mã SKU" rules={[{ required: true, message: 'Nhập mã SKU!' }]}>
            <Input placeholder="VD: SKU-1001" />
          </Form.Item>
          <Form.Item name="productName" label="Tên Sản Phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm!' }]}>
            <Input placeholder="VD: Laptop Dell XPS 13" />
          </Form.Item>
          <Form.Item name="unitPrice" label="Đơn Giá (VNĐ)" rules={[{ required: true, message: 'Nhập đơn giá!' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="15000000" />
          </Form.Item>
          <Form.Item name="stockQuantity" label="Số Lượng Tồn Kho" rules={[{ required: true, message: 'Nhập số lượng!' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="10" />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh Mục" rules={[{ required: true, message: 'Chọn danh mục!' }]}>
            <Select placeholder="Chọn danh mục">
              {categories.map((c) => (
                <Option key={c.categoryId} value={c.categoryId}>{c.categoryName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
