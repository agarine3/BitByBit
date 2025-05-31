import React, { useState } from 'react';
import { Card, List, Button, Typography, Space, Tag, Collapse, Modal, Alert, Spin } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, BookOutlined, FileTextOutlined, LinkOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, gql } from '@apollo/client';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { confirm } = Modal;

const GET_TASKS = gql`
  query GetTasks($goalId: ID!) {
    tasks(goalId: $goalId) {
      id
      title
      description
      estimatedTime
      status
      dueDate
      completedAt
      successCriteria
      prerequisites
      notes
      dailyFocus
      resources
    }
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: ID!, $status: String!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      id
      title
      status
      completedAt
    }
  }
`;

const GENERATE_TASKS = gql`
  mutation GenerateTasks($goalId: ID!) {
    generateTasks(goalId: $goalId) {
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
        description
        estimatedTime
        status
        dueDate
        completedAt
        successCriteria
        prerequisites
        notes
        dailyFocus
        resources
      }
    }
  }
`;

interface DailyTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: 'pending' | 'completed' | 'skipped';
  dueDate: string;
  completedAt?: string;
  successCriteria: string[];
  prerequisites: string[];
  notes?: string;
  dailyFocus: string;
  resources?: string[];
}

interface DailyTasksProps {
  goalId: string;
}

interface TasksData {
  tasks: DailyTask[];
}

const DailyTasks: React.FC<DailyTasksProps> = ({ goalId }) => {
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const { loading, error, data, refetch } = useQuery<TasksData>(GET_TASKS, {
    variables: { goalId },
  });
  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS);
  const [generateTasks] = useMutation(GENERATE_TASKS);

  const handleGenerateTasks = async () => {
    if (isGeneratingTasks) return; // Prevent multiple submissions
    
    setIsGeneratingTasks(true);
    try {
      await generateTasks({
        variables: { goalId },
      });
      message.success('Tasks generated successfully');
      refetch();
    } catch (error) {
      console.error('Error generating tasks:', error);
      message.error('Failed to generate tasks. Please try again later.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'completed' | 'skipped') => {
    try {
      await updateTaskStatus({
        variables: { taskId, status },
      });
      refetch();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    confirm({
      title: 'Are you sure you want to delete this task?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          // TODO: Add delete task mutation
          refetch();
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },
    });
  };

  const tasks = data?.tasks || [];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={4}>Daily Practice Sessions</Title>
          <Button 
            type="primary" 
            onClick={handleGenerateTasks} 
            loading={isGeneratingTasks}
            disabled={isGeneratingTasks}
          >
            {isGeneratingTasks ? 'Generating Tasks...' : 'Generate Practice Plan'}
          </Button>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '10px' }}>Loading tasks...</p>
          </div>
        ) : error ? (
          <Alert
            message="Error"
            description="Failed to load tasks. Please try again later."
            type="error"
            showIcon
          />
        ) : (
          <List
            dataSource={tasks}
            renderItem={(task: DailyTask) => (
              <List.Item
                actions={[
                  task.status === 'pending' && (
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                      >
                        Complete Session
                      </Button>
                      <Button 
                        onClick={() => handleUpdateTaskStatus(task.id, 'skipped')}
                      >
                        Skip
                      </Button>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteTask(task.id)}
                      />
                    </Space>
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text delete={task.status !== 'pending'}>
                        {task.title}
                      </Text>
                      <Tag icon={<ClockCircleOutlined />}>
                        {task.estimatedTime} min
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Paragraph>
                        <Text strong>Today's Focus: </Text>
                        {task.dailyFocus}
                      </Paragraph>
                      <Paragraph>{task.description}</Paragraph>
                      <Collapse ghost
                        items={[
                          {
                            key: '1',
                            label: (
                              <Space>
                                <InfoCircleOutlined />
                                <Text>Session Details</Text>
                              </Space>
                            ),
                            children: (
                              <>
                                {task.resources && task.resources.length > 0 && (
                                  <Space direction="vertical" style={{ marginBottom: 16 }}>
                                    <Text strong>Practice Problems & Resources:</Text>
                                    <List
                                      size="small"
                                      dataSource={task.resources}
                                      renderItem={item => (
                                        <List.Item>
                                          <Space>
                                            <LinkOutlined />
                                            <Text>{item}</Text>
                                          </Space>
                                        </List.Item>
                                      )}
                                    />
                                  </Space>
                                )}
                                {task.prerequisites.length > 0 && (
                                  <Space direction="vertical" style={{ marginBottom: 16 }}>
                                    <Text strong>Concepts to Review:</Text>
                                    <List
                                      size="small"
                                      dataSource={task.prerequisites}
                                      renderItem={item => (
                                        <List.Item>
                                          <Space>
                                            <BookOutlined />
                                            <Text>{item}</Text>
                                          </Space>
                                        </List.Item>
                                      )}
                                    />
                                  </Space>
                                )}
                                {task.successCriteria.length > 0 && (
                                  <Space direction="vertical" style={{ marginBottom: 16 }}>
                                    <Text strong>Success Criteria:</Text>
                                    <List
                                      size="small"
                                      dataSource={task.successCriteria}
                                      renderItem={item => (
                                        <List.Item>
                                          <Space>
                                            <CheckCircleOutlined />
                                            <Text>{item}</Text>
                                          </Space>
                                        </List.Item>
                                      )}
                                    />
                                  </Space>
                                )}
                              </>
                            )
                          }
                        ]}
                      />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
};

export default DailyTasks; 