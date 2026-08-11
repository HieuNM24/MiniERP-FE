import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Popconfirm, message, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi } from '../api/productApi';
import type { Product, CreateProductDto } from '../types/product';

const { Title } = Typography;

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch {
      message.error('Không thể tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue(product);
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values: CreateProductDto) => {
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, values);
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        await productApi.create(values);
        message.success('Thêm mới sản phẩm thành công!');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch {
      message.error('Thao tác thất bại, vui lòng kiểm tra lại!');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id);
      message.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch {
      message.error('Không thể xóa sản phẩm này!');
    }
  };

  // Lọc sản phẩm theo productName hoặc sku
  const filteredProducts = products.filter(
    p => p.productName?.toLowerCase().includes(searchText.toLowerCase()) ||
         p.sku?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'Mã SKU', dataIndex: 'sku', key: 'sku', width: 140 },
    { title: 'Tên Sản Phẩm', dataIndex: 'productName', key: 'productName' },
    { 
      title: 'Đơn Giá', 
      dataIndex: 'unitPrice', 
      key: 'unitPrice',
      render: (price: number) => `${(price || 0).toLocaleString('vi-VN')} VNĐ` 
    },
    { title: 'Tồn Kho', dataIndex: 'stockQuantity', key: 'stockQuantity', width: 100 },
    { title: 'Mã Danh Mục', dataIndex: 'categoryId', key: 'categoryId', width: 120 },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 130,
      render: (_: any, record: Product) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm
            title="Xác nhận xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản Lý Sản Phẩm</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm Sản Phẩm
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo SKU hoặc tên sản phẩm..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredProducts}
        loading={loading}
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title={editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="sku" label="Mã SKU" rules={[{ required: true, message: 'Nhập mã SKU!' }]}>
            <Input placeholder="VD: SKU-1001" />
          </Form.Item>
          <Form.Item name="productName" label="Tên Sản Phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm!' }]}>
            <Input placeholder="VD: Laptop Dell XPS 13" />
          </Form.Item>
          <Form.Item name="unitPrice" label="Đơn Giá (VNĐ)" rules={[{ required: true, message: 'Nhập đơn giá!' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="15000000" />
          </Form.Item>
          <Form.Item name="stockQuantity" label="Số Lượng Tồn Kho" rules={[{ required: true, message: 'Nhập số lượng tồn kho!' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="10" />
          </Form.Item>
          <Form.Item name="categoryId" label="ID Danh Mục" rules={[{ required: true, message: 'Nhập ID danh mục!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};