import React, { useState } from 'react';
import { Button, Modal, Input, message, Tooltip } from 'antd';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import { FundItem } from '../types';

interface ExportFundProps {
  funds: FundItem[];
}

const ExportFund: React.FC<ExportFundProps> = ({ funds }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportText, setExportText] = useState('');

  const generateExportText = () => {
    const lines: string[] = [];
    let errorCount = 0;

    funds.forEach(fund => {
      // We need valid share and cost to export meaningful data
      // We also need dwjz (Unit Net Value) to calculate current Market Value (Amount)
      // Format: Code Amount Gain
      // Amount = Share * DWJZ
      // Gain = Amount - Cost
      
      if (!fund.fundcode || fund.share === undefined || fund.cost === undefined) {
        return;
      }

      const dwjz = parseFloat(fund.dwjz || '0');
      
      if (isNaN(dwjz) || dwjz === 0) {
        // If we can't get the current net value, we can't calculate the Market Value accurately
        // matching the import format which expects Market Value.
        // We could try to use gsz (estimated value) if dwjz is missing, but dwjz is safer.
        // If neither is available, we can't export this item correctly in this format.
        errorCount++;
        return;
      }

      const marketValue = fund.share * dwjz;
      const gain = marketValue - fund.cost;

      // Format with 2 decimal places
      const line = `${fund.fundcode} ${marketValue.toFixed(2)} ${gain.toFixed(2)}`;
      lines.push(line);
    });

    if (errorCount > 0) {
      message.warning(`${errorCount} 个基金因缺少净值数据无法导出`);
    }

    if (lines.length === 0 && funds.length > 0 && errorCount === 0) {
       message.info('没有包含完整持仓数据（份额+成本）的基金可导出');
    }

    return lines.join('\n');
  };

  const handleOpen = () => {
    const text = generateExportText();
    if (!text && funds.length > 0) {
        // Messages handled in generateExportText
    }
    setExportText(text);
    setIsModalOpen(true);
  };

  const handleCopy = () => {
    if (!exportText) return;
    navigator.clipboard.writeText(exportText).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  return (
    <>
      <Tooltip title="导出为可导入的文本格式">
        <Button 
          icon={<ExportOutlined />} 
          onClick={handleOpen}
          style={{ marginLeft: 8 }}
        >
          导出
        </Button>
      </Tooltip>
      <Modal
        title="导出基金配置"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制全部
          </Button>,
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            关闭
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
            <p>以下文本符合导入格式 (代码 市值 收益)，可直接复制保存或分享：</p>
        </div>
        <Input.TextArea 
          value={exportText} 
          autoSize={{ minRows: 6, maxRows: 15 }} 
          readOnly 
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </>
  );
};

export default ExportFund;
