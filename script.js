const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false';

const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');

let allCoins = [];

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
      <div class="card">
        <div class="card-header">
          <img src="${coin.image}" alt="${coin.name}" />
          <div>
            <h2>${coin.name}</h2>
            <span>${coin.symbol}</span>
          </div>
        </div>
        <div class="price">$${coin.current_price.toLocaleString()}</div>
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

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allCoins.filter(coin =>
    coin.name.toLowerCase().includes(query) ||
    coin.symbol.toLowerCase().includes(query)
  );
  renderCards(filtered);
});

fetchCryptoData();