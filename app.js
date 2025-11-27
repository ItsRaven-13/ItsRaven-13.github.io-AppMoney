const AVAILABLE_CURRENCIES = ['MXN', 'USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF'];
const contenido = document.getElementById("contenido");

// ================= NOTIFICACIONES PUSH =================

class PushNotificationManager {
    constructor() {
        this.isSubscribed = false;
        this.registration = null;
        this.subscription = null;
        // Clave pública VAPID de ejemplo - DEBES GENERAR LA TUYA PROPIA
        this.vapidPublicKey = 'BK_viDAtJ_hIn52jh0WlbqrmdvveJkqFNNmztoccOxWXs_Fu6XvkLF1QqVp_2RIGVLe2WU9rsjS9RhjolkqZ25s';
    }

    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications no son soportadas');
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.ready;
            this.subscription = await this.registration.pushManager.getSubscription();
            this.isSubscribed = !(this.subscription === null);

            console.log('Push Manager inicializado, suscrito:', this.isSubscribed);
            return true;
        } catch (error) {
            console.error('Error inicializando Push Manager:', error);
            return false;
        }
    }

    async subscribeUser() {
        if (!this.registration) {
            console.error('Service Worker no registrado');
            return null;
        }

        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            this.subscription = subscription;
            this.isSubscribed = true;

            console.log('Usuario suscrito:', subscription);

            // Enviar la suscripción al servidor (simulado)
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (error) {
            if (Notification.permission === 'denied') {
                console.warn('Permiso para notificaciones denegado');
            } else {
                console.error('Error suscribiendo usuario:', error);
            }
            return null;
        }
    }

    async unsubscribeUser() {
        if (!this.subscription) {
            return true;
        }

        try {
            await this.subscription.unsubscribe();
            this.isSubscribed = false;
            this.subscription = null;

            await this.removeSubscriptionFromServer();

            console.log('Usuario desuscrito');
            return true;
        } catch (error) {
            console.error('Error desuscribiendo usuario:', error);
            return false;
        }
    }

    async requestPermission() {
        if (Notification.permission === 'denied') {
            throw new Error('Los permisos fueron denegados previamente. Por favor, habilita las notificaciones en la configuración de tu navegador.');
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async sendTestNotification() {
        if (!this.registration) return;

        this.registration.showNotification('AppMoney - Prueba', {
            body: '¡Las notificaciones push están funcionando correctamente! 🎉',
            icon: '/ItsRaven-13.github.io-AppMoney/icons/icon-192x192.png',
            badge: '/ItsRaven-13.github.io-AppMoney/icons/icon-72x72.png',
            image: '/ItsRaven-13.github.io-AppMoney/icons/icon-512x512.png',
            actions: [
                { action: 'convert', title: '💱 Ir al conversor' },
                { action: 'rates', title: '📈 Ver tasas' },
                { action: 'close', title: '❌ Cerrar' }
            ],
            data: {
                url: '/ItsRaven-13.github.io-AppMoney/',
                timestamp: new Date().toISOString()
            },
            tag: 'test-notification',
            renotify: true,
            vibrate: [200, 100, 200]
        });
    }

    async sendConversionNotification(fromCurrency, toCurrency, amount, convertedAmount, rate) {
        if (!this.registration || !this.isSubscribed) return;

        this.registration.showNotification('✅ Conversión Completada', {
            body: `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`,
            icon: '/ItsRaven-13.github.io-AppMoney/icons/icon-192x192.png',
            badge: '/ItsRaven-13.github.io-AppMoney/icons/icon-72x72.png',
            data: {
                url: '/ItsRaven-13.github.io-AppMoney/#converter',
                conversion: { fromCurrency, toCurrency, amount, convertedAmount, rate }
            },
            tag: `conversion-${fromCurrency}-${toCurrency}`,
            timestamp: Date.now()
        });
    }

    // Utilidad para convertir la clave VAPID
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Métodos para comunicarse con el servidor (simulados)
    async sendSubscriptionToServer(subscription) {
        console.log('📱 Enviando suscripción al servidor:', subscription);

        // En una aplicación real, aquí enviarías la suscripción a tu backend
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));

        // Simular envío exitoso
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ Suscripción guardada localmente');
                resolve(true);
            }, 1000);
        });
    }

    async removeSubscriptionFromServer() {
        console.log('🗑️ Eliminando suscripción del servidor');
        localStorage.removeItem('pushSubscription');

        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ Suscripción eliminada localmente');
                resolve(true);
            }, 500);
        });
    }

    getNotificationStatus() {
        if (!('Notification' in window)) {
            return 'no-support';
        }

        if (Notification.permission === 'denied') {
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return this.isSubscribed ? 'subscribed' : 'not-subscribed';
        }

        return 'default';
    }
}

