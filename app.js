const AVAILABLE_CURRENCIES = ['MXN', 'USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF'];
const contenido = document.getElementById("contenido");

const createExchangeForm = (currencies) => {
    const fromOptions = currencies.map(currency => 
        `<option value="${currency}" ${currency === 'MXN' ? 'selected' : ''}>${currency}</option>`
    ).join('');
    
    const toOptions = currencies.map(currency => 
        `<option value="${currency}" ${currency === 'USD' ? 'selected' : ''}>${currency}</option>`
    ).join('');

    return `
        <div class="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-t-4 border-accent transition-all duration-300">
            <h2 class="text-2xl font-bold text-primary mb-6">Conversor de Divisas</h2>
            
            <form id="exchangeForm" class="space-y-6">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="currencyFrom" class="block text-sm font-medium text-gray-700 mb-1">Moneda de origen</label>
                        <select id="currencyFrom" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent shadow-sm bg-gray-50">
                            ${fromOptions}
                        </select>
                    </div>

                    <div>
                        <label for="currencyTo" class="block text-sm font-medium text-gray-700 mb-1">Moneda de destino</label>
                        <select id="currencyTo" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent shadow-sm bg-gray-50">
                            ${toOptions}
                        </select>
                    </div>
                </div>

                <p id="errorMsg" class="text-sm text-red-600 font-medium hidden">Error: las monedas de origen y destino no pueden ser las mismas.</p>

                <div>
                    <label for="amountUSD" class="block text-sm font-medium text-gray-700 mb-1">Cantidad a convertir</label>
                    <input type="text" id="amountUSD" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent shadow-sm" placeholder="Ej: 1000.50">
                </div>

                <button type="submit" id="convertBtn" class="w-full bg-accent hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md disabled:opacity-50" disabled>
                    Convertir
                </button>
            </form>

            <div id="resultArea" class="mt-6 p-4 bg-secondary/50 rounded-lg border border-accent/30 hidden">
            </div>
        </div>
    `;
};

const checkCurrencySelection = () => {
    const btn = document.getElementById('convertBtn');
    const errorMsg = document.getElementById('errorMsg');
    
    if (!btn || !errorMsg) return;

    const from = document.getElementById('currencyFrom').value;
    const to = document.getElementById('currencyTo').value;

    if (from === to) {
        btn.disabled = true;
        errorMsg.classList.remove('hidden');
    } else {
        btn.disabled = false;
        errorMsg.classList.add('hidden');
    }
};

const handleFormSubmit = async (event) => {
    event.preventDefault();
    const resultArea = document.getElementById('resultArea');
    const convertBtn = document.getElementById('convertBtn');

    const fromCurrency = document.getElementById('currencyFrom').value;
    const toCurrency = document.getElementById('currencyTo').value;
    
    const amountInput = document.getElementById('amountUSD').value;
    const amount = parseFloat(amountInput.replace(',', '.'));

    if (isNaN(amount) || amount <= 0) {
        resultArea.innerHTML = '<p class="text-red-500 font-medium">Por favor, introduce una cantidad válida.</p>';
        resultArea.classList.remove('hidden');
        return;
    }

    resultArea.classList.remove('hidden');
    resultArea.innerHTML = `
        <div class="flex items-center space-x-2 text-primary font-medium">
            <svg class="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Obteniendo tasa ${fromCurrency} → ${toCurrency}...</span>
        </div>
    `;
    convertBtn.disabled = true;

    const API_KEY = '6fc3e20401-d29ffba151-t6ce81'; 
    const apiUrl = `https://api.fastforex.io/fetch-one?from=${fromCurrency}&to=${toCurrency}`;
    
    try {
        const res = await fetch(apiUrl, {
            headers: { 'X-API-Key': API_KEY }
        });
        
        if (!res.ok) throw new Error(`Respuesta de la red: ${res.status}`);
        
        const data = await res.json();
        const rate = data && data.result && data.result[toCurrency];
        
        if (!rate) throw new Error('Formato de respuesta de la API inesperado o tasa no disponible.');

        const convertedAmount = amount * rate;
        
        const formatNumber = (num, currency) => {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            }).format(num);
        };

        resultArea.innerHTML = `
            <div class="space-y-3">
                <p class="text-lg font-medium text-primary">Tasa de cambio actual:</p>
                <p class="text-xl font-bold text-gray-800">1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}</p>
                
                <hr class="border-gray-300">

                <p class="text-lg font-medium text-primary">Resultado de la conversión:</p>
                <p class="text-2xl font-extrabold text-accent">
                    ${formatNumber(amount, fromCurrency)} = ${formatNumber(convertedAmount, toCurrency)}
                </p>
            </div>
        `;

    } catch (err) {
        console.error("Error en la conversión:", err);
        resultArea.innerHTML = `<p class="text-red-500 font-medium">Error al obtener el tipo de cambio. ${err.message}</p>`;
    } finally {
        convertBtn.disabled = false;
    }
};

