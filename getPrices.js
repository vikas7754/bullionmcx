const axios = require("axios");
const formatPrice = require("./formatPrice");

const getPrices = async () => {
  try {
    // const expiry_date = new Date().toISOString().split("T")[0];

    const GOLD_MCX = `https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry=2025-06-05`;
    const SILVER_MCX = `https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/SILVER?expiry=2025-05-05`;
    const GOLD_NEXT =
      "https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry=2025-06-05";
    const SILVER_NEXT =
      "https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/SILVER?expiry=2025-05-05";
    const GOLD_USD = "";
    const SILVER_USD = "";
    const INR_SPOT = "";

    const promises = [
      axios.get(GOLD_MCX),
      axios.get(SILVER_MCX),
      axios.get(GOLD_NEXT),
      axios.get(SILVER_NEXT),
    ];
    const [
      { data: goldData },
      { data: silverData },
      { data: goldNextData },
      { data: silverNextData },
      //   { data: goldUSDData },
      //   { data: silverUSDData },
      //   { data: inrSpotData },
    ] = await Promise.all(promises);
    if (
      !goldData?.data ||
      !silverData?.data ||
      !goldNextData?.data ||
      !silverNextData?.data
    ) {
      throw new Error("Invalid data received from API");
    }

    const goldPrice = formatPrice(goldData.data, "gold");
    const silverPrice = formatPrice(silverData.data, "silver");
    const goldNextPrice = formatPrice(goldNextData.data, "goldnext");
    const silverNextPrice = formatPrice(silverNextData.data, "silvernext");
    const goldUSDPrice = formatPrice({}, "XAUUSD");
    const silverUSDPrice = formatPrice({}, "XAGUSD");
    const inrSpotPrice = formatPrice({}, "INRSPOT");

    return [
      goldPrice,
      silverPrice,
      goldNextPrice,
      silverNextPrice,
      goldUSDPrice,
      silverUSDPrice,
      inrSpotPrice,
    ];
  } catch (error) {
    console.error("Error fetching prices:", error);
    throw error;
  }
};

module.exports = getPrices;
