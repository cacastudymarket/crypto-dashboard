
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false';

const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

let allCoins = [];
let chartInstance = null;
let currentCurrency = 'USD';
const USD_TO_IDR = 16500;

function setCurrency(currency) {
  currentCurrency = currency;
  document.getElementById('btnUSD').classList.toggle('active', currency === 'USD');
  document.getElementById('btnIDR').classList.toggle('active', currency === 'IDR');
  renderCards(allCoins);
}

function formatPrice(usdPrice) {
  if (currentCurrency === 'IDR') {
    const idr = usdPrice * USD_TO_IDR;
    return `Rp ${idr.toLocaleString('id-ID')}`;
  }
  return `$${usdPrice.toLocaleString()}`;
}

async function fetchCryptoData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    allCoins = data;
    renderCards(allCoins);
  } catch (error) {
    cardsContainer.innerHTML = '<p class="loading">Failed to load data. Please try again.</p>';
  }
}

function renderCards(coins) {
  if (coins.length === 0) {
    cardsContainer.innerHTML = '<p class="loading">No results found.</p>';
    return;
  }

  cardsContainer.innerHTML = coins.map(coin => {
    const change = coin.price_change_percentage_24h;
    const isPositive = change >= 0;

    return `
      <div class="card" onclick="openModal('${coin.id}')">
        <div class="card-header">
          <img src="${coin.image}" alt="${coin.name}" />
          <div>
            <h2>${coin.name}</h2>
            <span>${coin.symbol}</span>
          </div>
        </div>
        <div class="price">${formatPrice(coin.current_price)}</div>
        <div class="change ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
        </div>
        <div class="meta">
          Market Cap: $${(coin.market_cap / 1e9).toFixed(2)}B<br/>
          Volume 24h: $${(coin.total_volume / 1e6).toFixed(2)}M<br/>
          Rank: #${coin.market_cap_rank}
        </div>
      </div>
    `;
  }).join('');
}

async function openModal(coinId) {
  modalOverlay.classList.add('active');

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`);
    const coin = await res.json();

    document.getElementById('modalImg').src = coin.image.large;
    document.getElementById('modalName').textContent = coin.name;
    document.getElementById('modalSymbol').textContent = coin.symbol.toUpperCase();
    document.getElementById('modalPrice').textContent = `$${coin.market_data.current_price.usd.toLocaleString()}`;

    const change = coin.market_data.price_change_percentage_24h;
    const changeEl = document.getElementById('modalChange');
    changeEl.textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
    changeEl.style.color = change >= 0 ? '#3fb950' : '#f85149';

    document.getElementById('modalMarketCap').textContent = `$${(coin.market_data.market_cap.usd / 1e9).toFixed(2)}B`;
    document.getElementById('modalVolume').textContent = `$${(coin.market_data.total_volume.usd / 1e6).toFixed(2)}M`;
    document.getElementById('modalATH').textContent = `$${coin.market_data.ath.usd.toLocaleString()}`;
    document.getElementById('modalSupply').textContent = `${(coin.market_data.circulating_supply / 1e6).toFixed(2)}M`;

    // Chart
    const chartRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`);
    const chartData = await chartRes.json();
    const prices = chartData.prices.map(p => p[1]);
    const labels = chartData.prices.map(p => {
      const d = new Date(p[0]);
      return `${d.getMonth()+1}/${d.getDate()}`;
    });

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('modalChart').getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '7-Day Price (USD)',
          data: prices,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8b949e', maxTicksLimit: 7 }, grid: { color: '#21262d' } },
          y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } }
        }
      }
    });

  } catch (err) {
    console.error(err);
  }
}

modalClose.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  if (chartInstance) chartInstance.destroy();
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    if (chartInstance) chartInstance.destroy();
  }
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allCoins.filter(coin =>
    coin.name.toLowerCase().includes(query) ||
    coin.symbol.toLowerCase().includes(query)
  );
  renderCards(filtered);
});

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/');
    const data = await res.json();
    const value = data.data[0].value;
    const text = data.data[0].value_classification;

    const fngValue = document.getElementById('fngValue');
    const fngText = document.getElementById('fngText');
    const fngBox = document.getElementById('fngBox');

    fngValue.textContent = value;
    fngText.textContent = text;

    if (value <= 25) {
      fngValue.style.color = '#f85149';
      fngText.style.color = '#f85149';
    } else if (value <= 45) {
      fngValue.style.color = '#e3b341';
      fngText.style.color = '#e3b341';
    } else if (value <= 55) {
      fngValue.style.color = '#8b949e';
      fngText.style.color = '#8b949e';
    } else if (value <= 75) {
      fngValue.style.color = '#3fb950';
      fngText.style.color = '#3fb950';
    } else {
      fngValue.style.color = '#58a6ff';
      fngText.style.color = '#58a6ff';
    }

  } catch (err) {
    document.getElementById('fngText').textContent = 'Unavailable';
  }
}

fetchFearGreed();
fetchCryptoData();