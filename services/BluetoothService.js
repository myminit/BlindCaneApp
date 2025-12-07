// services/BluetoothService.js
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const CHARACTERISTIC_UUID_TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // notify (device → app)
const CHARACTERISTIC_UUID_RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // write (app → device)

class BluetoothServiceClass {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.monitorSubscription = null;

    // เราจะใช้ callback นี้ใน App.js
    this.onMessageCallback = null;
    this.onConnectionChange = null;

    // buffer สำหรับต่อ JSON ที่มาจาก BLE (ป้องกันข้อความขาด)
    this.partialData = "";
  }

  // ========== SET CALLBACKS ================
  setOnMessage(cb) {
    this.onMessageCallback = cb;
  }

  setOnConnectionChange(cb) {
    this.onConnectionChange = cb;
  }

  // ========== PERMISSION AND SCAN ================
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(
          (v) => v === PermissionsAndroid.RESULTS.GRANTED,
        );
      } catch (e) {
        console.warn('permission request error', e);
        return false;
      }
    }
    return true;
  }

  scanForDevices(scanSeconds = 6) {
    return new Promise((resolve, reject) => {
      const found = {};
      const devices = [];
      let timer = null;

      const sub = this.manager.startDeviceScan(
        [SERVICE_UUID],
        null,
        (error, device) => {
          if (error) {
            clearTimeout(timer);
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }
          if (!device || !device.id) return;

          if (!found[device.id]) {
            found[device.id] = true;
            devices.push({
              id: device.id,
              name: device.name || device.localName || 'Unknown',
              rssi: device.rssi,
              raw: device,
            });
          }
        }
      );

      timer = setTimeout(() => {
        this.manager.stopDeviceScan();
        if (sub?.remove) sub.remove();
        resolve(devices);
      }, scanSeconds * 1000);
    });
  }

  // ================= CONNECT =================
  async connectToDevice(deviceId) {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      // clear old monitor
      if (this.monitorSubscription?.remove) {
        this.monitorSubscription.remove();
      }

      // ========== BLE NOTIFICATION LISTENER ==========
      this.monitorSubscription = this.manager.monitorCharacteristicForDevice(
        device.id,
        SERVICE_UUID,
        CHARACTERISTIC_UUID_TX,
        (error, characteristic) => {
          if (error) {
            console.warn("monitor error", error);
            return;
          }

          if (!characteristic?.value) return;

          // decode base64 → UTF-8
          const text = Buffer.from(characteristic.value, 'base64').toString('utf8');

          // รวมกับ partial buffer (แก้ปัญหา JSON ขาด)
          this.partialData += text;

          // เช็คว่า JSON ครบหรือยัง (จบด้วย "}")
          if (this.partialData.trim().endsWith("}")) {
            try {
              const parsed = JSON.parse(this.partialData.trim());

              if (this.onMessageCallback) {
                this.onMessageCallback(parsed);
              }
            } catch (e) {
              console.warn("JSON parse error:", e, this.partialData);
            }

            // ล้าง buffer เมื่อจบ 1 JSON
            this.partialData = "";
          }
        }
      );

      if (this.onConnectionChange) {
        this.onConnectionChange(true, device.name || deviceId);
      }

      return true;
    } catch (e) {
      console.warn('connectToDevice error', e);
      if (this.onConnectionChange) this.onConnectionChange(false, null);
      return false;
    }
  }

  // ================= DISCONNECT =================
  async disconnect() {
    try {
      if (this.monitorSubscription?.remove) {
        this.monitorSubscription.remove();
      }
      if (this.connectedDevice) {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
      }
      if (this.onConnectionChange) this.onConnectionChange(false, null);
    } catch (e) {
      console.warn("disconnect error", e);
    }
  }

  // ================= SEND BLE MESSAGE =================
  async sendBleMessage(str) {
    if (!this.connectedDevice) throw new Error("Not connected");
    const base64 = Buffer.from(str, 'utf8').toString('base64');

    try {
      await this.manager.writeCharacteristicWithResponseForDevice(
        this.connectedDevice.id,
        SERVICE_UUID,
        CHARACTERISTIC_UUID_RX,
        base64
      );
    } catch (e) {
      console.warn("sendBleMessage error", e);
      throw e;
    }
  }
}

export default new BluetoothServiceClass();