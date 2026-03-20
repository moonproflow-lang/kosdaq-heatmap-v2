export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  try {
    // 네이버 증권 모바일 API - 코스닥 시가총액 순위
    const results = [];
    
    for (let page = 1; page <= 4; page++) {
      const url = `https://m.stock.naver.com/api/stocks/marketValue/KOSDAQ?page=${page}&pageSize=25`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json',
          'Referer': 'https://m.stock.naver.com/',
        },
      });
      if (!r.ok) throw new Error(`네이버 모바일 API ${r.status}`);
      const j = await r.json();
      
      // 응답 구조 파악
      const stocks = j?.stocks || j?.result?.stocks || j?.data || [];
      if (!stocks.length) throw new Error('응답 구조: ' + JSON.stringify(j).slice(0,200));
      
      for (const s of stocks) {
        results.push({
          code: s.itemCode || s.code || s.stockCode,
          name: s.stockName || s.name || s.itemName,
          marketCap: Number(s.marketValue || s.marketCap || s.marketvalue || 0),
        });
      }
    }

    if (!results.length) throw new Error('파싱 결과 없음');

    const list = results
      .filter(d => d.code && d.marketCap > 0)
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 100)
      .map((d, i) => ({
        rank: i + 1,
        code: d.code,
        name: d.name,
        marketCap: d.marketCap,
        capStr: formatCap(d.marketCap),
      }));

    return res.status(200).json({ list, date: new Date().toISOString().slice(0,10), source: 'naver-mobile' });

  } catch (e) {
    return res.status(200).json({ list: getFallback(), date: 'fallback', warning: e.message });
  }
}

function formatCap(v) {
  if (!v) return '–';
  const 조 = Math.floor(v / 1e12);
  const 억 = Math.round((v % 1e12) / 1e8);
  if (조 > 0) return 억 > 0 ? `${조}조 ${억.toLocaleString()}억` : `${조}조`;
  return `${Math.round(v / 1e8).toLocaleString()}억`;
}

function getFallback() {
  const TOP = [
    {code:'000250',name:'삼천당제약',cap:21600},
    {code:'196170',name:'알테오젠',cap:18800},
    {code:'277810',name:'레인보우로보틱스',cap:16200},
    {code:'259960',name:'크래프톤',cap:13700},
    {code:'323410',name:'카카오뱅크',cap:10500},
    {code:'247540',name:'에코프로비엠',cap:9200},
    {code:'086520',name:'에코프로',cap:8100},
    {code:'028300',name:'HLB',cap:7400},
    {code:'352820',name:'하이브',cap:6800},
    {code:'036570',name:'엔씨소프트',cap:6300},
    {code:'091990',name:'셀트리온헬스케어',cap:5400},
    {code:'141080',name:'리가켐바이오',cap:4200},
    {code:'000100',name:'유한양행',cap:4100},
    {code:'377300',name:'카카오페이',cap:3200},
    {code:'068760',name:'셀트리온제약',cap:2900},
    {code:'403870',name:'HPSP',cap:2700},
    {code:'214150',name:'클래시스',cap:2500},
    {code:'022100',name:'포스코DX',cap:2300},
    {code:'041510',name:'SM',cap:2100},
    {code:'000990',name:'DB하이텍',cap:1900},
    {code:'145020',name:'휴젤',cap:1800},
    {code:'066970',name:'엘앤에프',cap:1800},
    {code:'278470',name:'에이피알',cap:1700},
    {code:'263750',name:'펄어비스',cap:1600},
    {code:'035900',name:'JYP Ent.',cap:1600},
    {code:'328130',name:'루닛',cap:1500},
    {code:'035760',name:'CJ ENM',cap:1400},
    {code:'293490',name:'카카오게임즈',cap:1400},
    {code:'278280',name:'천보',cap:1300},
    {code:'058470',name:'리노공업',cap:1300},
    {code:'357780',name:'솔브레인',cap:1200},
    {code:'122870',name:'와이지엔터',cap:1000},
    {code:'253450',name:'스튜디오드래곤',cap:1000},
    {code:'257540',name:'실리콘투',cap:900},
    {code:'214450',name:'파마리서치',cap:900},
    {code:'140860',name:'파크시스템스',cap:900},
    {code:'039030',name:'이오테크닉스',cap:800},
    {code:'095340',name:'ISC',cap:800},
    {code:'085310',name:'넥스틴',cap:800},
    {code:'086900',name:'메디톡스',cap:750},
    {code:'241710',name:'코스메카코리아',cap:720},
    {code:'240810',name:'원익IPS',cap:700},
    {code:'098460',name:'고영',cap:680},
    {code:'420940',name:'기가비스',cap:650},
    {code:'178320',name:'서진시스템',cap:630},
    {code:'089970',name:'테크윙',cap:600},
    {code:'192080',name:'더블유게임즈',cap:580},
    {code:'008930',name:'한미사이언스',cap:570},
    {code:'222800',name:'심텍',cap:550},
    {code:'007660',name:'이수페타시스',cap:540},
    {code:'112040',name:'위메이드',cap:520},
    {code:'078340',name:'컴투스',cap:500},
    {code:'096530',name:'씨젠',cap:450},
    {code:'067630',name:'HLB생명과학',cap:430},
    {code:'032500',name:'케이엠더블유',cap:410},
    {code:'170900',name:'동아에스티',cap:400},
    {code:'095660',name:'네오위즈',cap:380},
    {code:'005290',name:'동진쎄미켐',cap:360},
    {code:'319660',name:'피에스케이',cap:340},
    {code:'445680',name:'큐로셀',cap:330},
    {code:'338220',name:'뷰노',cap:320},
    {code:'090460',name:'비에이치',cap:310},
    {code:'067310',name:'하나마이크론',cap:300},
    {code:'033240',name:'자화전자',cap:290},
    {code:'218410',name:'RFHIC',cap:270},
    {code:'083450',name:'GST',cap:250},
    {code:'041960',name:'코미팜',cap:240},
    {code:'299660',name:'셀리드',cap:230},
    {code:'222080',name:'씨아이에스',cap:220},
    {code:'378340',name:'필에너지',cap:210},
    {code:'053980',name:'오상헬스케어',cap:200},
    {code:'150900',name:'파수',cap:190},
    {code:'259630',name:'엠플러스',cap:180},
    {code:'322510',name:'제이엘케이',cap:170},
    {code:'079370',name:'제우스',cap:160},
    {code:'064290',name:'인텍플러스',cap:150},
    {code:'097800',name:'윈팩',cap:140},
    {code:'252990',name:'샘씨엔에스',cap:130},
    {code:'330860',name:'네패스아크',cap:120},
  ];
  return TOP.map((d,i) => ({
    rank: i+1, code: d.code, name: d.name,
    marketCap: d.cap * 1e8, capStr: formatCap(d.cap * 1e8),
  }));
} 
