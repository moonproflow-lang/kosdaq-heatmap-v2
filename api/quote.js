
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };

  try {
    const [chartRes, summaryRes] = await Promise.allSettled([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { headers }),
      fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price`, { headers }),
    ]);

    let price, prev, chg, open, high, low, volume;
    if (chartRes.status === 'fulfilled' && chartRes.value.ok) {
      const cd = await chartRes.value.json();
      const meta = cd?.chart?.result?.[0]?.meta;
      if (meta) {
        price  = meta.regularMarketPrice;
        prev   = meta.chartPreviousClose || meta.previousClose;
        chg    = prev ? ((price - prev) / prev) * 100 : 0;
        open   = meta.regularMarketOpen;
        high   = meta.regularMarketDayHigh;
        low    = meta.regularMarketDayLow;
        volume = meta.regularMarketVolume;
      }
    }

    if (!price) return res.status(500).json({ error: 'No price data' });

    let marketCap = null;
    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      const sd = await summaryRes.value.json();
      marketCap = sd?.quoteSummary?.result?.[0]?.price?.marketCap?.raw || null;
    }

    function formatCap(v) {
      if (!v) return '–';
      const t = v / 1e12;
      if (t >= 1) {
        const 조 = Math.floor(t);
        const r = Math.round((v - 조 * 1e12) / 1e8);
        return r > 0 ? `${조}조 ${r.toLocaleString()}억` : `${조}조`;
      }
      return `${Math.round(v / 1e8).toLocaleString()}억`;
    }

    return res.status(200).json({
      price, chg, ticker, prev, open, high, low, volume,
      marketCap, capStr: formatCap(marketCap),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