// Instancia global del manager de notificaciones
const pushManager = new PushNotificationManager();

// ================= FUNCIONES ORIGINALES DE LA APP =================

// Función para crear el spinner SVG (se usará en varias vistas)
const getSpinnerHtml = (sizeClass = 'h-5 w-5', textColor = 'text-accent-color') => {
    return `
        <svg class="app-spinner ${sizeClass} ${textColor}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    `;
};

const createExchangeForm = (currencies) => {
    const fromOptions = currencies.map(currency =>
        `<option value="${currency}" ${currency === 'MXN' ? 'selected' : ''}>${currency}</option>`
    ).join('');

    const toOptions = currencies.map(currency =>
        `<option value="${currency}" ${currency === 'USD' ? 'selected' : ''}>${currency}</option>`
    ).join('');

    return `
        <div class="app-card app-shadow-2xl border-top-accent transition-all duration-300">
            <h2 class="app-h2 text-primary-color mb-6">Conversor de Divisas</h2>
            
            <form id="exchangeForm" class="app-space-y-6">
                
                <div class="app-grid-2-cols app-gap-4">
                    <div>
                        <label for="currencyFrom" class="app-label mb-1">Moneda de origen</label>
                        <select id="currencyFrom" class="app-input-select app-focus-accent">
                            ${fromOptions}
                        </select>
                    </div>

                    <div>
                        <label for="currencyTo" class="app-label mb-1">Moneda de destino</label>
                        <select id="currencyTo" class="app-input-select app-focus-accent">
                            ${toOptions}
                        </select>
                    </div>
                </div>

                <p id="errorMsg" class="app-text-error hidden">Error: las monedas de origen y destino no pueden ser las mismas.</p>

                <div>
                    <label for="amountUSD" class="app-label mb-1">Cantidad a convertir</label>
                    <input type="text" id="amountUSD" class="app-input-text app-focus-accent" placeholder="Ej: 1000.50">
                </div>

                <button type="submit" id="convertBtn" class="app-button-accent" disabled>
                    Convertir
                </button>
            </form>

            <div id="resultArea" class="mt-6 app-result-area hidden">
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
        resultArea.innerHTML = '<p class="text-error-color font-medium">Por favor, introduce una cantidad válida.</p>';
        resultArea.classList.remove('hidden');
        return;
    }

    resultArea.classList.remove('hidden');
    resultArea.innerHTML = `
        <div class="flex items-center space-x-2 text-primary-color font-medium">
            ${getSpinnerHtml()}
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
                <p class="text-lg font-medium text-primary-color">Tasa de cambio actual:</p>
                <p class="text-xl font-bold text-gray-800">1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}</p>
                
                <hr class="border-gray-300">

                <p class="text-lg font-medium text-primary-color">Resultado de la conversión:</p>
                <p class="app-result-text text-accent-color">
                    ${formatNumber(amount, fromCurrency)} = ${formatNumber(convertedAmount, toCurrency)}
                </p>
            </div>
        `;

        // Enviar notificación push si está habilitado
        if (pushManager.isSubscribed) {
            await pushManager.sendConversionNotification(fromCurrency, toCurrency, amount, convertedAmount, rate);
        }

    } catch (err) {
        console.error("Error en la conversión:", err);
        resultArea.innerHTML = `<p class="text-error-color font-medium">Error al obtener el tipo de cambio. ${err.message}</p>`;
    } finally {
        convertBtn.disabled = false;
    }
};

const renderRates = async () => {
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="app-card app-shadow-2xl border-top-accent">
            <div class="flex items-center justify-between mb-4">
                <h2 class="app-h2 text-primary-color">Tasas de Cambio</h2>
                <div class="flex items-center space-x-3">
                    <label for="baseSelect" class="text-sm text-gray-600">Base:</label>
                    <select id="baseSelect" class="app-input-select-sm">
                        ${AVAILABLE_CURRENCIES.map(c => `<option value="${c}" ${c === 'MXN' ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <button id="refreshRates" class="ml-2 app-button-sm">Actualizar</button>
                </div>
            </div>

            <div id="ratesContainer" class="text-gray-700">
                <div class="app-loading-state text-lg font-medium text-gray-600">
                    ${getSpinnerHtml('h-6 w-6', 'text-accent-color')}
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
            <div class="app-loading-state text-lg font-medium text-gray-600">
                ${getSpinnerHtml('h-6 w-6', 'text-accent-color')}
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
                    return `<li class="app-rate-row"><span>${r.to}</span><span class="text-red-500">n/d</span></li>`;
                }
                return `<li class="app-rate-row"><span>${r.to}</span><span class="font-semibold">${r.rate.toFixed(6)}</span></li>`;
            }).join('');

            ratesContainer.innerHTML = `
                <div class="app-rates-box">
                    <ul class="app-list-divider">
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
        <div class="app-card app-shadow-2xl border-top-accent">
            <h2 class="app-h2 text-primary-color mb-4">Monedas Disponibles</h2>
            <div class="app-flex-search mb-4">
                <input id="currSearch" type="search" placeholder="Buscar por código o nombre..." class="app-input-search mb-3 md:mb-0">
                <button id="refreshCurr" class="app-button-sm">Actualizar</button>
            </div>

            <div id="currStatus" class="text-gray-600 mb-3"></div>
            <div id="currList" class="app-grid-2-cols app-gap-2 text-gray-700"></div>
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
            <div class="app-currency-item">
                <div>
                    <p class="font-semibold text-primary-color">${code}</p>
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
            currStatus.innerHTML = `<p class="text-error-color">No se pudieron cargar las monedas. Reintenta.</p>`;
            currList.innerHTML = `<p class="text-sm text-gray-500">Error al obtener datos.</p>`;
        }
    };

    currSearch.addEventListener('input', () => renderItems(currenciesCache, currSearch.value));
    refreshBtn.addEventListener('click', fetchCurrencies);

    fetchCurrencies();
};

// ================= UI DE NOTIFICACIONES =================

function addNotificationUI() {
    const notificationSection = `
        <div class="app-card app-shadow-2xl border-top-accent mt-6">
            <h2 class="app-h2 text-primary-color mb-4">🔔 Notificaciones Push</h2>
            
            <div class="app-space-y-4">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <span class="text-gray-700 font-medium">Estado:</span>
                        <span id="notificationStatus" class="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Cargando...
                        </span>
                    </div>
                    <div id="notificationBadge" class="hidden">
                        <span class="px-2 py-1 bg-accent-color text-white text-xs rounded-full">Nuevo</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button id="enableNotifications" class="app-button-accent">
                        ✅ Activar
                    </button>
                    <button id="testNotification" class="app-button-sm bg-blue-500" disabled>
                        🔔 Probar
                    </button>
                    <button id="disableNotifications" class="app-button-sm bg-gray-500" disabled>
                        ❌ Desactivar
                    </button>
                </div>
                
                <div id="notificationMessage" class="text-sm font-medium hidden p-3 rounded-lg"></div>
                
                <div class="text-xs text-gray-500 mt-2">
                    <p>💡 Recibe notificaciones cuando completes conversiones y updates de tasas</p>
                </div>
            </div>
        </div>
    `;

    // Agregar después del contenido principal
    contenido.insertAdjacentHTML('afterend', notificationSection);

    // Configurar event listeners
    setupNotificationEvents();
}

function setupNotificationEvents() {
    const enableBtn = document.getElementById('enableNotifications');
    const testBtn = document.getElementById('testNotification');
    const disableBtn = document.getElementById('disableNotifications');
    const statusEl = document.getElementById('notificationStatus');
    const messageEl = document.getElementById('notificationMessage');
    const badgeEl = document.getElementById('notificationBadge');

    // Actualizar estado inicial
    updateNotificationStatus();

    enableBtn.addEventListener('click', async () => {
        try {
            messageEl.classList.add('hidden');
            enableBtn.disabled = true;
            enableBtn.innerHTML = `${getSpinnerHtml('h-4 w-4', 'text-white')} Activando...`;

            const granted = await pushManager.requestPermission();
            if (!granted) {
                showMessage('❌ Los permisos para notificaciones fueron denegados. Por favor, habilítalos manualmente en la configuración de tu navegador.', 'error');
                enableBtn.disabled = false;
                enableBtn.innerHTML = '✅ Activar';
                return;
            }

            const subscription = await pushManager.subscribeUser();
            if (subscription) {
                showMessage('🎉 ¡Notificaciones activadas correctamente! Ahora recibirás alertas de tus conversiones.', 'success');
                badgeEl.classList.remove('hidden');
                updateNotificationStatus();
            } else {
                showMessage('❌ Error al activar notificaciones. Intenta nuevamente.', 'error');
            }
        } catch (error) {
            showMessage(`❌ ${error.message}`, 'error');
        } finally {
            enableBtn.disabled = false;
            enableBtn.innerHTML = '✅ Activar';
        }
    });

    testBtn.addEventListener('click', () => {
        pushManager.sendTestNotification();
        showMessage('🔔 Notificación de prueba enviada. Revisa tu bandeja de notificaciones.', 'success');
    });

    disableBtn.addEventListener('click', async () => {
        disableBtn.disabled = true;
        disableBtn.innerHTML = `${getSpinnerHtml('h-4 w-4', 'text-white')} Desactivando...`;

        const success = await pushManager.unsubscribeUser();
        if (success) {
            showMessage('🔕 Notificaciones desactivadas. Ya no recibirás alertas.', 'success');
            badgeEl.classList.add('hidden');
            updateNotificationStatus();
        } else {
            showMessage('❌ Error al desactivar notificaciones', 'error');
        }

        disableBtn.disabled = false;
        disableBtn.innerHTML = '❌ Desactivar';
    });

    function updateNotificationStatus() {
        const status = pushManager.getNotificationStatus();

        let statusText, colorClass, badgeText;

        switch (status) {
            case 'no-support':
                statusText = 'No soportado';
                colorClass = 'bg-red-100 text-red-800';
                break;
            case 'denied':
                statusText = 'Permiso denegado';
                colorClass = 'bg-red-100 text-red-800';
                break;
            case 'subscribed':
                statusText = 'Activadas';
                colorClass = 'bg-green-100 text-green-800';
                badgeText = 'Conectado';
                break;
            case 'not-subscribed':
                statusText = 'No activadas';
                colorClass = 'bg-yellow-100 text-yellow-800';
                break;
            default:
                statusText = 'Desconocido';
                colorClass = 'bg-gray-100 text-gray-800';
        }

        statusEl.textContent = statusText;
        statusEl.className = `ml-2 px-3 py-1 rounded-full text-sm font-medium ${colorClass}`;

        testBtn.disabled = !pushManager.isSubscribed;
        disableBtn.disabled = !pushManager.isSubscribed;
        enableBtn.disabled = pushManager.isSubscribed || status === 'denied' || status === 'no-support';

        if (status === 'denied') {
            enableBtn.innerHTML = '🚫 Permiso denegado';
        } else if (status === 'no-support') {
            enableBtn.innerHTML = '📱 No soportado';
        }
    }

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `text-sm font-medium p-3 rounded-lg ${type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
}

