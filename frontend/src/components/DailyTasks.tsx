import React, { useState, useEffect } from 'react';
import { Card, List, Button, Progress, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface DailyTask {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed' | 'skipped';
  dueDate: string;
  completedAt?: string;
}

interface DailyTasksProps {
  goalId: string;
}

const DailyTasks: React.FC<DailyTasksProps> = ({ goalId }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/goals/${goalId}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

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

  useEffect(() => {
    fetchTasks();
  }, [goalId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={4}>Daily Tasks</Title>
          <Button 
            type="primary" 
            onClick={generateTasks} 
            loading={loading}
          >
            Generate Tasks
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
                      Complete
                    </Button>
                    <Button 
                      onClick={() => updateTaskStatus(task._id, 'skipped')}
                    >
                      Skip
                    </Button>
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
                    <Tag color={getDifficultyColor(task.difficulty)}>
                      {task.difficulty}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />}>
                      {task.estimatedTime} min
                    </Tag>
                  </Space>
                }
                description={task.description}
              />
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};

export default DailyTasks; 