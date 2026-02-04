import React, { useEffect, useState, useCallback } from "react";
import { Layout, Typography, Card, message } from "antd";
import { FundOutlined } from "@ant-design/icons";
import AddFund from "./components/AddFund";
import ExportFund from "./components/ExportFund";
import GithubStar from "./components/GithubStar";
import FundTable from "./components/FundTable";
import { getStoredFunds, removeFund, addFund } from "./utils/storage";
import { fetchFundData } from "./services/api";
import { FundItem, FundStorageItem } from "./types";
import "./App.css";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [funds, setFunds] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data for all stored funds
  const loadData = useCallback(async () => {
    setLoading(true);
    const storedFunds = getStoredFunds();
    if (storedFunds.length === 0) {
      setFunds([]);
      setLoading(false);
      return;
    }

    try {
      const promises = storedFunds.map(async (item) => {
        const data = await fetchFundData(item.code);
        return {
          ...data,
          share: item.share,
          cost: item.cost,
        };
      });

      const results = await Promise.all(promises);
      setFunds(results);
    } catch (error) {
      console.error("Failed to load fund data", error);
      message.error("部分数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh setup
  useEffect(() => {
    loadData();

    // Auto refresh every 60 seconds
    const intervalId = setInterval(() => {
      const storedFunds = getStoredFunds();
      if (storedFunds.length > 0) {
        Promise.all(
          storedFunds.map(async (item) => {
            const data = await fetchFundData(item.code);
            return {
              ...data,
              share: item.share,
              cost: item.cost,
            };
          }),
        ).then((results) => {
          setFunds(results);
        });
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  const handleAddFund = async (item: FundStorageItem) => {
    // Save to storage
    addFund(item);

    // Fetch data immediately
    const newData = await fetchFundData(item.code);
    if (newData.error) {
      message.warning(
        `基金 ${item.code} 数据获取失败: ${newData.error}，但已添加到列表`,
      );
    }

    const newFundItem: FundItem = {
      ...newData,
      share: item.share,
      cost: item.cost,
    };

    setFunds((prev) => {
      // Check if exists, update if so
      const index = prev.findIndex((f) => f.fundcode === item.code);
      if (index >= 0) {
        const newArr = [...prev];
        newArr[index] = newFundItem;
        return newArr;
      }
      return [...prev, newFundItem];
    });
  };

  const handleRemoveFund = (code: string) => {
    removeFund(code);
    setFunds((prev) => prev.filter((item) => item.fundcode !== code));
  };

  return (
    <Layout className="layout" style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <FundOutlined
            style={{ color: "white", fontSize: "24px", marginRight: "10px" }}
          />
          <Title level={3} style={{ color: "white", margin: 0 }}>
            实时基金估值助手
          </Title>
        </div>
        <GithubStar />
      </Header>
      <Content style={{ padding: "0 50px", marginTop: "20px" }}>
        <div className="site-layout-content">
          <Card title="我的基金" variant="borderless">
            <div style={{ marginBottom: 16 }}>
              <AddFund onAdd={handleAddFund} />
              <ExportFund funds={funds} />
            </div>
            <FundTable
              data={funds}
              loading={loading}
              onRemove={handleRemoveFund}
              onRefresh={loadData}
            />
          </Card>
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Real-time Fund Valuation ©{new Date().getFullYear()} Created with React
        & Ant Design
      </Footer>
    </Layout>
  );
};

export default App;