const renderRates = async () => {
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-t-4 border-accent">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-primary">Tasas de Cambio</h2>
                <div class="flex items-center space-x-3">
                    <label for="baseSelect" class="text-sm text-gray-600">Base:</label>
                    <select id="baseSelect" class="p-2 border rounded bg-gray-50">
                        ${AVAILABLE_CURRENCIES.map(c => `<option value="${c}" ${c === 'MXN' ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <button id="refreshRates" class="ml-2 bg-accent text-white px-3 py-2 rounded">Actualizar</button>
                </div>
            </div>

            <div id="ratesContainer" class="text-gray-700">
                <div class="flex items-center justify-center space-x-3 text-lg font-medium text-gray-600">
                    <svg class="animate-spin h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cargando...</span>
                </div>
            </div>

        </div>
    `;

    const API_KEY = '6fc3e20401-d29ffba151-t6ce81';
    const baseSelect = document.getElementById('baseSelect');
    const refreshBtn = document.getElementById('refreshRates');
    const ratesContainer = document.getElementById('ratesContainer');

    const fetchAndRender = async (base) => {
        if (!ratesContainer) return;
        ratesContainer.innerHTML = `
            <div class="flex items-center justify-center space-x-3 text-lg font-medium text-gray-600">
                <svg class="animate-spin h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Obteniendo tasas (base: ${base})...</span>
            </div>
        `;

        const targets = AVAILABLE_CURRENCIES.filter(c => c !== base);
        try {
            const requests = targets.map(to =>
                fetch(`https://api.fastforex.io/fetch-one?from=${base}&to=${to}&api_key=${API_KEY}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(json => {
                    const rate = json && json.result && json.result[to];
                    return { to, rate: typeof rate === 'number' ? rate : null };
                })
                .catch(() => ({ to, rate: null }))
            );

            const results = await Promise.all(requests);

            const rowsHtml = results.map(r => {
                if (r.rate === null) {
                    return `<li class="flex justify-between py-2"><span>${r.to}</span><span class="text-red-500">n/d</span></li>`;
                }
                return `<li class="flex justify-between py-2"><span>${r.to}</span><span class="font-semibold">${r.rate.toFixed(6)}</span></li>`;
            }).join('');

            ratesContainer.innerHTML = `
                <div class="bg-white rounded-lg border border-gray-100 p-4">
                    <ul class="list-none divide-y divide-gray-100 text-gray-700">
                        ${rowsHtml}
                    </ul>
                </div>
            `;
        } catch (err) {
            ratesContainer.innerHTML = `<p class="text-red-500">No se pudieron obtener las tasas. Revisa la consola.</p>`;
            console.error('Error al cargar tasas:', err);
        }
    };

    if (baseSelect) {
        baseSelect.addEventListener('change', () => fetchAndRender(baseSelect.value));
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => fetchAndRender(baseSelect.value));
    }

    fetchAndRender(baseSelect ? baseSelect.value : 'MXN');
};


const renderHistorical = () => {
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-t-4 border-accent">
            <h2 class="text-2xl font-bold text-primary mb-4">Monedas Disponibles</h2>
            <div class="flex flex-col md:flex-row md:items-center md:space-x-3 mb-4">
                <input id="currSearch" type="search" placeholder="Buscar por código o nombre..." class="flex-1 p-2 border rounded bg-gray-50 mb-3 md:mb-0">
                <button id="refreshCurr" class="bg-accent text-white py-2 px-3 rounded-lg">Actualizar</button>
            </div>

            <div id="currStatus" class="text-gray-600 mb-3"></div>
            <div id="currList" class="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700"></div>
        </div>
    `;

    const API_KEY = '6fc3e20401-d29ffba151-t6ce81';
    const currList = document.getElementById('currList');
    const currStatus = document.getElementById('currStatus');
    const currSearch = document.getElementById('currSearch');
    const refreshBtn = document.getElementById('refreshCurr');

    let currenciesCache = {};

    const renderItems = (itemsObj, filter = '') => {
        const q = filter.trim().toLowerCase();
        const entries = Object.entries(itemsObj || {});
        const filtered = q ? entries.filter(([code, name]) => code.toLowerCase().includes(q) || (name && name.toLowerCase().includes(q))) : entries;
        if (filtered.length === 0) {
            currList.innerHTML = `<p class="text-sm text-gray-500">No se encontraron resultados.</p>`;
            return;
        }
        currList.innerHTML = filtered.map(([code, name]) => `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                <div>
                    <p class="font-semibold text-primary">${code}</p>
                    <p class="text-sm text-gray-600">${name || '—'}</p>
                </div>
            </div>
        `).join('');
    };

    const fetchCurrencies = async () => {
        currStatus.innerHTML = `<p class="text-sm text-gray-600">Obteniendo monedas...</p>`;
        currList.innerHTML = '';
        try {
            const res = await fetch('https://api.fastforex.io/currencies', {
                headers: { 'X-API-Key': API_KEY }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const payload = json.currencies || json.results || json.data || json;
            const currencies = (payload && (payload.currencies || payload.results || payload)) || {};
            const final = typeof currencies === 'object' && !Array.isArray(currencies) ? currencies : {};
            currenciesCache = final;
            currStatus.innerHTML = `<p class="text-sm text-gray-500">Total: <strong>${Object.keys(final).length}</strong> monedas</p>`;
            renderItems(final, currSearch.value || '');
        } catch (err) {
            console.error('Error al cargar monedas:', err);
            currStatus.innerHTML = `<p class="text-red-500">No se pudieron cargar las monedas. Reintenta.</p>`;
            currList.innerHTML = `<p class="text-sm text-gray-500">Error al obtener datos.</p>`;
        }
    };

    currSearch.addEventListener('input', () => renderItems(currenciesCache, currSearch.value));
    refreshBtn.addEventListener('click', fetchCurrencies);

    fetchCurrencies();
};


const switchView = (viewId) => {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('text-accent', 'border-b-2', 'border-accent', 'font-semibold');
        link.classList.add('text-white', 'font-medium');

        if (link.id === `nav-${viewId}`) {
            link.classList.remove('text-white', 'font-medium');
            link.classList.add('text-accent', 'border-b-2', 'border-accent', 'font-semibold');
        }
    });

    switch (viewId) {
        case 'converter':
            renderConverter();
            break;
        case 'rates':
            renderRates();
            break;
        case 'historical':
            renderHistorical();
            break;
        default:
            renderConverter();
    }
};

const renderConverter = () => {
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-t-4 border-accent transition-all duration-300">
            <h2 class="text-2xl font-bold text-primary mb-6">Conversor de Divisas</h2>
            <div class="flex items-center justify-center space-x-3 text-lg font-medium text-gray-600">
                <svg class="animate-spin h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cargando...</span>
            </div>
        </div>
    `;

    setTimeout(() => {
        contenido.innerHTML = createExchangeForm(AVAILABLE_CURRENCIES);
        
        const form = document.getElementById('exchangeForm');
        const fromSelect = document.getElementById('currencyFrom');
        const toSelect = document.getElementById('currencyTo');

        if (form && fromSelect && toSelect) {
            form.addEventListener('submit', handleFormSubmit);
            fromSelect.addEventListener('change', checkCurrencySelection);
            toSelect.addEventListener('change', checkCurrencySelection);
            checkCurrencySelection();
        } else {
            console.error('ERROR CRÍTICO: Elementos del formulario no encontrados para adjuntar listeners.');
        }

    }, 300);
};

const initApp = () => {
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navLinks.length === 0) {
        console.warn('ERROR CRÍTICO: No se encontraron los enlaces de navegación. Revisar index.html.');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.id.split('-')[1]; 
            switchView(viewId);
        });
    });

    switchView('converter'); 
};

document.addEventListener("DOMContentLoaded", initApp);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registrado:', reg.scope);
    } catch (err) {
      console.warn('Registro SW falló:', err);
    }
  });
}