// Device Fingerprinting (Frontend)
// Comprehensive browser fingerprinting for anti-piracy

interface FingerprintData {
  canvas: string;
  webgl: string;
  audio: string;
  screen: string;
  timezone: string;
  languages: string[];
  platform: string;
  plugins: string[];
  fonts: string[];
  hardware: any;
  network: any;
}

export class DeviceFingerprinter {
  private static instance: DeviceFingerprinter;
  private fingerprintCache: string | null = null;

  public static getInstance(): DeviceFingerprinter {
    if (!DeviceFingerprinter.instance) {
      DeviceFingerprinter.instance = new DeviceFingerprinter();
    }
    return DeviceFingerprinter.instance;
  }

  public async generateFingerprint(): Promise<string> {
    if (this.fingerprintCache) {
      return this.fingerprintCache;
    }

    const components = await Promise.all([
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      this.getAudioFingerprint(),
      this.getScreenFingerprint(),
      this.getTimezoneFingerprint(),
      this.getLanguageFingerprint(),
      this.getPlatformFingerprint(),
      this.getPluginFingerprint(),
      this.getFontFingerprint(),
      this.getHardwareFingerprint(),
      this.getNetworkFingerprint()
    ]);

    const fingerprint = await this.hashFingerprint(components.join('|'));
    this.fingerprintCache = fingerprint;
    
    return fingerprint;
  }

  private async getCanvasFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('no-canvas');
        return;
      }

      canvas.width = 200;
      canvas.height = 50;

      // Draw complex pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security watermark', 4, 45);

      // Add geometric shapes
      ctx.beginPath();
      ctx.arc(50, 50, 20, 0, Math.PI * 2);
      ctx.fill();

      resolve(canvas.toDataURL());
    });
  }
  private async getWebGLFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'no-webgl';    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    
    return `${vendor}|${renderer}`;
  }

  private async getAudioFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        
        gainNode.gain.value = 0; // Silent
        
        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(0);
        
        setTimeout(() => {
          const frequencyData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(frequencyData);
          
          oscillator.stop();
          audioContext.close();
          
          resolve(Array.from(frequencyData).slice(0, 30).join(','));
        }, 100);
        
      } catch (error) {
        resolve('no-audio');
      }
    });
  }

  private async getScreenFingerprint(): Promise<string> {
    const screen = window.screen;
    return [
      screen.width,
      screen.height,
      screen.colorDepth,
      screen.pixelDepth,
      screen.availWidth,
      screen.availHeight
    ].join('x');
  }

  private async getTimezoneFingerprint(): Promise<string> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    return `${timezone}|${offset}`;
  }

  private async getLanguageFingerprint(): Promise<string> {
    return navigator.languages.join(',');
  }

  private async getPlatformFingerprint(): Promise<string> {
    return [
      navigator.platform,
      navigator.userAgent,
      navigator.vendor,
      navigator.cookieEnabled ? '1' : '0',
      navigator.doNotTrack || 'unknown'
    ].join('|');
  }
  private async getPluginFingerprint(): Promise<string> {
    const plugins = Array.from(navigator.plugins).map(plugin => 
      `${plugin.name}:${'unknown'}`
    );
    return plugins.slice(0, 10).join(','); // Limit to first 10
  }

  private async getFontFingerprint(): Promise<string> {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-fonts';

    const baseline = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    ctx.font = '72px serif';
    ctx.fillText(baseline, 0, 100);
    const baselineData = canvas.toDataURL();

    const detectedFonts: string[] = [];
    
    for (const font of testFonts) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `72px ${font}, serif`;
      ctx.fillText(baseline, 0, 100);
      
      if (canvas.toDataURL() !== baselineData) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts.join(',');
  }

  private async getHardwareFingerprint(): Promise<string> {
    const hardware = {
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };

    return Object.values(hardware).join('|');
  }

  private async getNetworkFingerprint(): Promise<string> {
    const connection = (navigator as any).connection;
    
    if (!connection) return 'no-connection';
    
    return [
      connection.effectiveType || 'unknown',
      connection.downlink || 'unknown',
      connection.rtt || 'unknown',
      connection.saveData ? '1' : '0'
    ].join('|');
  }

  private async hashFingerprint(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Get detailed fingerprint data for analysis
  public async getDetailedFingerprint(): Promise<FingerprintData> {
    return {
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      audio: await this.getAudioFingerprint(),
      screen: await this.getScreenFingerprint(),
      timezone: await this.getTimezoneFingerprint(),
      languages: Array.from(navigator.languages),
      platform: await this.getPlatformFingerprint(),
      plugins: (await this.getPluginFingerprint()).split(','),
      fonts: (await this.getFontFingerprint()).split(','),
      hardware: {
        cores: navigator.hardwareConcurrency,
        memory: (navigator as any).deviceMemory,
        connection: (navigator as any).connection?.effectiveType
      },
      network: {
        effectiveType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
        saveData: (navigator as any).connection?.saveData
      }
    };
  }

  // Clear cache to force regeneration
  public clearCache(): void {
    this.fingerprintCache = null;
  }
}

// Export singleton instance
export const deviceFingerprinter = DeviceFingerprinter.getInstance();
