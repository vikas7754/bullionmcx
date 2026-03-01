const axios = require("axios");

const getPrices = async () => {
  try {
    const url = "https://liveapi.uk/com/demo170226/";

    const { data } = await axios.get(url);

    // Reformat the API response
    data?.forEach((price, index) => {
      if (price?.symb.toLowerCase() === "gold" && index > 0) {
        price.symb = "goldm";
      }
      if (price?.symb.toLowerCase() === "silver" && index > 1) {
        price.symb = "silverm";
      }
    });

    const prices = data?.map((price) => {
      let symbol = price.symb;
      let name = price.symb;

      switch (price?.symb?.toLowerCase()) {
        case "gold":
          symbol = "gold";
          name = "Gold (MCX)";
          break;
        case "silver":
          symbol = "silver";
          name = "Silver (MCX)";
          break;
        case "goldm":
          symbol = "goldnext";
          name = "Gold (MCX) Next Month";
          break;
        case "silverm":
          symbol = "silvernext";
          name = "Silver (MCX) Next Month";
          break;
        case "spotgold":
          symbol = "XAUUSD";
          name = "Gold (USD)";
          break;
        case "spotsilver":
          symbol = "XAGUSD";
          name = "Silver (USD)";
          break;
        case "usdinr":
          symbol = "INRSpot";
          name = "INR Spot";
          break;
        default:
          break;
      }

      const formattedPrice = {
        symbol,
        Name: name,
        Bid: Number.parseFloat(price.buy || 0),
        Ask: Number.parseFloat(price.sell || 0),
        High: Number.parseFloat(price.high || 0),
        Low: Number.parseFloat(price.low || 0),
        Open: Number.parseFloat(price.open || 0),
        Close: Number.parseFloat(price.close || 0),
        LTP: Number.parseFloat(price.rate || 0),
        Difference: Number.parseFloat(price.chg || 0),
        DifferencePercentage: price.chgper,
        Time: new Date().toLocaleTimeString(),
        expiry: price.expiry,
      };
      return formattedPrice;
    });

    // console.log("Formatted prices:", prices);
    return prices;
  } catch (error) {
    console.error("Error fetching prices from API:", error?.message);
    throw error;
  }
};

module.exports = getPrices;