async function initNotifications() {
    const supported = await pushManager.init();
    if (supported) {
        addNotificationUI();
    } else {
        console.log('Notificaciones push no soportadas en este navegador');
    }
}

// ================= VISTAS Y NAVEGACIÓN =================

const switchView = (viewId) => {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('text-accent-color', 'border-bottom-accent', 'font-semibold');
        link.classList.add('text-white', 'font-medium');

        if (link.id === `nav-${viewId}`) {
            link.classList.remove('text-white', 'font-medium');
            link.classList.add('text-accent-color', 'border-bottom-accent', 'font-semibold');
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
        <div class="app-card app-shadow-2xl border-top-accent transition-all duration-300">
            <h2 class="app-h2 text-primary-color mb-6">Conversor de Divisas</h2>
            <div class="app-loading-state text-lg font-medium text-gray-600">
                ${getSpinnerHtml('h-6 w-6', 'text-accent-color')}
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

// ================= INICIALIZACIÓN DE LA APP =================

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

    // Inicializar notificaciones después de que todo esté listo
    setTimeout(() => {
        initNotifications();
    }, 1000);
};

document.addEventListener("DOMContentLoaded", initApp);

// ================= SERVICE WORKER =================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/ItsRaven-13.github.io-AppMoney/sw.js', {
                scope: '/ItsRaven-13.github.io-AppMoney/'
            });

            console.log('✅ Service Worker registrado:', reg.scope);

            // Enviar mensaje al Service Worker cuando esté listo
            if (reg.active) {
                reg.active.postMessage({
                    type: 'CLIENT_READY',
                    message: 'Cliente conectado correctamente'
                });
            }
        } catch (err) {
            console.warn('❌ Registro SW falló:', err);
        }
    });
}

// ================= MANEJO DE CONECTIVIDAD =================

// Mostrar estado de conexión
function updateOnlineStatus() {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`Estado de conexión: ${status}`);

    if (!navigator.onLine && pushManager.isSubscribed) {
        // Podrías enviar una notificación cuando se recupere la conexión
        console.log('App funciona offline gracias al Service Worker');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();