// ===============================================
// 🔐 ZKTeco Live20R Scanner Service
// ===============================================
// Communicates with .NET Core API Scanner endpoints
// for device detection, connection, and fingerprint capture

const ScannerService = {
  // API Endpoints
  endpoints: {
    status: '/scanner/status',
    detect: '/scanner/detect',
    initialize: '/scanner/initialize',
    connect: '/scanner/connect',
    disconnect: '/scanner/disconnect',
    capture: '/scanner/capture',
    enroll: '/scanner/enroll',
    match: '/scanner/match',
    health: '/scanner/health'
  },

  // State
  state: {
    sdkInitialized: false,
    deviceConnected: false,
    deviceCount: 0,
    deviceInfo: null,
    lastError: null,
    isOnline: false
  },

  // Callbacks
  onStatusChange: null,

  // ===============================================
  // Get full API URL
  // ===============================================
  getUrl(endpoint) {
    return `${API_BASE_URL}${endpoint}`;
  },

  // ===============================================
  // Initialize the scanner SDK
  // ===============================================
  async initialize() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.initialize), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      this.state.sdkInitialized = data.sdkInitialized || false;
      this.state.deviceCount = data.deviceCount || 0;
      this.state.isOnline = true;
      
      this.notifyStatusChange();
      return data;
    } catch (error) {
      this.state.isOnline = false;
      this.state.lastError = error.message;
      this.notifyStatusChange();
      throw error;
    }
  },

  // ===============================================
  // Get scanner status
  // ===============================================
  async getStatus() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.status), {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await response.json();
      
      this.state.isOnline = true;
      this.state.sdkInitialized = data.sdk?.initialized || false;
      this.state.deviceCount = data.devices?.count || 0;
      this.state.deviceConnected = data.devices?.connected || false;
      this.state.deviceInfo = data.devices?.info || null;
      
      this.notifyStatusChange();
      return data;
    } catch (error) {
      this.state.isOnline = false;
      this.state.lastError = error.message;
      this.notifyStatusChange();
      throw error;
    }
  },

  // ===============================================
  // Detect connected scanners
  // ===============================================
  async detectDevices() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.detect), {
        method: 'GET'
      });
      
      const data = await response.json();
      this.state.deviceCount = data.deviceCount || 0;
      this.state.isOnline = true;
      
      this.notifyStatusChange();
      return data;
    } catch (error) {
      this.state.isOnline = false;
      throw error;
    }
  },

  // ===============================================
  // Connect to scanner
  // ===============================================
  async connect(deviceIndex = 0) {
    try {
      const response = await fetch(this.getUrl(this.endpoints.connect) + `?deviceIndex=${deviceIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      this.state.deviceConnected = data.connected || false;
      this.state.deviceInfo = data.device || null;
      
      this.notifyStatusChange();
      return data;
    } catch (error) {
      this.state.lastError = error.message;
      throw error;
    }
  },

  // ===============================================
  // Disconnect from scanner
  // ===============================================
  async disconnect() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.disconnect), {
        method: 'POST'
      });
      
      const data = await response.json();
      this.state.deviceConnected = false;
      this.state.deviceInfo = null;
      
      this.notifyStatusChange();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================================
  // Capture single fingerprint
  // ===============================================
  async capture() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.capture), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================================
  // Enroll fingerprint (3 captures + merge)
  // ===============================================
  async enroll(captures = 3) {
    try {
      const response = await fetch(this.getUrl(this.endpoints.enroll) + `?captures=${captures}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================================
  // Check if service is online
  // ===============================================
  async checkOnline() {
    try {
      const response = await fetch(this.getUrl(this.endpoints.health), {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      const data = await response.json();
      this.state.isOnline = data.status === 'healthy';
      this.state.sdkInitialized = data.scanner?.sdkInitialized || false;
      this.state.deviceConnected = data.scanner?.deviceConnected || false;
      
      this.notifyStatusChange();
      return this.state.isOnline;
    } catch (error) {
      this.state.isOnline = false;
      this.notifyStatusChange();
      return false;
    }
  },

  // ===============================================
  // Check if scanner is available
  // ===============================================
  async isAvailable() {
    try {
      const isOnline = await this.checkOnline();
      if (!isOnline) return false;
      
      const status = await this.getStatus();
      return status.devices?.count > 0 || status.devices?.connected;
    } catch (error) {
      return false;
    }
  },

  // ===============================================
  // Notify status change
  // ===============================================
  notifyStatusChange() {
    if (this.onStatusChange) {
      this.onStatusChange({ ...this.state });
    }
  },

  // ===============================================
  // Start status polling
  // ===============================================
  startPolling(intervalMs = 5000) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.checkOnline().catch(() => {});
    }, intervalMs);
    
    // Initial check
    this.checkOnline().catch(() => {});
  },

  // ===============================================
  // Stop status polling
  // ===============================================
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
};

// Export
window.ScannerService = ScannerService;

console.log('🔐 Scanner Service loaded (.NET Core API integration)');
