import { registerSW } from 'virtual:pwa-register'

/**@param app {HTMLDivElement}*/
export function initPWA(app) {
    /**@type {HTMLDivElement}*/
    const pwaToast = app.querySelector('#pwa-toast')
    /**@type {HTMLDivElement}*/
    const pwaToastMessage = pwaToast.querySelector('.message #toast-message')
    /**@type {HTMLButtonElement}*/
    const pwaCloseBtn = pwaToast.querySelector('#pwa-close')
    /**@type {HTMLButtonElement}*/
    const pwaRefreshBtn = pwaToast.querySelector('#pwa-refresh')

    /**@type {(reloadPage?: boolean) => Promise<void>}*/
    let refreshSW

    const refreshCallback = () => refreshSW?.(true)

    /**@param raf {boolean}*/
    function hidePwaToast (raf) {
        if (raf) {
            requestAnimationFrame(() => hidePwaToast(false))
            return
        }
        if (pwaToast.classList.contains('refresh'))
            pwaRefreshBtn.removeEventListener('click', refreshCallback)

        pwaToast.classList.remove('show', 'refresh')
    }
    /**@param offline {boolean}*/
    function showPwaToast(offline) {
        if (!offline)
            pwaRefreshBtn.addEventListener('click', refreshCallback)
        requestAnimationFrame(() => {
            hidePwaToast(false)
            if (!offline)
                pwaToast.classList.add('refresh')
            pwaToast.classList.add('show')
        })
    }

    let swActivated = false
    // periodic sync is disabled, change the value to enable it, the period is in milliseconds
   // You can remove onRegisteredSW callback and registerPeriodicSync function
    const period = 0

    window.addEventListener('load', () => {
        pwaCloseBtn.addEventListener('click', () => hidePwaToast(true))
        refreshSW = registerSW({
            immediate: true,
            onOfflineReady() {
                pwaToastMessage.innerHTML = 'App ready to work offline'
                showPwaToast(true)
            },
            onNeedRefresh() {
                pwaToastMessage.innerHTML = 'New content available, click on reload button to update'
                showPwaToast(false)
            },
            onRegisteredSW(swUrl, r) {
                if (period <= 0) return
                if (r?.active?.state === 'activated') {
                    swActivated = true
                    registerPeriodicSync(period, swUrl, r)
                }
                else if (r?.installing) {
                    r.installing.addEventListener('statechange', (e) => {
                        /**@type {ServiceWorker}*/
                        const sw = e.target
                        swActivated = sw.state === 'activated'
                        if (swActivated)
                            registerPeriodicSync(period, swUrl, r)
                    })
                }
            },
        })
    })
}

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 *
 * @param period {number}
 * @param swUrl {string}
 * @param r {ServiceWorkerRegistration}
 */
function registerPeriodicSync(period, swUrl, r) {
    if (period <= 0) return

    setInterval(async () => {
        if ('onLine' in navigator && !navigator.onLine)
            return

        const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
                'cache': 'no-store',
                'cache-control': 'no-cache',
            },
        })

        if (resp?.status === 200)
            await r.update()
    }, period)
}
