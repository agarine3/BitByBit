import React, { useState, useEffect } from 'react';
import { Calendar as AntCalendar, Badge, Modal, List, Button, Space, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import axios from 'axios';

interface Task {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: 'pending' | 'completed' | 'skipped';
  dueDate: string;
  goalId: string;
  successCriteria: string[];
  prerequisites: string[];
  notes: string;
  dailyFocus: string;
  resources: string[];
}

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/goals');
      const allTasks = response.data.flatMap((goal: any) => goal.tasks || []);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to fetch tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getTasksForDate = (date: Dayjs) => {
    return tasks.filter(task => {
      const taskDate = dayjs(task.dueDate);
      return taskDate.isSame(date, 'day');
    });
  };

  const dateCellRender = (date: Dayjs) => {
    const dateTasks = getTasksForDate(date);
    return (
      <ul className="events">
        {dateTasks.map(task => (
          <li key={task._id}>
            <Badge
              status={
                task.status === 'completed'
                  ? 'success'
                  : task.status === 'skipped'
                  ? 'error'
                  : 'processing'
              }
              text={task.title}
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setIsModalVisible(true);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: 'completed' | 'skipped') => {
    try {
      await axios.patch(`http://localhost:3001/api/goals/tasks/${taskId}`, {
        status: newStatus
      });
      message.success('Task status updated successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      message.error('Failed to update task status');
    }
  };

  const renderTaskList = (dateTasks: Task[]) => {
    if (dateTasks.length === 0) {
      return <p>No tasks for this date</p>;
    }

    return (
      <List
        dataSource={dateTasks}
        renderItem={task => (
          <List.Item
            actions={[
              <Space>
                <Button
                  type="primary"
                  onClick={() => handleStatusUpdate(task._id, 'completed')}
                  disabled={task.status === 'completed'}
                >
                  Complete
                </Button>
                <Button
                  danger
                  onClick={() => handleStatusUpdate(task._id, 'skipped')}
                  disabled={task.status === 'skipped'}
                >
                  Skip
                </Button>
              </Space>
            ]}
          >
            <List.Item.Meta
              title={task.title}
              description={
                <>
                  <p>{task.description}</p>
                  <p>Estimated Time: {task.estimatedTime} minutes</p>
                  {task.successCriteria.length > 0 && (
                    <p>Success Criteria: {task.successCriteria.join(', ')}</p>
                  )}
                  {task.resources.length > 0 && (
                    <p>Resources: {task.resources.join(', ')}</p>
                  )}
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <AntCalendar
        dateCellRender={dateCellRender}
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