import React from 'react';
import { Card, Typography, Progress, Space, Tag } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import DailyTasks from './DailyTasks';

const { Title, Text } = Typography;

interface GoalDetailProps {
  goal: {
    _id: string;
    title: string;
    description: string;
    dailyTime: number;
    difficulty: string;
    startDate: string;
    endDate: string;
    progress: number;
  };
}

const GoalDetail: React.FC<GoalDetailProps> = ({ goal }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={3}>{goal.title}</Title>
          <Text>{goal.description}</Text>
          
          <Space wrap>
            <Tag icon={<ClockCircleOutlined />}>
              Daily Time: {goal.dailyTime} minutes
            </Tag>
            <Tag color="blue">Difficulty: {goal.difficulty}</Tag>
            <Tag icon={<CalendarOutlined />}>
              Timeline: {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
            </Tag>
          </Space>

          <Progress percent={goal.progress} />
        </Space>
      </Card>

      <DailyTasks goalId={goal._id} />
    </Space>
  );
};

export default GoalDetail; 