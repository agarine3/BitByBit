import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Space, Modal, message, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import GoalForm from './GoalForm.tsx';
import DailyTasks from './DailyTasks.tsx';
import moment from 'moment';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;

interface Goal {
  _id: string;
  title: string;
  description: string;
  currentLevel: string;
  specificAreas: string;
  dailyTime: number;
  startDate: string;
  endDate: string;
  tasks: string[];
}

const Dashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchGoals = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      message.error('Failed to fetch goals');
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const newGoal = await response.json();
      setGoals([...goals, newGoal]);
      setIsModalVisible(false);
      message.success('Goal created successfully');
    } catch (error) {
      console.error('Error creating goal:', error);
      message.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    confirm({
      title: 'Are you sure you want to delete this goal?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will also delete all associated tasks.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/goals/${goalId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete goal');
          }

          setGoals(goals.filter(goal => goal._id !== goalId));
          message.success('Goal deleted successfully');
        } catch (error) {
          console.error('Error deleting goal:', error);
          message.error('Failed to delete goal');
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={2}>Today's Practice Plan</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Create New Goal
          </Button>
        </Space>

        <Tabs defaultActiveKey="today">
          <TabPane tab="Today's Tasks" key="today">
            {goals.map(goal => (
              <Card
                key={goal._id}
                title={
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>{goal.title}</Text>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteGoal(goal._id)}
                    />
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>{goal.description}</Text>
                  <Text type="secondary">Daily Practice Time: {goal.dailyTime} minutes</Text>
                  <DailyTasks goalId={goal._id} />
                </Space>
              </Card>
            ))}
          </TabPane>
          <TabPane tab="All Goals" key="all">
            <List
              dataSource={goals}
              renderItem={goal => (
                <Card
                  title={
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text strong>{goal.title}</Text>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteGoal(goal._id)}
                      />
                    </Space>
                  }
                  style={{ marginBottom: '16px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>{goal.description}</Text>
                    <Text type="secondary">Daily Practice Time: {goal.dailyTime} minutes</Text>
                    <Text type="secondary">
                      Start Date: {moment(goal.startDate).format('MMMM D, YYYY')}
                    </Text>
                    <Text type="secondary">
                      End Date: {moment(goal.endDate).format('MMMM D, YYYY')}
                    </Text>
                  </Space>
                </Card>
              )}
            />
          </TabPane>
        </Tabs>
      </Space>

      <Modal
        title="Create New Goal"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <GoalForm onSubmit={handleCreateGoal} loading={loading} />
      </Modal>
    </div>
  );
};

export default Dashboard; 