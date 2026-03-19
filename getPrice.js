const axios = require("axios");

// Use an object/map for O(1) lookups instead of .find() which is O(n)
let prevPricesMap = {};

const getPrices = async () => {
  try {
    const url = "https://liveapi.uk/com/svalpha/";
    const { data } = await axios.get(url);

    if (!data || !Array.isArray(data)) return [];

    // 1. Pre-process symbols to avoid logic inside the main loop
    const processedData = data.map((price, index) => {
      let symb = price.symb?.toLowerCase();
      if (symb === "gold" && index > 0) symb = "goldm";
      if (symb === "silver" && index > 1) symb = "silverm";
      return { ...price, symb };
    });

    const symbolMap = {
      gold: { symbol: "gold", name: "Gold (MCX)" },
      silver: { symbol: "silver", name: "Silver (MCX)" },
      goldm: { symbol: "goldnext", name: "Gold (MCX) Next Month" },
      silverm: { symbol: "silvernext", name: "Silver (MCX) Next Month" },
      spotgold: { symbol: "XAUUSD", name: "Gold (USD)" },
      spotsilver: { symbol: "XAGUSD", name: "Silver (USD)" },
      usdinr: { symbol: "INRSpot", name: "INR Spot" },
    };

    const currentTime = new Date().toLocaleTimeString();

    const prices = processedData.map((item) => {
      const mapping = symbolMap[item.symb] || {
        symbol: item.symb,
        name: item.symb,
      };

      const current = {
        symbol: mapping.symbol,
        Name: mapping.name,
        Bid: Number(item.buy) || 0,
        Ask: Number(item.sell) || 0,
        High: Number(item.high) || 0,
        Low: Number(item.low) || 0,
        LTP: Number(item.rate) || 0,
        Time: currentTime,
        expiry: item.expiry,
        Direction: "neutral",
        BidDirection: "neutral",
        AskDirection: "neutral",
        Difference: Number(item.chg || 0),
        BidDifference: 0,
        AskDifference: 0,
      };

      const prev = prevPricesMap[current.symbol];

      if (prev) {
        // Helper to get direction
        const getDir = (curr, old) =>
          curr > old ? "up" : curr < old ? "down" : "neutral";

        current.BidDirection = getDir(current.Bid, prev.Bid);
        current.AskDirection = getDir(current.Ask, prev.Ask);
        current.Direction = current.BidDirection; // Primary direction based on Bid

        current.BidDifference = Number(current.Bid - prev.Bid);
        current.AskDifference = Number(current.Ask - prev.Ask);
        current.Difference = Number(current.Ask - prev.Ask);

        current.BidDifferencePercentage =
          prev.Bid !== 0
            ? Number(((current.BidDifference / prev.Bid) * 100).toFixed(2))
            : 0;
        current.AskDifferencePercentage =
          prev.Ask !== 0
            ? Number(((current.AskDifference / prev.Ask) * 100).toFixed(2))
            : 0;
      }

      return current;
    });

    // 2. CRITICAL FIX: Update the global state AFTER the loop finishes
    // Convert array to map for lightning-fast lookup next time
    prevPricesMap = prices.reduce((acc, p) => {
      acc[p.symbol] = p;
      return acc;
    }, {});

    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error.message);
    throw error;
  }
};

module.exports = getPrices;
