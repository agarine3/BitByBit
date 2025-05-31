import React, { useState } from 'react';
import { Calendar as AntCalendar, Badge, Modal, List, Button, Space, message, Typography, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useQuery, useMutation, gql } from '@apollo/client';

const { Text, Paragraph } = Typography;

const GET_GOALS = gql`
  query GetGoals {
    goals {
      id
      title
      tasks {
        id
        title
        description
        estimatedTime
        status
        dueDate
        successCriteria
        prerequisites
        notes
        dailyFocus
        resources
      }
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

interface Task {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: 'pending' | 'completed' | 'skipped';
  dueDate: string;
  successCriteria: string[];
  prerequisites: string[];
  notes: string;
  dailyFocus: string;
  resources: string[];
}

interface Goal {
  id: string;
  title: string;
  tasks: Task[];
}

interface GoalsData {
  goals: Goal[];
}

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { error, data } = useQuery<GoalsData>(GET_GOALS);
  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS);

  React.useEffect(() => {
    if (error) {
      console.error('Error fetching goals:', error);
      message.error('Failed to fetch goals');
    }
  }, [error]);

  const getAllTasks = React.useCallback(() => {
    const tasks = data?.goals.flatMap(goal => 
      goal.tasks.map(task => ({
        ...task,
        goalTitle: goal.title
      }))
    ) || [];
    console.log('All tasks:', tasks);
    return tasks;
  }, [data?.goals]);

  const getTasksForDate = React.useCallback((date: Dayjs) => {
    const tasks = getAllTasks().filter(task => {
      // Handle both string timestamps and Date objects
      const taskDate = typeof task.dueDate === 'string' 
        ? dayjs(parseInt(task.dueDate))
        : dayjs(task.dueDate);
      
      const isSameDay = taskDate.isSame(date, 'day');
      console.log('Comparing dates:', {
        taskDate: taskDate.format('YYYY-MM-DD'),
        selectedDate: date.format('YYYY-MM-DD'),
        isSameDay,
        taskTitle: task.title,
        rawDueDate: task.dueDate
      });
      return isSameDay;
    });
    console.log('Tasks for date:', date.format('YYYY-MM-DD'), tasks);
    return tasks;
  }, [getAllTasks]);

  const cellRender = React.useCallback((date: Dayjs) => {
    const dateTasks = getTasksForDate(date);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dateTasks.map(task => (
          <li key={task.id} style={{ marginBottom: '4px' }}>
            <Badge
              status={
                task.status === 'completed'
                  ? 'success'
                  : task.status === 'skipped'
                  ? 'error'
                  : 'processing'
              }
              text={
                <span style={{ 
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}>
                  {task.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  }, [getTasksForDate]);

  const handleDateSelect = React.useCallback((date: Dayjs) => {
    setSelectedDate(date);
    setIsModalVisible(true);
  }, []);

  const handleStatusUpdate = React.useCallback(async (taskId: string, newStatus: 'completed' | 'skipped') => {
    try {
      await updateTaskStatus({
        variables: { taskId, status: newStatus },
      });
      message.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      message.error('Failed to update task status');
    }
  }, [updateTaskStatus]);

  const renderTaskList = React.useCallback((dateTasks: (Task & { goalTitle: string })[]) => {
    if (dateTasks.length === 0) {
      return <p>No tasks for this date</p>;
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <List
          dataSource={dateTasks}
          renderItem={task => (
            <List.Item
              actions={[
                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                    disabled={task.status === 'completed'}
                  >
                    Complete
                  </Button>
                  <Button
                    danger
                    onClick={() => handleStatusUpdate(task.id, 'skipped')}
                    disabled={task.status === 'skipped'}
                  >
                    Skip
                  </Button>
                </Space>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{task.title}</Text>
                    <Text type="secondary">Goal: {task.goalTitle}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph>{task.description}</Paragraph>
                    <Space>
                      <Tag color="blue">{task.estimatedTime} minutes</Tag>
                      <Tag color="purple">{task.dailyFocus}</Tag>
                    </Space>
                    {task.successCriteria.length > 0 && (
                      <div>
                        <Text strong>Success Criteria:</Text>
                        <ul style={{ marginTop: '4px' }}>
                          {task.successCriteria.map((criteria, index) => (
                            <li key={index}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {task.resources.length > 0 && (
                      <div>
                        <Text strong>Resources:</Text>
                        <ul style={{ marginTop: '4px' }}>
                          {task.resources.map((resource, index) => (
                            <li key={index}>{resource}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Space>
    );
  }, [handleStatusUpdate]);

  return (
    <div style={{ padding: '24px' }}>
      <AntCalendar
        cellRender={cellRender}
        onSelect={handleDateSelect}
      />
      <Modal
        title={selectedDate ? `Tasks for ${selectedDate.format('MMMM D, YYYY')}` : 'Tasks'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDate && renderTaskList(getTasksForDate(selectedDate))}
      </Modal>
    </div>
  );
};

export default Calendar; 