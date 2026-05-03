/**
 * Market Data Service
 * Simulates real-time price feeds for trading instruments
 */

export interface MarketPrice {
  instrument: string;
  ltp: number;
  timestamp: Date;
}

export class MarketDataService {
  private static prices: Map<string, number> = new Map([
    ["NIFTY", 23000],
    ["BANKNIFTY", 48000],
  ]);

  private static volatility = 0.02; // 2% volatility per update
  private static updateInterval = 5000; // Update every 5 seconds

  /**
   * Get current price for an instrument
   */
  static getPrice(instrument: string): number {
    return this.prices.get(instrument) || 0;
  }

  /**
   * Simulate price movement (random walk)
   */
  static simulatePriceMovement(instrument: string): number {
    const currentPrice = this.prices.get(instrument) || 0;
    if (currentPrice === 0) return 0;

    // Random walk: +/- volatility percentage
    const change = (Math.random() - 0.5) * 2 * this.volatility;
    const newPrice = currentPrice * (1 + change);

    this.prices.set(instrument, newPrice);
    return newPrice;
  }

  /**
   * Get all current market prices
   */
  static getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }

  /**
   * Update all prices (called by execution loop)
   */
  static updateAllPrices(): Map<string, number> {
    const updatedPrices = new Map<string, number>();

    Array.from(this.prices.keys()).forEach((instrument) => {
      const newPrice = this.simulatePriceMovement(instrument);
      updatedPrices.set(instrument, newPrice);
    });

    return updatedPrices;
  }

  /**
   * Reset prices to initial state (for testing)
   */
  static resetPrices(): void {
    this.prices.set("NIFTY", 23000);
    this.prices.set("BANKNIFTY", 48000);
  }

  /**
   * Set custom price for testing
   */
  static setPrice(instrument: string, price: number): void {
    this.prices.set(instrument, price);
  }
}
