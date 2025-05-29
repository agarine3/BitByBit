import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Space, Tag, Collapse, Modal } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, BookOutlined, FileTextOutlined, LinkOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { confirm } = Modal;

interface DailyTask {
  _id: string;
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

const DailyTasks: React.FC<DailyTasksProps> = ({ goalId }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/goals/${goalId}/tasks`);
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [goalId]);

  const generateTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/goals/${goalId}/generate-tasks`, {
        method: 'POST',
      });
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'completed' | 'skipped') => {
    try {
      const response = await fetch(`http://localhost:3001/api/goals/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const updatedTask = await response.json();
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ));
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
          const response = await fetch(`http://localhost:3001/api/goals/tasks/${taskId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete task');
          }

          setTasks(tasks.filter(task => task._id !== taskId));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },
    });
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={4}>Daily Practice Sessions</Title>
          <Button 
            type="primary" 
            onClick={generateTasks} 
            loading={loading}
          >
            Generate Practice Plan
          </Button>
        </Space>

        <List
          dataSource={tasks}
          renderItem={task => (
            <List.Item
              actions={[
                task.status === 'pending' && (
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CheckCircleOutlined />}
                      onClick={() => updateTaskStatus(task._id, 'completed')}
                    >
                      Complete Session
                    </Button>
                    <Button 
                      onClick={() => updateTaskStatus(task._id, 'skipped')}
                    >
                      Skip
                    </Button>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteTask(task._id)}
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
                    <Collapse ghost>
                      <Panel 
                        header={
                          <Space>
                            <InfoCircleOutlined />
                            <Text>Session Details</Text>
                          </Space>
                        } 
                        key="1"
                      >
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
                        {task.notes && (
                          <Space direction="vertical">
                            <Text strong>Tips & Strategies:</Text>
                            <Paragraph>
                              <FileTextOutlined style={{ marginRight: 8 }} />
                              {task.notes}
                            </Paragraph>
                          </Space>
                        )}
                      </Panel>
                    </Collapse>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};

export default DailyTasks; 