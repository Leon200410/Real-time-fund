import React, { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tabs,
  Table,
  Spin,
  Alert,
} from "antd";
import { PlusOutlined, FileTextOutlined } from "@ant-design/icons";
import { FundStorageItem } from "../types";
import { parseFundText, ParsedFundItem } from "../utils/parser";

interface AddFundProps {
  onAdd: (item: FundStorageItem) => void;
}

const AddFund: React.FC<AddFundProps> = ({ onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Batch Import States
  const [batchText, setBatchText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedFundItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleOpen = () => {
    setIsModalOpen(true);
    setBatchText("");
    setParsedItems([]);
    setShowPreview(false);
  };

  const handleCancel = () => setIsModalOpen(false);

  // Manual Add
  const onFinish = (values: any) => {
    onAdd({
      code: values.code,
      share: values.share,
      cost: values.cost,
    });
    setIsModalOpen(false);
    form.resetFields();
    message.success("添加成功");
  };

  // Batch Parse
  const handleParse = async () => {
    if (!batchText.trim()) {
      message.warning("请输入内容");
      return;
    }

    setIsParsing(true);
    try {
      const results = await parseFundText(batchText);
      if (results.length === 0) {
        message.warning("未识别到有效数据，请检查格式");
      } else {
        setParsedItems(results);
        setShowPreview(true);
      }
    } catch (error) {
      console.error(error);
      message.error("解析出错");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    const validItems = parsedItems.filter(
      (i) => i.status === "matched" && i.code && i.share,
    );
    if (validItems.length === 0) {
      message.warning("没有可导入的有效数据");
      return;
    }

    validItems.forEach((item) => {
      if (item.code && item.share) {
        onAdd({
          code: item.code,
          share: item.share,
          cost: item.cost ? parseFloat(item.cost.toFixed(2)) : undefined,
        });
      }
    });

    message.success(`成功导入 ${validItems.length} 个基金`);
    handleCancel();
  };

  const columns = [
    {
      title: "原始文本/名称",
      dataIndex: "rawLine",
      width: 150,
      ellipsis: true,
    },
    {
      title: "匹配基金",
      key: "match",
      render: (_: any, record: ParsedFundItem) => {
        if (record.status === "searching") return <Spin size="small" />;
        if (record.status === "failed")
          return <span style={{ color: "red" }}>{record.error || "失败"}</span>;

        return (
          <div style={{ fontSize: "12px" }}>
            <div style={{ fontWeight: "bold" }}>{record.name}</div>
            <div style={{ color: "#888" }}>{record.code}</div>
          </div>
        );
      },
    },
    {
      title: "持有数据",
      key: "data",
      render: (_: any, record: ParsedFundItem) => (
        <div style={{ fontSize: "12px" }}>
          <div>份额: {record.share}</div>
          {record.cost && <div>成本: {record.cost.toFixed(2)}</div>}
          {record.amount && (
            <div style={{ color: "#888" }}>市值: {record.amount}</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleOpen}>
        添加基金
      </Button>
      <Modal
        title="添加基金"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "手动输入",
              children: (
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    name="code"
                    label="基金代码"
                    rules={[
                      {
                        required: true,
                        pattern: /^\d{6}$/,
                        message: "请输入6位数字代码",
                      },
                    ]}
                  >
                    <Input placeholder="001186" maxLength={6} />
                  </Form.Item>
                  <Form.Item
                    name="share"
                    label="持有份额"
                    rules={[{ required: true, message: "请输入持有份额" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                  <Form.Item
                    name="cost"
                    label="持仓成本(总金额) - 可选"
                    tooltip="如果不填，将无法计算持有收益"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      确认添加
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "2",
              label: "批量文本导入",
              children: (
                <>
                  {!showPreview ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <Alert
                        message="支持批量文本导入"
                        description={
                          <ul
                            style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}
                          >
                            <li>格式：代码 持有金额 持有收益 (一行一个)</li>
                            <li>示例：001186 10000 200</li>
                            <li>
                              说明：系统将自动根据金额和代码反推份额，根据收益反推成本
                            </li>
                          </ul>
                        }
                        type="info"
                        showIcon
                      />
                      <Input.TextArea
                        rows={8}
                        value={batchText}
                        onChange={(e) => setBatchText(e.target.value)}
                        placeholder={`示例：
001186 14521.97 -478.03
002145 5000 120`}
                      />
                      <Button
                        type="primary"
                        onClick={handleParse}
                        loading={isParsing}
                        icon={<FileTextOutlined />}
                      >
                        智能识别并预览
                      </Button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <Alert
                        message="请核对识别结果，特别是份额估算是否准确"
                        type="warning"
                        showIcon
                      />
                      <Table
                        dataSource={parsedItems}
                        columns={columns}
                        pagination={false}
                        size="small"
                        scroll={{ y: 300 }}
                        rowKey="key"
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <Button onClick={() => setShowPreview(false)} block>
                          返回修改
                        </Button>
                        <Button type="primary" onClick={handleImport} block>
                          确认导入
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default AddFund;
