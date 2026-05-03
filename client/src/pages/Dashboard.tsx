import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Play, Square, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

interface Strategy {
  id: number;
  name: string;
  description?: string;
  status: string;
  initialCapital: string;
  currentCapital: string;
  realizedPnl: string;
  unrealizedPnl: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const listStrategies = trpc.strategy.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (listStrategies.data) {
      setStrategies(listStrategies.data as Strategy[]);
      setLoading(false);
    }
  }, [listStrategies.data]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading strategies...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const totalCapital = strategies.reduce((sum, s) => sum + parseFloat(s.currentCapital || "0"), 0);
  const totalPnl = strategies.reduce((sum, s) => sum + parseFloat(s.realizedPnl || "0"), 0);
  const activeCount = strategies.filter((s) => s.status === "active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your trading strategies</p>
          </div>
          <Button
            onClick={() => setLocation("/strategy/new")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Strategy
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Capital</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ₹{totalCapital.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total P&L</p>
                <p className={`text-2xl font-bold mt-2 ${totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              {totalPnl >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Strategies</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Strategies List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Strategies</h2>
          {strategies.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">No strategies yet. Create your first one!</p>
              <Button
                onClick={() => setLocation("/strategy/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Strategy
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {strategies.map((strategy) => (
                <Card
                  key={strategy.id}
                  className="p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setLocation(`/strategy/${strategy.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            strategy.status === "active"
                              ? "bg-green-100 text-green-800"
                              : strategy.status === "created"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                        </span>
                      </div>
                      {strategy.description && (
                        <p className="text-gray-600 text-sm mt-1">{strategy.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Capital</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{parseFloat(strategy.currentCapital).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          parseFloat(strategy.realizedPnl) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {parseFloat(strategy.realizedPnl) >= 0 ? "+" : ""}
                        ₹{parseFloat(strategy.realizedPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
