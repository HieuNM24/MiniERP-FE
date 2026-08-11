import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input,
  Popconfirm, message, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { categoryApi } from '../api/categoryApi';
import { RoleGuard } from '../components/RoleGuard';
import type { Category, CreateCategoryDto } from '../types/category';

const { Title } = Typography;
const { TextArea } = Input;

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tải danh sách danh mục!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        categoryName: category.categoryName,
        description: category.description,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values: CreateCategoryDto) => {
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.categoryId, values);
        message.success('Cập nhật danh mục thành công!');
      } else {
        await categoryApi.create(values);
        message.success('Thêm mới danh mục thành công!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại, vui lòng thử lại!');
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await categoryApi.delete(categoryId);
      message.success('Xóa danh mục thành công!');
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa danh mục này!');
    }
  };

  const columns = [
    { title: 'Tên Danh Mục', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Mô Tả',        dataIndex: 'description',  key: 'description' },
    { title: 'Số Sản Phẩm',  dataIndex: 'totalProducts', key: 'totalProducts', width: 130 },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Category) => (
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
              title="Xác nhận xóa danh mục này?"
              onConfirm={() => handleDelete(record.categoryId)}
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
        <Title level={3} style={{ margin: 0 }}>Quản Lý Danh Mục</Title>
        <RoleGuard roles={['Admin', 'InventoryManager']}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm Danh Mục
          </Button>
        </RoleGuard>
      </div>

      <Table<Category>
        rowKey="categoryId"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="categoryName"
            label="Tên Danh Mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="VD: Điện tử" />
          </Form.Item>
          <Form.Item name="description" label="Mô Tả">
            <TextArea rows={3} placeholder="Mô tả danh mục (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
