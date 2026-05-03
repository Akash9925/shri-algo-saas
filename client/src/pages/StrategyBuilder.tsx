import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Leg {
  instrument: string;
  type: "CE" | "PE";
  action: "BUY" | "SELL";
  strike: string;
  quantity: number;
  stoploss: number;
  target: number;
  trailing_sl?: boolean;
}

export default function StrategyBuilder() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialCapital, setInitialCapital] = useState("100000");
  const [legs, setLegs] = useState<Leg[]>([
    {
      instrument: "NIFTY",
      type: "CE",
      action: "BUY",
      strike: "ATM",
      quantity: 1,
      stoploss: 100,
      target: 200,
      trailing_sl: false,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const createStrategy = trpc.strategy.create.useMutation();

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleAddLeg = () => {
    setLegs([
      ...legs,
      {
        instrument: "NIFTY",
        type: "CE",
        action: "BUY",
        strike: "ATM",
        quantity: 1,
        stoploss: 100,
        target: 200,
        trailing_sl: false,
      },
    ]);
  };

  const handleRemoveLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index));
  };

  const handleLegChange = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    (newLegs[index] as any)[field] = value;
    setLegs(newLegs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name.trim()) {
        toast.error("Strategy name is required");
        setLoading(false);
        return;
      }

      if (legs.length === 0) {
        toast.error("At least one leg is required");
        setLoading(false);
        return;
      }

      const config: any = {
        entry: {
          type: "time" as const,
          value: "09:15",
        },
        legs,
        overall: {
          mtm_stoploss: -10000,
          mtm_target: 10000,
        },
        reentry: {
          enabled: false,
          max_reentries: 1,
        },
      };

      await createStrategy.mutateAsync({
        name,
        description,
        config: config as any,
        initialCapital: parseFloat(initialCapital),
      });

      toast.success("Strategy created successfully!");
      setLocation("/dashboard");
    } catch (error) {
      toast.error((error as any).message || "Failed to create strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Strategy</h1>
          <p className="text-gray-600 mt-1">Build your trading strategy with multiple legs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Strategy Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Iron Condor"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Capital (₹) *
                </label>
                <Input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  placeholder="100000"
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Legs */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Strategy Legs</h2>
              <Button
                type="button"
                onClick={handleAddLeg}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Leg
              </Button>
            </div>

            <div className="space-y-4">
              {legs.map((leg, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">Leg {index + 1}</h3>
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Instrument
                      </label>
                      <select
                        value={leg.instrument}
                        onChange={(e) => handleLegChange(index, "instrument", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option>NIFTY</option>
                        <option>BANKNIFTY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={leg.type}
                        onChange={(e) => handleLegChange(index, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option>CE</option>
                        <option>PE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Action
                      </label>
                      <select
                        value={leg.action}
                        onChange={(e) => handleLegChange(index, "action", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option>BUY</option>
                        <option>SELL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Strike
                      </label>
                      <Input
                        type="text"
                        value={leg.strike}
                        onChange={(e) => handleLegChange(index, "strike", e.target.value)}
                        placeholder="ATM"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        value={leg.quantity}
                        onChange={(e) => handleLegChange(index, "quantity", parseInt(e.target.value))}
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stoploss (₹)
                      </label>
                      <Input
                        type="number"
                        value={leg.stoploss}
                        onChange={(e) => handleLegChange(index, "stoploss", parseFloat(e.target.value))}
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Target (₹)
                      </label>
                      <Input
                        type="number"
                        value={leg.target}
                        onChange={(e) => handleLegChange(index, "target", parseFloat(e.target.value))}
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create Strategy"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
