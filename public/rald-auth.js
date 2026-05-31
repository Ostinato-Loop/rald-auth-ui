/**
 * RALD Identity — Third-Party Embed Script
 * 
 * Usage:
 *   <script src="https://profiles.rald.cloud/rald-auth.js" 
 *           data-client-id="YOUR_CLIENT_ID"
 *           data-redirect-uri="https://yourapp.com/auth/callback"></script>
 *   
 *   Or call manually:
 *   RALDAuth.init({ clientId: 'xxx', redirectUri: 'https://...' });
 *   RALDAuth.signIn();
 */

(function() {
    'use strict';

    const RALD_BASE_URL = 'https://profiles.rald.cloud';
    const POPUP_WIDTH = 480;
    const POPUP_HEIGHT = 640;

    class RALDAuthClient {
        constructor(config) {
            this.clientId = config.clientId;
            this.redirectUri = config.redirectUri;
            this.appName = config.appName || document.title;
            this.popup = null;
            this.state = this.generateState();

            // Listen for messages from popup
            window.addEventListener('message', this.handleMessage.bind(this));
        }

        generateState() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        }

        signIn() {
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                app_name: this.appName,
                state: this.state,
                response_type: 'code',
                scope: 'profile email'
            });

            const url = `${RALD_BASE_URL}/sign-in?${params}`;

            // Center popup
            const left = (window.screen.width - POPUP_WIDTH) / 2;
            const top = (window.screen.height - POPUP_HEIGHT) / 2;

            this.popup = window.open(
                url,
                'RALDAuth',
                `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},` +
                'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no'
            );

            // Fallback for popup blockers
            if (!this.popup || this.popup.closed) {
                window.location.href = url;
            }
        }

        signUp() {
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                app_name: this.appName,
                state: this.state,
                response_type: 'code',
                scope: 'profile email'
            });

            const url = `${RALD_BASE_URL}/sign-up?${params}`;

            const left = (window.screen.width - POPUP_WIDTH) / 2;
            const top = (window.screen.height - POPUP_HEIGHT) / 2;

            this.popup = window.open(
                url,
                'RALDAuth',
                `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},` +
                'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no'
            );

            if (!this.popup || this.popup.closed) {
                window.location.href = url;
            }
        }

        handleMessage(event) {
            // Verify origin
            if (event.origin !== RALD_BASE_URL) return;

            const { type, code, state, error } = event.data;

            if (type === 'RALD_AUTH_SUCCESS') {
                if (state !== this.state) {
                    console.error('RALD Auth: State mismatch');
                    this.emit('error', { message: 'State mismatch' });
                    return;
                }

                this.emit('success', { code });

                // Exchange code for tokens
                this.exchangeCode(code);
            }

            if (type === 'RALD_AUTH_ERROR') {
                this.emit('error', { message: error });
            }
        }

        async exchangeCode(code) {
            try {
                const response = await fetch(`${RALD_BASE_URL}/api/oauth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        code,
                        client_id: this.clientId,
                        redirect_uri: this.redirectUri
                    })
                });

                const data = await response.json();

                if (data.access_token) {
                    this.emit('authenticated', data);
                } else {
                    this.emit('error', { message: data.error_description || 'Token exchange failed' });
                }
            } catch (err) {
                this.emit('error', { message: 'Network error during token exchange' });
            }
        }

        // Simple event emitter
        listeners = {};
        on(event, callback) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(callback);
        }
        emit(event, data) {
            (this.listeners[event] || []).forEach(cb => cb(data));
        }
    }

    // ===== GLOBAL API =====
    window.RALDAuth = {
        client: null,

        init(config) {
            if (!config.clientId) {
                console.error('RALD Auth: clientId is required');
                return;
            }
            if (!config.redirectUri) {
                console.error('RALD Auth: redirectUri is required');
                return;
            }
            this.client = new RALDAuthClient(config);
            return this.client;
        },

        signIn() {
            if (!this.client) {
                console.error('RALD Auth: Call RALDAuth.init() first');
                return;
            }
            this.client.signIn();
        },

        signUp() {
            if (!this.client) {
                console.error('RALD Auth: Call RALDAuth.init() first');
                return;
            }
            this.client.signUp();
        },

        on(event, callback) {
            if (!this.client) {
                console.error('RALD Auth: Call RALDAuth.init() first');
                return;
            }
            this.client.on(event, callback);
        }
    };

    // ===== AUTO-INIT FROM DATA ATTRIBUTES =====
    const script = document.currentScript;
    if (script) {
        const clientId = script.dataset.clientId;
        const redirectUri = script.dataset.redirectUri;
        const appName = script.dataset.appName;

        if (clientId && redirectUri) {
            RALDAuth.init({ clientId, redirectUri, appName });
        }
    }

    // ===== PRE-BUILT BUTTON STYLES (injected) =====
    const style = document.createElement('style');
    style.textContent = `
        .rald-signin-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            background: #111111;
            border: 1px solid #262626;
            border-radius: 8px;
            color: #e5e5e5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        .rald-signin-btn:hover {
            background: #1a1a1a;
            border-color: #404040;
        }
        .rald-signin-btn svg {
            width: 18px;
            height: 18px;
        }
        .rald-signin-btn-light {
            background: #ffffff;
            border-color: #e5e5e5;
            color: #171717;
        }
        .rald-signin-btn-light:hover {
            background: #fafafa;
            border-color: #d4d4d4;
        }
    `;
    document.head.appendChild(style);

    console.log('🔷 RALD Identity SDK loaded');
})();