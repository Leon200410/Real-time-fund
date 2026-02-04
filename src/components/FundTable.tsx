import React from "react";
import { Table, Button, Popconfirm, Tag, Tooltip, Statistic, Card } from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { FundItem } from "../types";

interface FundTableProps {
  data: FundItem[];
  loading: boolean;
  onRemove: (code: string) => void;
  onRefresh: () => void;
}

const FundTable: React.FC<FundTableProps> = ({
  data,
  loading,
  onRemove,
  onRefresh,
}) => {
  // Calculate summary
  const totalValue = data.reduce((sum, item) => {
    if (item.gsz && item.share) {
      return sum + parseFloat(item.gsz) * item.share;
    }
    return sum;
  }, 0);

  const totalDayGain = data.reduce((sum, item) => {
    if (item.gsz && item.dwjz && item.share) {
      const gsz = parseFloat(item.gsz);
      const dwjz = parseFloat(item.dwjz);
      return sum + (gsz - dwjz) * item.share;
    }
    return sum;
  }, 0);

  const totalHoldGain = data.reduce((sum, item) => {
    if (item.gsz && item.share && item.cost) {
      const currentVal = parseFloat(item.gsz) * item.share;
      return sum + (currentVal - item.cost);
    }
    return sum;
  }, 0);

  // Helper to render card view for mobile
  const renderMobileCard = (item: FundItem) => {
    const gsz = parseFloat(item.gsz || "0");
    const dwjz = parseFloat(item.dwjz || "0");
    const dayGain = item.share ? (gsz - dwjz) * item.share : 0;
    const marketVal = item.share ? gsz * item.share : 0;
    const gszzl = parseFloat(item.gszzl || "0");
    const cost = item.cost || 0;

    return (
      <Card
        key={item.fundcode}
        size="small"
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: "8px 12px" }}
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.name || item.fundcode}
            </span>
          </div>
        }
        extra={
          <Popconfirm
            title="移除?"
            onConfirm={() => onRemove(item.fundcode)}
            okText="是"
            cancelText="否"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ minWidth: 24, padding: 0 }}
            />
          </Popconfirm>
        }
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ flex: "1 1 30%", minWidth: 80 }}>
            <div style={{ color: "#888", fontSize: 11 }}>当日盈亏</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 14,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: 2,
              }}
            >
              <>
                <span
                  style={{
                    color:
                      dayGain > 0 ? "red" : dayGain < 0 ? "green" : "black",
                  }}
                >
                  {dayGain > 0 ? "+" : ""}
                  {dayGain.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "normal",
                    color: gszzl > 0 ? "red" : gszzl < 0 ? "green" : "gray",
                  }}
                >
                  ({gszzl > 0 ? "+" : ""}
                  {item.gszzl}%)
                </span>
              </>
            </div>
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 80, textAlign: "center" }}>
            <div style={{ color: "#888", fontSize: 11 }}>持有市值</div>
            <div style={{ fontSize: 14 }}>
              {showSensitive ? marketVal.toFixed(2) : "****"}
            </div>
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 80, textAlign: "right" }}>
            <div style={{ color: "#888", fontSize: 11 }}>持仓成本</div>
            <div style={{ fontSize: 14 }}>
              {showSensitive ? (cost > 0 ? cost.toFixed(2) : "--") : "****"}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const columns = [
    {
      title: "基金名称",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left" as const,
      render: (text: string, record: FundItem) => {
        if (record.error) {
          return (
            <Tooltip title={record.error}>
              <span style={{ color: "red" }}>
                <ExclamationCircleOutlined /> 失败
              </span>
            </Tooltip>
          );
        }
        return (
          <div style={{ whiteSpace: "normal", wordBreak: "break-all" }}>
            {text}
            <div style={{ fontSize: 12, color: "#999" }}>{record.fundcode}</div>
          </div>
        );
      },
    },
    {
      title: "估算净值",
      dataIndex: "gsz",
      key: "gsz",
      width: 100,
      render: (text: string) =>
        text ? <span style={{ fontWeight: "bold" }}>{text}</span> : "--",
    },
    {
      title: "估算涨跌",
      dataIndex: "gszzl",
      key: "gszzl",
      width: 120,
      sorter: (a: FundItem, b: FundItem) => {
        const valA = a.gszzl ? parseFloat(a.gszzl) : -9999;
        const valB = b.gszzl ? parseFloat(b.gszzl) : -9999;
        return valA - valB;
      },
      render: (text: string) => {
        if (!text) return "--";
        const val = parseFloat(text);
        const color = val > 0 ? "red" : val < 0 ? "green" : "gray";
        return (
          <Tag color={color}>
            {val > 0 ? "+" : ""}
            {text}%
          </Tag>
        );
      },
    },
    {
      title: "当日盈亏",
      key: "dayGain",
      width: 120,
      sorter: (a: FundItem, b: FundItem) => {
        let gainA = -999999;
        if (a.gsz && a.dwjz && a.share) {
          gainA = (parseFloat(a.gsz) - parseFloat(a.dwjz)) * a.share;
        }
        let gainB = -999999;
        if (b.gsz && b.dwjz && b.share) {
          gainB = (parseFloat(b.gsz) - parseFloat(b.dwjz)) * b.share;
        }
        return gainA - gainB;
      },
      render: (_: any, record: FundItem) => {
        if (record.gsz && record.dwjz && record.share) {
          const diff = parseFloat(record.gsz) - parseFloat(record.dwjz);
          const gain = diff * record.share;
          const color = gain > 0 ? "red" : gain < 0 ? "green" : "black";
          return (
            <span style={{ color, fontWeight: "bold" }}>
              {gain > 0 ? "+" : ""}
              {gain.toFixed(2)}
            </span>
          );
        }
        return "--";
      },
    },
    {
      title: "估算市值",
      key: "marketValue",
      width: 120,
      render: (_: any, record: FundItem) => {
        if (record.gsz && record.share) {
          const val = parseFloat(record.gsz) * record.share;
          return <span>{showSensitive ? val.toFixed(2) : "****"}</span>;
        }
        return "--";
      },
    },
    {
      title: "持有收益",
      key: "holdGain",
      width: 140,
      sorter: (a: FundItem, b: FundItem) => {
        let gainA = -999999;
        if (a.gsz && a.share && a.cost) {
          gainA = parseFloat(a.gsz) * a.share - a.cost;
        }
        let gainB = -999999;
        if (b.gsz && b.share && b.cost) {
          gainB = parseFloat(b.gsz) * b.share - b.cost;
        }
        return gainA - gainB;
      },
      render: (_: any, record: FundItem) => {
        if (record.gsz && record.share && record.cost) {
          const marketVal = parseFloat(record.gsz) * record.share;
          const gain = marketVal - record.cost;
          const color = gain > 0 ? "red" : gain < 0 ? "green" : "black";
          const rate = (gain / record.cost) * 100;
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "12px",
              }}
            >
              <span style={{ color }}>
                {gain > 0 ? "+" : ""}
                {gain.toFixed(2)}
              </span>
              <span style={{ color: color }}>({rate.toFixed(2)}%)</span>
            </div>
          );
        }
        return "--";
      },
    },
    {
      title: "持有份额",
      dataIndex: "share",
      key: "share",
      width: 100,
      render: (val: number) => (val ? val.toFixed(2) : "--"),
    },
    {
      title: "持仓成本",
      dataIndex: "cost",
      key: "cost",
      width: 100,
      render: (val: number) =>
        showSensitive ? (val ? val.toFixed(2) : "--") : "****",
    },
    {
      title: "更新时间",
      dataIndex: "gztime",
      key: "gztime",
      width: 100,
      render: (text: string) => (text ? text.split(" ")[1] : "--"), // Only show time part
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: FundItem) => (
        <Popconfirm
          title="移除?"
          onConfirm={() => onRemove(record.fundcode)}
          okText="是"
          cancelText="否"
        >
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [showSensitive, setShowSensitive] = React.useState(true); // Control sensitive data visibility

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {/* Statistics Header - Responsive */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 8 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: isMobile ? "8px" : "20px",
            flexWrap: "wrap",
            justifyContent: isMobile ? "space-between" : "flex-start",
          }}
        >
          <Card
            size="small"
            style={{ flex: isMobile ? "1 1 30%" : "none" }}
            bodyStyle={{ padding: "8px" }}
          >
            <Statistic
              title="总市值"
              value={showSensitive ? totalValue : undefined}
              formatter={showSensitive ? undefined : () => "****"}
              precision={2}
              valueStyle={{ fontSize: isMobile ? 16 : 24 }}
            />
          </Card>
          <Card
            size="small"
            style={{ flex: isMobile ? "1 1 30%" : "none" }}
            bodyStyle={{ padding: "8px" }}
          >
            <Statistic
              title="当日盈亏"
              value={totalDayGain}
              precision={2}
              valueStyle={{
                color: totalDayGain >= 0 ? "#cf1322" : "#3f8600",
                fontSize: isMobile ? 16 : 24,
              }}
              prefix={
                totalDayGain >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />
              }
            />
          </Card>
          <Card
            size="small"
            style={{ flex: isMobile ? "1 1 30%" : "none" }}
            bodyStyle={{ padding: "8px" }}
          >
            <Statistic
              title="持有收益"
              value={totalHoldGain}
              precision={2}
              valueStyle={{
                color: totalHoldGain >= 0 ? "#cf1322" : "#3f8600",
                fontSize: isMobile ? 16 : 24,
              }}
              prefix={totalHoldGain >= 0 ? "+" : ""}
            />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <Button
              icon={showSensitive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => setShowSensitive(!showSensitive)}
              block={isMobile}
              style={!isMobile ? { width: 40 } : { flex: 1 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              block={isMobile}
              type={isMobile ? "primary" : "default"}
              style={isMobile ? { flex: 4 } : {}}
            >
              {isMobile ? "刷新" : "刷新"}
            </Button>
          </div>
          {isMobile && data.length > 0 && data[0].gztime && (
            <div style={{ textAlign: "center", fontSize: 12, color: "#999" }}>
              更新时间: {data[0].gztime}
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        <div style={{ background: "#f5f5f5", padding: "1px 0" }}>
          {data.map((item) => renderMobileCard(item))}
          {data.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
              暂无数据
            </div>
          )}
        </div>
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="fundcode"
          loading={loading}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
        />
      )}
    </div>
  );
};

export default FundTable;
