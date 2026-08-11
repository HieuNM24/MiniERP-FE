import React, { useEffect, useState } from 'react';
import { Table, Alert, Typography, Spin } from 'antd';
import { auditLogApi } from '../api/auditLogApi';
import type { AuditLog as AuditLogType } from '../types/auditLog';

const { Title } = Typography;

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await auditLogApi.getAll();
        setLogs(data);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setForbidden(true);
        } else {
          setForbidden(false);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    {
      title: 'Thời Gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('vi-VN'),
    },
    { title: 'Người Dùng', dataIndex: 'userId',    key: 'userId',    width: 120 },
    { title: 'Hành Động',  dataIndex: 'action',    key: 'action',    width: 120 },
    { title: 'Bảng',       dataIndex: 'tableName', key: 'tableName', width: 140 },
    { title: 'Record ID',  dataIndex: 'recordId',  key: 'recordId',  width: 100 },
    {
      title: 'Giá Trị Cũ',
      dataIndex: 'oldValues',
      key: 'oldValues',
      ellipsis: true,
    },
    {
      title: 'Giá Trị Mới',
      dataIndex: 'newValues',
      key: 'newValues',
      ellipsis: true,
    },
  ];

  if (forbidden) {
    return (
      <Alert
        type="error"
        message="Bạn không có quyền truy cập trang này"
        style={{ marginTop: 16 }}
      />
    );
  }

  return (
    <div>
      <Title level={3}>Nhật Ký Kiểm Toán</Title>
      <Spin spinning={loading}>
        <Table<AuditLogType>
          rowKey="logId"
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 900 }}
        />
      </Spin>
    </div>
  );
};
