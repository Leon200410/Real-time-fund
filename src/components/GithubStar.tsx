import React, { useState } from 'react';
import { Button, Modal, Typography, Steps } from 'antd';
import { GithubOutlined, StarOutlined, LikeOutlined } from '@ant-design/icons';

const { Paragraph, Title, Link } = Typography;

const GithubStar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const projectUrl = 'https://github.com/Leon200410/Real-time-fund';

  return (
    <>
      <Button 
        type="text" 
        icon={<GithubOutlined style={{ fontSize: '20px', color: 'white' }} />} 
        onClick={showModal}
        style={{ color: 'white' }}
      >
        Star Project
      </Button>
      <Modal
        title="支持本项目"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>,
          <Button 
            key="github" 
            type="primary" 
            icon={<GithubOutlined />} 
            href={projectUrl} 
            target="_blank"
          >
            前往 GitHub 点 Star
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={4}>觉得好用吗？</Title>
          <Paragraph>
            如果您喜欢 <b>Real-time Fund</b>，请在 GitHub 上为我们点亮一颗星（Star）！
            <br />
            您的支持是我们更新的动力。
          </Paragraph>

          <div style={{ marginTop: 30, marginBottom: 30, textAlign: 'left' }}>
            <Steps
              direction="vertical"
              size="small"
              current={-1}
              items={[
                {
                  title: '第一步',
                  description: '点击右下角的“前往 GitHub 点 Star”按钮打开项目主页。',
                  icon: <GithubOutlined />,
                },
                {
                  title: '第二步',
                  description: (
                    <span>
                      在页面右上角找到 <StarOutlined /> <b>Star</b> 按钮。
                    </span>
                  ),
                  icon: <StarOutlined />,
                },
                {
                  title: '第三步',
                  description: '点击按钮，点亮星星，完成支持！',
                  icon: <LikeOutlined />,
                },
              ]}
            />
          </div>
          
          <Paragraph type="secondary" style={{ fontSize: '12px' }}>
            项目地址: <Link href={projectUrl} target="_blank">{projectUrl}</Link>
          </Paragraph>
        </div>
      </Modal>
    </>
  );
};

export default GithubStar;
