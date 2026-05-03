import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold">Shri Algo</span>
          </div>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Master Algorithmic Trading
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Practice trading strategies in a risk-free environment. Build, test, and refine your algorithms before deploying real capital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition">
              <Zap className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast Execution</h3>
              <p className="text-slate-300 text-sm">
                Real-time strategy execution with simulated market data
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition">
              <Shield className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
              <p className="text-slate-300 text-sm">
                Built-in stoploss, targets, and position tracking
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition">
              <BarChart3 className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Analytics</h3>
              <p className="text-slate-300 text-sm">
                Monitor P&L, trades, and execution logs in real-time
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition">
              <TrendingUp className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Multi-Leg Support</h3>
              <p className="text-slate-300 text-sm">
                Build complex strategies with multiple instruments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start trading?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of traders learning algorithmic trading with Shri Algo
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            Sign Up Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          <p>&copy; 2026 Shri Algo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
