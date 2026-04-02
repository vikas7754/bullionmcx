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
        Rate: Number(item.rate) || 0,
        Time: currentTime,
        expiry: item.expiry,
        Direction: "neutral",
        BidDirection: "neutral",
        AskDirection: "neutral",
        Difference: Number(item.chg || 0),
        BidDifference: 0,
        AskDifference: 0,
        RateDifference: 0,
        BidDifferencePercentage: 0,
        AskDifferencePercentage: 0,
        RateDifferencePercentage: 0,
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
        current.RateDifference = Number(current.Rate - prev.Rate);

        current.BidDifferencePercentage =
          prev.Bid !== 0
            ? Number(((current.BidDifference / prev.Bid) * 100).toFixed(2))
            : 0;
        current.AskDifferencePercentage =
          prev.Ask !== 0
            ? Number(((current.AskDifference / prev.Ask) * 100).toFixed(2))
            : 0;
        current.RateDifferencePercentage =
          prev.Rate !== 0
            ? Number(((current.RateDifference / prev.Rate) * 100).toFixed(2))
            : 0;
      }

      return current;
    });

    // Start
    prices.forEach((p) => {
      if (p.symbol === "gold") {
        const baseSymbol = p.symbol === "gold" ? "goldnext" : "silvernext";
        const basePrice = prices.find((bp) => bp.symbol === baseSymbol);
        if (basePrice) {
          p.Bid = basePrice.Bid;
          p.Ask = basePrice.Ask;
          p.High = basePrice.High;
          p.Low = basePrice.Low;
          p.LTP = basePrice.LTP;
          p.Rate = basePrice.Rate;
          p.Direction = basePrice.Direction;
          p.BidDirection = basePrice.BidDirection;
          p.AskDirection = basePrice.AskDirection;
          p.Difference = basePrice.Difference;
          p.RateDifference = basePrice.RateDifference;
          p.BidDifference = basePrice.BidDifference;
          p.AskDifference = basePrice.AskDifference;
          p.BidDifferencePercentage = basePrice.BidDifferencePercentage;
          p.AskDifferencePercentage = basePrice.AskDifferencePercentage;
          p.RateDifferencePercentage = basePrice.RateDifferencePercentage;
        }
      }
    });
    // End

    // For symbol INRSpot, update Ask price with Rate value
    prices.forEach((p) => {
      if (p.symbol === "INRSpot") {
        p.Ask = p.Rate;
        p.AskDirection = p?.RateDirection;
        p.AskDifference = Number(p.Ask - (prevPricesMap[p.symbol]?.Ask || 0));
        p.AskDifferencePercentage =
          (prevPricesMap[p.symbol]?.Ask || 0) !== 0
            ? Number(
                (
                  (p.AskDifference / (prevPricesMap[p.symbol]?.Ask || 1)) *
                  100
                ).toFixed(2),
              )
            : 0;
      }
    });

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
