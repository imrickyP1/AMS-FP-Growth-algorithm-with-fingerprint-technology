// ===============================================
// 🔐 ZKTeco Live20R Fingerprint Reader Integration
// ===============================================
// Supports multiple ZKTeco SDK services:
// - ZKBioOnline (primary)
// - ZKFinger SDK (fallback)

const FingerprintReader = {
  // Configuration for ZKTeco Live20R
  config: {
    // ZKBioOnline Service endpoints (most common for Live20R)
    zkBioOnline: {
      httpUrl: "http://127.0.0.1:8098",        // Default ZKBioOnline port
      wsUrl: "ws://127.0.0.1:8098/ws",
    },
    // Alternative ports to try
    altPorts: [8098, 8099, 22003, 22004, 9922],
    // ZKFinger SDK endpoints (fallback)
    zkFinger: {
      wsUrl: "ws://127.0.0.1:22003/ZKComWS/ZKFinger",
      httpUrl: "http://127.0.0.1:22004",
    },
    // Timeout for fingerprint capture (30 seconds)
    timeout: 30000,
    // Device settings for Live20R
    deviceIndex: 0,
  },

  activeService: null,
  socket: null,
  isConnected: false,
  captureCallback: null,
  deviceOpened: false,

  // ===============================================
  // Initialize - Auto-detect available service
  // ===============================================
  async init() {
    console.log("🔌 Initializing fingerprint reader...");
    
    // Try ZKBioOnline first (most common for Live20R on Windows)
    if (await this.tryZKBioOnline()) {
      this.activeService = "zkbioonline";
      return true;
    }
    
    // Try ZKFinger SDK as fallback
    if (await this.tryZKFinger()) {
      this.activeService = "zkfinger";
      return true;
    }
    
    throw new Error("No fingerprint service found. Please ensure ZKBioOnline is running.");
  },

  // ===============================================
  // Try ZKBioOnline Connection
  // ===============================================
  async tryZKBioOnline() {
    const ports = this.config.altPorts;
    
    for (const port of ports) {
      try {
        console.log(`🔍 Trying ZKBioOnline on port ${port}...`);
        
        // Test HTTP connection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`http://127.0.0.1:${port}/api/status`, {
          method: "GET",
          signal: controller.signal,
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          this.config.zkBioOnline.httpUrl = `http://127.0.0.1:${port}`;
          console.log(`✅ ZKBioOnline connected on port ${port}`);
          this.isConnected = true;
          return true;
        }
        
        // Try alternative endpoint
        const altResponse = await fetch(`http://127.0.0.1:${port}/`, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        }).catch(() => null);
        
        if (altResponse) {
          this.config.zkBioOnline.httpUrl = `http://127.0.0.1:${port}`;
          console.log(`✅ ZKBioOnline service found on port ${port}`);
          this.isConnected = true;
          return true;
        }
        
      } catch (e) {
        console.log(`❌ Port ${port} not available`);
      }
    }
    
    return false;
  },

  // ===============================================
  // Try ZKFinger SDK Connection
  // ===============================================
  async tryZKFinger() {
    return new Promise((resolve) => {
      try {
        console.log("🔍 Trying ZKFinger SDK...");
        const ws = new WebSocket(this.config.zkFinger.wsUrl);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 3000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          this.socket = ws;
          this.isConnected = true;
          console.log("✅ ZKFinger SDK connected");
          
          ws.onmessage = (event) => this.handleMessage(event.data);
          ws.onclose = () => {
            this.isConnected = false;
            this.deviceOpened = false;
          };
          
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        
      } catch (e) {
        resolve(false);
      }
    });
  },

  // ===============================================
  // Handle WebSocket Messages
  // ===============================================
  handleMessage(data) {
    try {
      const response = JSON.parse(data);
      console.log("📥 Response:", response);

      if (response.ret === 0 || response.code === 0 || response.success) {
        if ((response.template || response.Template || response.data?.template) && this.captureCallback) {
          const template = response.template || response.Template || response.data?.template;
          this.captureCallback(null, {
            template: template,
            image: response.image || response.Image || null,
            quality: response.quality || response.Quality || 0
          });
        }
      } else if (this.captureCallback) {
        this.captureCallback(new Error(response.message || response.msg || "Capture failed"), null);
      }
    } catch (error) {
      console.error("❌ Parse error:", error);
    }
  },

  // ===============================================
  // Check if Device is Connected
  // ===============================================
  async checkDevice() {
    if (this.activeService === "zkbioonline") {
      return await this.checkZKBioOnlineDevice();
    } else if (this.activeService === "zkfinger") {
      return this.isConnected;
    }
    
    // Try to initialize if not connected
    try {
      await this.init();
      return this.isConnected;
    } catch (e) {
      return false;
    }
  },

  // ===============================================
  // Check ZKBioOnline Device Status
  // ===============================================
  async checkZKBioOnlineDevice() {
    try {
      const endpoints = [
        "/api/device/status",
        "/api/devices",
        "/device/status",
        "/status",
        "/api/fingerprint/status"
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.config.zkBioOnline.httpUrl}${endpoint}`, {
            method: "GET",
            signal: AbortSignal.timeout(2000),
          });
          
          if (response.ok) {
            const data = await response.json().catch(() => ({}));
            console.log(`📟 Device status from ${endpoint}:`, data);
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      
      // If no status endpoint works but we connected earlier, assume device is ready
      return this.isConnected;
      
    } catch (e) {
      return false;
    }
  },

  // ===============================================
  // Capture Single Fingerprint
  // ===============================================
  async captureSingle() {
    if (this.activeService === "zkbioonline") {
      return await this.captureZKBioOnline();
    } else if (this.activeService === "zkfinger") {
      return await this.captureZKFinger();
    }
    
    // Try to initialize first
    await this.init();
    return await this.captureSingle();
  },

  // ===============================================
  // Capture via ZKBioOnline REST API
  // ===============================================
  async captureZKBioOnline() {
    const endpoints = [
      { url: "/api/fingerprint/capture", method: "POST" },
      { url: "/api/capture", method: "POST" },
      { url: "/capture", method: "POST" },
      { url: "/api/fingerprint/scan", method: "POST" },
      { url: "/api/finger/capture", method: "GET" },
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📤 Trying capture endpoint: ${endpoint.url}`);
        
        const response = await fetch(`${this.config.zkBioOnline.httpUrl}${endpoint.url}`, {
          method: endpoint.method,
          headers: { "Content-Type": "application/json" },
          body: endpoint.method === "POST" ? JSON.stringify({
            timeout: this.config.timeout,
            deviceIndex: this.config.deviceIndex,
          }) : undefined,
          signal: AbortSignal.timeout(this.config.timeout),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("📥 Capture response:", data);
          
          // Extract template from various response formats
          const template = data.template || data.Template || 
                          data.data?.template || data.data?.Template ||
                          data.fingerprint || data.Fingerprint ||
                          data.result?.template;
          
          if (template) {
            return template;
          }
          
          // If response indicates success but no template yet, might need polling
          if (data.success || data.code === 0) {
            continue; // Try next endpoint
          }
        }
      } catch (e) {
        console.log(`❌ Endpoint ${endpoint.url} failed:`, e.message);
        continue;
      }
    }
    
    throw new Error("Failed to capture fingerprint. Please ensure finger is on scanner.");
  },

  // ===============================================
  // Capture via ZKFinger WebSocket
  // ===============================================
  async captureZKFinger() {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected to ZKFinger SDK"));
        return;
      }

      const timeout = setTimeout(() => {
        this.captureCallback = null;
        reject(new Error("Capture timeout - no finger detected"));
      }, this.config.timeout);

      this.captureCallback = (error, data) => {
        clearTimeout(timeout);
        this.captureCallback = null;
        if (error) {
          reject(error);
        } else {
          resolve(data.template);
        }
      };

      this.socket.send(JSON.stringify({
        action: "capture",
        deviceIndex: this.config.deviceIndex,
      }));
    });
  },

  // ===============================================
  // Capture for Enrollment (3 samples)
  // ===============================================
  async captureForEnrollment(samplesRequired = 3) {
    const templates = [];
    
    for (let i = 0; i < samplesRequired; i++) {
      Swal.fire({
        title: `Fingerprint ${i + 1} of ${samplesRequired}`,
        html: `
          <div style="text-align: center;">
            <i class="fa-solid fa-fingerprint" style="font-size: 64px; color: #2b426b; margin: 20px; animation: pulse 1s infinite;"></i>
            <p>Place your finger on the <strong>Live20R</strong> scanner</p>
            <p style="color: #666; font-size: 12px;">Keep your finger steady</p>
          </div>
          <style>@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }</style>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      try {
        const template = await this.captureSingle();
        templates.push(template);
        
        if (i < samplesRequired - 1) {
          await Swal.fire({
            title: "✓ Captured!",
            text: `Lift and place finger again (${i + 2} of ${samplesRequired})`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false
          });
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (error) {
        Swal.close();
        throw error;
      }
    }
    
    Swal.close();
    
    // Return first template (or merge if SDK supports it)
    return templates[0];
  },

  // ===============================================
  // Disconnect
  // ===============================================
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.deviceOpened = false;
    this.activeService = null;
  }
};

// ===============================================
// 🔧 Simplified API for Registration/Login
// ===============================================
const FingerprintEnrollment = {
  
  async isAvailable() {
    try {
      await FingerprintReader.init();
      return await FingerprintReader.checkDevice();
    } catch (error) {
      console.warn("⚠️ Fingerprint reader not available:", error.message);
      return false;
    }
  },

  async enroll() {
    try {
      if (!FingerprintReader.isConnected) {
        await FingerprintReader.init();
      }

      const hasDevice = await FingerprintReader.checkDevice();
      if (!hasDevice) {
        throw new Error("Live20R not detected. Ensure ZKBioOnline service is running.");
      }

      const template = await FingerprintReader.captureForEnrollment(3);
      
      Swal.fire({
        title: "Fingerprint Enrolled!",
        html: `<i class="fa-solid fa-check-circle" style="font-size: 48px; color: #28a745;"></i>
               <p style="margin-top: 15px;">Successfully captured via ${FingerprintReader.activeService}</p>`,
        timer: 2500,
        showConfirmButton: false
      });

      return template;
    } catch (error) {
      console.error("❌ Enrollment error:", error);
      Swal.fire({
        title: "Enrollment Failed",
        html: `<p>${error.message}</p>
               <p style="font-size: 12px; color: #666; margin-top: 10px;">
                 <strong>Check:</strong><br>
                 1. ZKBioOnline service is running<br>
                 2. Live20R is connected via USB<br>
                 3. Finger is placed correctly on scanner
               </p>`,
        icon: "error"
      });
      throw error;
    }
  },

  async quickEnroll() {
    try {
      if (!FingerprintReader.isConnected) {
        await FingerprintReader.init();
      }

      Swal.fire({
        title: "Scan Your Fingerprint",
        html: `<i class="fa-solid fa-fingerprint fa-beat" style="font-size: 64px; color: #2b426b;"></i>
               <p style="margin-top: 15px;">Place finger on Live20R scanner...</p>`,
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const template = await FingerprintReader.captureSingle();
      
      Swal.fire({
        title: "Captured!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });

      return template;
    } catch (error) {
      Swal.fire({
        title: "Capture Failed",
        text: error.message,
        icon: "error"
      });
      throw error;
    }
  }
};

// Export
window.FingerprintReader = FingerprintReader;
window.FingerprintEnrollment = FingerprintEnrollment;

console.log("🔐 Fingerprint module loaded (ZKBioOnline + ZKFinger SDK support)");
