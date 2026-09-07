<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>op80.com - Real Satellite Tracking & IP Monitoring Centinela System</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        /* Fixed canvas background for golden neon moving points */
        #neonCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
            background-color: #050505;
        }

        body {
            margin: 0; padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: transparent; /* Dynamic background handled by the neon canvas */
            color: #ffffff; display: flex; flex-direction: column; align-items: center; min-height: 100vh;
            overflow-x: hidden;
        }

        .container {
            width: 90%; max-width: 520px; margin: 30px auto;
            background: rgba(16, 22, 36, 0.92); backdrop-filter: blur(14px);
            border: 1px solid rgba(0, 255, 204, 0.3); border-radius: 20px; padding: 25px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 255, 204, 0.15);
            text-align: center;
            z-index: 1;
        }

        h1 { font-size: 2.3rem; color: #00ffcc; margin: 10px 0; text-shadow: 0 0 15px rgba(0, 255, 204, 0.5); }

        .welcome-badge {
            background: linear-gradient(90deg, #00ffcc, #00bfff); color: #050b14;
            padding: 5px 14px; border-radius: 20px; font-weight: bold; font-size: 0.8rem;
            display: inline-block; margin-bottom: 10px; text-transform: uppercase;
        }

        .hero-desc { font-size: 0.9rem; color: #c0cbdc; line-height: 1.4; margin-bottom: 15px; }

        .promo-banner {
            background: linear-gradient(135deg, rgba(255, 51, 102, 0.15), rgba(0, 255, 204, 0.1));
            border-left: 4px solid #ff3366; padding: 10px; border-radius: 8px;
            font-size: 0.82rem; color: #e2e8f0; margin-bottom: 15px; text-align: left;
        }

        .card {
            background: rgba(26, 34, 52, 0.7); border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px; padding: 15px; margin-bottom: 15px; text-align: left;
        }

        .card h3 { color: #00ffcc; font-size: 1rem; margin-top: 0; margin-bottom: 10px; }

        .price-box {
            background: rgba(10, 15, 25, 0.6); padding: 8px 12px; border-radius: 8px;
            margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;
            font-size: 0.85rem; border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .price-box span { color: #00ffcc; font-weight: bold; }

        .crypto-box {
            background: #050b14; padding: 8px; border-radius: 8px; font-family: monospace;
            font-size: 0.75rem; color: #00ffcc; word-break: break-all;
            border: 1px dashed rgba(0, 255, 204, 0.4); margin: 8px 0;
        }

        .input-field {
            width: 100%; padding: 10px; margin-bottom: 8px; background: rgba(5, 11, 20, 0.9);
            border: 1px solid rgba(0, 255, 204, 0.3); border-radius: 8px; color: #fff;
            box-sizing: border-box; font-size: 0.85rem;
        }
        .input-field:focus { outline: none; border-color: #00ffcc; box-shadow: 0 0 8px rgba(0, 255, 204, 0.4); }

        .btn-action {
            display: block; width: 100%; padding: 10px; margin-top: 8px; border-radius: 8px;
            font-weight: bold; text-decoration: none; text-align: center; cursor: pointer; border: none; font-size: 0.9rem;
        }

        .btn-gmail { background: linear-gradient(135deg, #ea4335, #c5221f); color: white; box-shadow: 0 4px 15px rgba(234, 67, 53, 0.4); }
        .btn-copy { background: rgba(255, 255, 255, 0.1); color: #00ffcc; border: 1px solid rgba(0, 255, 204, 0.3); }
        .btn-redeem { background: linear-gradient(135deg, #00ffcc, #00bfff); color: #050b14; box-shadow: 0 4px 15px rgba(0, 255, 204, 0.4); }

        .btn-tab {
            background: rgba(255, 255, 255, 0.05); color: #a0aec0; border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;
        }
        .btn-tab.active { background: #00ffcc; color: #050b14; font-weight: bold; }

        .terms-box {
            font-size: 0.72rem; color: #8a99ad; text-align: justify; margin-top: 15px; line-height: 1.3;
            border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;
        }

        .section-box { display: none; }
        .section-box.active { display: block; }

        .radar-view {
            width: 100%; height: 160px; background: #03070c; border: 1px solid rgba(0, 255, 204, 0.3);
            border-radius: 8px; margin-top: 10px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        .radar-sweep {
            position: absolute; width: 180px; height: 180px; border-radius: 50%;
            background: conic-gradient(from 0deg at 50% 50%, rgba(0, 255, 204, 0) 0deg, rgba(0, 255, 204, 0.3) 360deg);
            animation: spin 4s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .target-dot {
            position: absolute; width: 9px; height: 9px; background: #ff3366; border-radius: 50%;
            box-shadow: 0 0 12px #ff3366; animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(2.4); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }
    </style>
</head>
<body>

    <!-- Canvas for the golden neon moving background -->
    <canvas id="neonCanvas"></canvas>

    <div class="container">
        <div class="welcome-badge">Centinela Cloud System 24/7</div>
        <h1>op80.com</h1>
        <p class="hero-desc">Real-time Satellite Geolocation and IP Monitoring Platform.</p>

        <div class="promo-banner">
            ⚠️ <strong>LEGAL NOTICE:</strong> All sales are final. <strong>NO REFUNDS</strong> under any circumstances once license codes are activated.
        </div>

        <!-- AUTH SECTION (LOGIN / REGISTER) -->
        <div id="authContainer" class="section-box active">
            <div style="margin-bottom: 12px; text-align: left;">
                <button onclick="switchAuthTab('login')" id="tabLogin" class="btn-tab active">Log In</button>
                <button onclick="switchAuthTab('register')" id="tabRegister" class="btn-tab">Register</button>
            </div>

            <div class="card">
                <h3 id="authTitleText">🔐 Log In to System</h3>
                <input type="text" id="authUser" class="input-field" placeholder="Username">
                <input type="password" id="authPass" class="input-field" placeholder="Password">
                <button onclick="executeAuth()" id="btnAuthAction" class="btn-action btn-redeem">Access System</button>
            </div>
        </div>

        <!-- DASHBOARD AND MAIN CONTROL SECTION -->
        <div id="dashboardContainer" class="section-box">
            
            <div class="card">
                <h3>⚡ Redeem Subscription Code</h3>
                <p style="font-size: 0.8rem; color: #a0aec0; margin-top: 0;">Enter your unique code to activate real-time GPS tracking.</p>
                <input type="text" id="codeInput" class="input-field" placeholder="Ex: OP80-7392 or 61360609-OP80">
                <button onclick="redeemLicense()" class="btn-action btn-redeem">🔓 Activate Real GPS Tracking</button>
            </div>

            <!-- REAL GPS & LIVE IP DASHBOARD -->
            <div id="gpsDashboard" style="display: none;" class="card">
                <h4 style="color: #00ffcc; margin: 0 0 8px 0;">🟢 Live Real GPS Telemetry</h4>
                <p style="font-size: 0.78rem; color: #e2e8f0; margin: 0 0 8px 0; line-height: 1.4;">
                    <strong>Device IP Address:</strong> <span id="ipText" style="color: #00ffcc; font-family: monospace;">Retrieving...</span><br>
                    <strong>Real Latitude / Longitude:</strong> <span id="coordsText" style="color: #00ffcc; font-family: monospace;">Waiting for GPS permission...</span><br>
                    <strong>Satellite Accuracy:</strong> <span id="accuracyText" style="color: #00ffcc; font-family: monospace;">-</span><br>
                    <strong>Status:</strong> <span id="statusGps" style="color: #00ffcc; font-family: monospace;">Real-time monitoring active</span>
                </p>
                <div class="radar-view">
                    <div class="radar-sweep"></div>
                    <div class="target-dot" style="top: 50%; left: 50%;"></div>
                </div>
            </div>

            <div class="card">
                <h3>💎 Buy License with Bitcoin (24/7)</h3>
                <div class="price-box"><span>6 Months:</span> $13.99 USD</div>
                <div class="price-box"><span>12 Months:</span> $25.99 USD</div>
                <p style="font-size: 0.8rem; margin-top: 10px; margin-bottom: 3px; color: #a0aec0;">Bitcoin Wallet (BTC):</p>
                <div class="crypto-box">bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s</div>
                <button onclick="copyWallet()" class="btn-action btn-copy" style="font-size: 0.8rem; padding: 6px;">📋 Copy Wallet</button>
                <p style="font-size: 0.75rem; color: #a0aec0; margin: 8px 0 4px 0;">Send payment screenshot to our Gmail. Our team will send your code 24/7:</p>
                <a href="mailto:po80payments@gmail.com?subject=BTC%20Payment%20Receipt%20op80.com&body=Attached%20is%20my%20Bitcoin%20payment%20screenshot%20to%20receive%20my%20code." class="btn-action btn-gmail">✉️ Send Screenshot (po80payments@gmail.com)</a>
            </div>

            <button onclick="logout()" class="btn-action" style="background: rgba(255,51,102,0.2); color: #ff3366; border: 1px solid rgba(255,51,102,0.4); margin-top: 10px;">🔒 Log Out</button>
        </div>

        <div class="terms-box">
            <strong>Terms & Conditions:</strong> Unauthorized use is strictly prohibited. Strict <strong>NO REFUNDS</strong> policy after purchasing and activating license codes.
        </div>
    </div>

    <script>
        /* GOLDEN NEON BACKGROUND ANIMATION SCRIPT */
        const canvas = document.getElementById('neonCanvas');
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const particleCount = 150;
        const particles = [];

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.radius = Math.random() * 2.5 + 1;
                this.alpha = Math.random();
                this.maxAlpha = Math.random() * 0.8 + 0.2;
                this.fadeSpeed = Math.random() * 0.015 + 0.005;
                this.fadingIn = Math.random() > 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
                if (this.fadingIn) {
                    this.alpha += this.fadeSpeed;
                    if (this.alpha >= this.maxAlpha) {
                        this.alpha = this.maxAlpha;
                        this.fadingIn = false;
                    }
                } else {
                    this.alpha -= this.fadeSpeed;
                    if (this.alpha <= 0.05) {
                        this.alpha = 0.05;
                        this.fadingIn = true;
                    }
                }
            }
            draw() {
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${this.alpha})`;
                ctx.shadowColor = 'rgba(255, 180, 0, 0.9)';
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animateNeonBackground() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            requestAnimationFrame(animateNeonBackground);
        }
        animateNeonBackground();


        /* ORIGINAL SYSTEM LOGIC */
        const socket = io();
        let isRegisterMode = false;

        function switchAuthTab(mode) {
            isRegisterMode = (mode === 'register');
            document.getElementById('tabLogin').classList.toggle('active', !isRegisterMode);
            document.getElementById('tabRegister').classList.toggle('active', isRegisterMode);
            document.getElementById('authTitleText').innerText = isRegisterMode ? "📝 User Registration" : "🔐 Log In to System";
            document.getElementById('btnAuthAction').innerText = isRegisterMode ? "Register" : "Access System";
        }

        async function executeAuth() {
            const username = document.getElementById('authUser').value.trim();
            const password = document.getElementById('authPass').value.trim();
            if (!username || !password) { alert("Please complete all fields."); return; }

            const endpoint = isRegisterMode ? '/api/register' : '/api/login';
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    if (!isRegisterMode) {
                        document.getElementById('authContainer').classList.remove('active');
                        document.getElementById('dashboardContainer').classList.add('active');
                    } else {
                        switchAuthTab('login');
                    }
                } else {
                    alert(data.error);
                }
            } catch (err) {
                alert("Server connection error.");
            }
        }

        async function redeemLicense() {
            const code = document.getElementById('codeInput').value.trim();
            if (!code) { alert("Please enter a code."); return; }

            try {
                const res = await fetch('/api/redeem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    document.getElementById('gpsDashboard').style.display = 'block';
                    startRealGpsTracking();
                } else {
                    alert(data.error);
                }
            } catch (err) {
                alert("Error validating code.");
            }
        }

        function startRealGpsTracking() {
            if ("geolocation" in navigator) {
                navigator.geolocation.watchPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const accuracy = position.coords.accuracy;

                        document.getElementById('coordsText').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        document.getElementById('accuracyText').innerText = `${accuracy} meters`;

                        socket.emit('gps-coordinates', { lat, lng, accuracy, timestamp: new Date().toLocaleTimeString() });
                    },
                    (error) => {
                        alert("GPS Error: You must allow real location access in your browser to activate monitoring.");
                        document.getElementById('statusGps').innerText = "Location permission denied by user.";
                    },
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
                );
            } else {
                alert("Your device or browser does not support real satellite geolocation.");
            }
        }

        socket.on('set-ip', (data) => {
            document.getElementById('ipText').innerText = data.ip;
        });

        socket.on('live-location-update', (data) => {
            document.getElementById('coordsText').innerText = `${data.lat}, ${data.lng}`;
            document.getElementById('accuracyText').innerText = `${data.accuracy} meters`;
        });

        function copyWallet() {
            navigator.clipboard.writeText("bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s");
            alert("Bitcoin wallet copied successfully!");
        }

        function logout() {
            document.getElementById('dashboardContainer').classList.remove('active');
            document.getElementById('authContainer').classList.add('active');
            document.getElementById('gpsDashboard').style.display = 'none';
            document.getElementById('authPass').value = '';
        }
    </script>
</body>
</html>
