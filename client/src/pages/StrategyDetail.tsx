import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Play, Square, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface StrategyDetail {
  id: number;
  name: string;
  description?: string;
  status: string;
  initialCapital: string;
  currentCapital: string;
  realizedPnl: string;
  unrealizedPnl: string;
  trades: any[];
  openPositions: any[];
  logs: any[];
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
}

export default function StrategyDetail() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/strategy/:id");
  const strategyId = params?.id ? parseInt(params.id) : null;

  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const detailQuery = trpc.strategy.detail.useQuery(
    { strategyId: strategyId! },
    {
      enabled: isAuthenticated && !!strategyId,
      refetchInterval: 3000, // Refresh every 3 seconds
    }
  );

  const startMutation = trpc.strategy.start.useMutation();
  const stopMutation = trpc.strategy.stop.useMutation();

  useEffect(() => {
    if (detailQuery.data) {
      setStrategy(detailQuery.data as StrategyDetail);
      setLoading(false);
    }
  }, [detailQuery.data]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading strategy...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (!strategy) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Strategy not found</p>
          <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync({ strategyId: strategy.id });
      toast.success("Strategy started");
      detailQuery.refetch();
    } catch (error) {
      toast.error((error as any).message || "Failed to start strategy");
    }
  };

  const handleStop = async () => {
    try {
      await stopMutation.mutateAsync({ strategyId: strategy.id });
      toast.success("Strategy stopped");
      detailQuery.refetch();
    } catch (error) {
      toast.error((error as any).message || "Failed to stop strategy");
    }
  };

  const totalPnl = strategy.totalRealizedPnl + strategy.totalUnrealizedPnl;
  const pnlPercent = (totalPnl / parseFloat(strategy.initialCapital)) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{strategy.name}</h1>
              <p className="text-gray-600 mt-1">{strategy.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {strategy.status === "active" ? (
              <Button
                onClick={handleStop}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
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

        {/* P&L Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Initial Capital</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{parseFloat(strategy.initialCapital).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Current Capital</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{parseFloat(strategy.currentCapital).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Realized P&L</p>
            <p className={`text-2xl font-bold mt-2 ${strategy.totalRealizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{strategy.totalRealizedPnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Unrealized P&L</p>
            <p className={`text-2xl font-bold mt-2 ${strategy.totalUnrealizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{strategy.totalUnrealizedPnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Total P&L */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total P&L</p>
              <p className={`text-4xl font-bold mt-2 ${totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
              <p className={`text-sm font-medium mt-1 ${pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
              </p>
            </div>
            {totalPnl >= 0 ? (
              <TrendingUp className="w-16 h-16 text-green-600 opacity-20" />
            ) : (
              <TrendingDown className="w-16 h-16 text-red-600 opacity-20" />
            )}
          </div>
        </Card>

        {/* Open Positions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Open Positions</h2>
          {strategy.openPositions.length === 0 ? (
            <Card className="p-6 text-center text-gray-600">
              No open positions
            </Card>
          ) : (
            <div className="grid gap-4">
              {strategy.openPositions.map((pos) => (
                <Card key={pos.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {pos.action} {pos.quantity} {pos.instrument}
                      </p>
                      <p className="text-sm text-gray-600">
                        Entry: ₹{parseFloat(pos.entryPrice).toFixed(2)} | Current: ₹{parseFloat(pos.currentPrice).toFixed(2)}
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${parseFloat(pos.unrealizedPnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{parseFloat(pos.unrealizedPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Closed Trades */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trade History</h2>
          {strategy.trades.length === 0 ? (
            <Card className="p-6 text-center text-gray-600">
              No trades yet
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Instrument</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Entry</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Exit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">P&L</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {strategy.trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{trade.instrument}</td>
                      <td className="px-4 py-3">{trade.action}</td>
                      <td className="px-4 py-3">{trade.quantity}</td>
                      <td className="px-4 py-3">₹{parseFloat(trade.entryPrice).toFixed(2)}</td>
                      <td className="px-4 py-3">₹{parseFloat(trade.exitPrice || 0).toFixed(2)}</td>
                      <td className={`px-4 py-3 font-semibold ${parseFloat(trade.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ₹{parseFloat(trade.pnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-xs bg-gray-100 px-2 py-1 rounded">
                        {trade.exitReason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Execution Logs */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execution Logs</h2>
          {strategy.logs.length === 0 ? (
            <Card className="p-6 text-center text-gray-600">
              No logs yet
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {strategy.logs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded w-fit">
                        {log.eventType}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
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
