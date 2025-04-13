const formatPrice = (data, symbol) => {
  let bid = 0;
  let ask = 0;
  if (parseInt(data?.askPrice)) {
    ask = parseFloat(data?.askPrice);
  } else {
    if (symbol === "gold" || symbol === "silver") {
      ask = parseFloat(data?.lastPrice || 0);
    } else {
      ask = parseFloat(data?.lastPrice || 0) + parseFloat(data?.change || 0);
    }
  }

  if (parseInt(data?.bidPrice)) {
    bid = parseFloat(data?.bidPrice);
  } else {
    bid = parseFloat(data?.lastPrice || 0);
    // if (symbol === "gold" || symbol === "silver") {
    // } else {
    //   bid = parseFloat(data?.lastPrice || 0) - parseFloat(data?.change || 0);
    // }
  }

  const formattedData = {
    symbol: symbol || data?.symbol || "default",
    Name: data?.name || data?.symbol + " Price" || "Unknown",
    Bid: bid,
    Ask: ask,
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

const formatPrice1 = (data, symbol) => {};

module.exports = formatPrice;
