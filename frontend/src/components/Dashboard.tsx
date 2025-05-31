import React, { useState } from 'react';
import { Card, List, Button, Typography, Space, Modal, message, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, gql } from '@apollo/client';
import GoalForm from './GoalForm.tsx';
import DailyTasks from './DailyTasks.tsx';
import moment from 'moment';

const { Title, Text } = Typography;
const { confirm } = Modal;

const GET_GOALS = gql`
  query GetGoals {
    goals {
      id
      title
      description
      currentLevel
      specificAreas
      dailyTime
      startDate
      endDate
      tasks {
        id
        title
        status
      }
    }
  }
`;

const CREATE_GOAL = gql`
  mutation CreateGoal(
    $title: String!
    $description: String!
    $currentLevel: String!
    $specificAreas: [String]!
    $dailyTime: Int!
    $startDate: String!
    $endDate: String!
  ) {
    createGoal(
      title: $title
      description: $description
      currentLevel: $currentLevel
      specificAreas: $specificAreas
      dailyTime: $dailyTime
      startDate: $startDate
      endDate: $endDate
    ) {
      id
      title
      description
      currentLevel
      specificAreas
      dailyTime
      startDate
      endDate
      tasks {
        id
        title
        status
      }
    }
  }
`;

const DELETE_GOAL = gql`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;

interface Goal {
  id: string;
  title: string;
  description: string;
  currentLevel: string;
  specificAreas: string[];
  dailyTime: number;
  startDate: string;
  endDate: string;
  tasks: {
    id: string;
    title: string;
    status: string;
  }[];
}

const Dashboard: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const { error, data, refetch } = useQuery(GET_GOALS);
  const [createGoal] = useMutation(CREATE_GOAL);
  const [deleteGoal] = useMutation(DELETE_GOAL);

  if (error) {
    message.error('Failed to fetch goals');
    console.error('Error:', error);
  }

  const handleCreateGoal = async (values: any) => {
    if (isCreatingGoal) return; // Prevent multiple submissions
    
    setIsCreatingGoal(true);
    try {
      await createGoal({
        variables: {
          ...values,
          specificAreas: values.specificAreas.split(',').map((area: string) => area.trim()),
        },
      });
      
      message.success('Goal created successfully');
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error('Error creating goal:', error);
      message.error('Failed to create goal');
    } finally {
      setIsCreatingGoal(false);
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
          await deleteGoal({
            variables: { id: goalId },
          });
          message.success('Goal deleted successfully');
          refetch();
        } catch (error) {
          console.error('Error deleting goal:', error);
          message.error('Failed to delete goal');
        }
      },
    });
  };

  const goals = data?.goals || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    // Convert Unix timestamp (milliseconds) to moment object
    const date = moment(parseInt(dateString));
    return date.isValid() ? date.format('MMMM D, YYYY') : 'Invalid date';
  };

  const items = [
    {
      key: 'today',
      label: "Today's Tasks",
      children: goals.map((goal: Goal) => (
        <Card
          key={goal.id}
          title={
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text strong>{goal.title}</Text>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteGoal(goal.id)}
              />
            </Space>
          }
          style={{ marginBottom: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>{goal.description}</Text>
            <Text type="secondary">Daily Practice Time: {goal.dailyTime} minutes</Text>
            <DailyTasks goalId={goal.id} />
          </Space>
        </Card>
      )),
    },
    {
      key: 'all',
      label: 'All Goals',
      children: (
        <List
          dataSource={goals}
          renderItem={(goal: Goal) => (
            <Card
              title={
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{goal.title}</Text>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteGoal(goal.id)}
                  />
                </Space>
              }
              style={{ marginBottom: '16px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>{goal.description}</Text>
                <Text type="secondary">Daily Practice Time: {goal.dailyTime} minutes</Text>
                <Text type="secondary">
                  Start Date: {formatDate(goal.startDate)}
                </Text>
                <Text type="secondary">
                  End Date: {formatDate(goal.endDate)}
                </Text>
              </Space>
            </Card>
          )}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={2}>Today's Practice Plan</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            disabled={isCreatingGoal}
          >
            Create New Goal
          </Button>
        </Space>

        <Tabs defaultActiveKey="today" items={items} />

      </Space>

      <Modal
        title="Create New Goal"
        open={isModalVisible}
        onCancel={() => !isCreatingGoal && setIsModalVisible(false)}
        footer={null}
        width={800}
        maskClosable={!isCreatingGoal}
        closable={!isCreatingGoal}
      >
        <GoalForm onSubmit={handleCreateGoal} loading={isCreatingGoal} />
      </Modal>
    </div>
  );
};

export default Dashboard; 