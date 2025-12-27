import AsyncStorage from "@react-native-async-storage/async-storage";

// Always use USD as the base for consistency (Triangulation)
const BASE_CURRENCY = "USD";
const CACHE_KEY = "currency_rates_usd_v1"; // Changed key to avoid legacy cache
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedRates {
  timestamp: number;
  rates: Record<string, number>;
}

export const fetchExchangeRate = async (
  base: string,
  target: string
): Promise<number> => {
  if (base === target) return 1;

  try {
    // 1. Get USD-based rates (from Cache or API)
    let rates: Record<string, number> | null = null;
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);

    if (cachedData) {
      const parsed = JSON.parse(cachedData) as CachedRates;
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        rates = parsed.rates;
      }
    }

    if (!rates) {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`
      );
      const data = await response.json();
      rates = data.rates;

      // Cache it
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          rates: rates,
        })
      );
    }

    if (!rates) throw new Error("Failed to load rates");

    // 2. Calculate Cross-Rate via USD
    // Rate(A -> B) = Rate(USD -> B) / Rate(USD -> A)

    // Safety check: Ensure base and target exist in rates
    // Note: USD->USD is 1, usually present in API, but good to fallback.
    const rateUsdToBase = base === BASE_CURRENCY ? 1 : rates[base];
    const rateUsdToTarget = target === BASE_CURRENCY ? 1 : rates[target];

    if (rateUsdToBase === undefined || rateUsdToTarget === undefined) {
      throw new Error(`Currency not supported: ${base} or ${target}`);
    }

    const finalRate = rateUsdToTarget / rateUsdToBase;

    return finalRate;
  } catch (error) {
    console.error("Failed to fetch exchange rate", error);
    throw error;
  }
};
