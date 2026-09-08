/**
 * Real-Time Attendance Synchronization & Network Diagnostics Engine
 * Supports seamless operations across Public Web, Local Area Network (LAN), and Offline environments.
 */

import { AttendanceLog } from '../types';

export const ATTENDANCE_SYNC_CHANNEL_NAME = 'smkmu_attendance_sync_channel';

class AttendanceSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(log: AttendanceLog, source: string) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(ATTENDANCE_SYNC_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'ATTENDANCE_UPDATE' && event.data.log) {
            this.notifyListeners(event.data.log, event.data.source || 'remote-tab');
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization fallback:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Storage event listener for cross-window synchronization
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('schoolPortalAttendanceLog') && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed, 'storage-event');
          } catch (err) {
            // ignore
          }
        }
      });
    }
  }

  private notifyListeners(log: AttendanceLog, source: string) {
    this.listeners.forEach((listener) => {
      try {
        listener(log, source);
      } catch (err) {
        console.error('Error notifying attendance sync listener:', err);
      }
    });
  }

  /**
   * Broadcast attendance log update to all local tabs, kiosks, and portal views
   */
  public broadcastLogUpdate(log: AttendanceLog) {
    try {
      if (this.channel) {
        this.channel.postMessage({
          type: 'ATTENDANCE_UPDATE',
          log,
          timestamp: Date.now(),
          source: 'local-tab'
        });
      }
    } catch (e) {
      console.warn('Broadcast message error:', e);
    }
  }

  /**
   * Subscribe to real-time attendance changes from other tabs/kiosks
   */
  public subscribe(callback: (log: AttendanceLog, source: string) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check connection environment details
   */
  public getNetworkEnvironment() {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        isSecureContext: true,
        isLAN: false,
        protocol: 'https:',
        host: 'localhost',
        cameraPermitted: true
      };
    }

    const host = window.location.hostname;
    const isLAN = 
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host.endsWith('.local');

    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    return {
      isOnline: navigator.onLine,
      isSecureContext,
      isLAN,
      protocol: window.location.protocol,
      host,
      hasMediaDevices,
      cameraPermitted: isSecureContext || host === 'localhost' || host === '127.0.0.1'
    };
  }
}

export const attendanceSync = new AttendanceSyncEngine();
