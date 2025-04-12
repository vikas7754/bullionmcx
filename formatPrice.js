const formatPrice = (data, symbol) => {
  //   if (!data) {
  //     throw new Error("Invalid data received");
  //   }
  //   console.log("Received data:", data);
  const formattedData = {
    symbol: symbol || data?.symbol || "default",
    Name: data?.name || data?.symbol + " Price" || "Unknown",
    Bid: parseFloat(data?.lastPrice || 0),
    Ask: parseFloat(data?.avgPrice || 0),
    High: parseFloat(data?.highPrice || 0),
    Low: parseFloat(data?.lowPrice || 0),
    Open: parseFloat(data?.openPrice || 0),
    Close: parseFloat(data?.prevClose || 0),
    LTP: parseFloat(data?.lastPrice || 0),
    Difference: parseFloat(data?.change || 0),
    Time: data?.lastupdTime || new Date().toLocaleTimeString(),
  };

  return formattedData;
};

module.exports = formatPrice;
