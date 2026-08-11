import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { ShoppingCartOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={3}>Tổng Quan Hệ Thống</Title>
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={125000000}
              precision={0}
              suffix="VND"
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đơn Hàng Mới"
              value={48}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách Hàng Kích Hoạt"
              value={1120}
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};