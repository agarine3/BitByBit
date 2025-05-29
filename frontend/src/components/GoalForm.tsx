import React from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title } = Typography;

interface GoalFormProps {
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const formattedValues = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    onSubmit(formattedValues);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          dailyTime: 60,
        }}
      >
        <Title level={4}>Create New Goal</Title>
        
        <Form.Item
          name="title"
          label="Goal Title"
          rules={[{ required: true, message: 'Please enter a goal title' }]}
        >
          <Input placeholder="e.g., Learn Piano, Master LeetCode" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Goal Description"
          rules={[{ required: true, message: 'Please enter a goal description' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Describe your goal in detail. Include your current level, what you want to achieve, and any specific areas you want to focus on."
          />
        </Form.Item>

        <Form.Item
          name="currentLevel"
          label="Current Level"
          rules={[{ required: true, message: 'Please describe your current level' }]}
        >
          <TextArea 
            rows={2} 
            placeholder="Describe your current level of expertise or experience in this area"
          />
        </Form.Item>

        <Form.Item
          name="specificAreas"
          label="Specific Areas to Focus On"
          rules={[{ required: true, message: 'Please list specific areas you want to focus on' }]}
        >
          <TextArea 
            rows={2} 
            placeholder="List specific topics, skills, or areas you want to focus on (e.g., 'Basic scales, Sight reading, Rhythm')"
          />
        </Form.Item>

        <Form.Item
          name="dailyTime"
          label="Daily Practice Time (minutes)"
          rules={[{ required: true, message: 'Please enter daily practice time' }]}
        >
          <InputNumber min={15} max={240} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Start Date"
          rules={[{ required: true, message: 'Please select a start date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End Date"
          rules={[{ required: true, message: 'Please select an end date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<PlusOutlined />}
            block
          >
            Create Goal Plan
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GoalForm; 