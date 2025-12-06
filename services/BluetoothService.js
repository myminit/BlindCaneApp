import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

const manager = new BleManager();
let connectedDevice = null;

const BluetoothService = {
  async requestPermissions() {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      
      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  },

  async scanForDevices() {
    try {
      // ขอ permission ก่อน
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('ไม่มีสิทธิ์เข้าถึง Bluetooth');
      }

      // รีเซ็ตผลการสแกน
      const foundDevices = [];
      
      // เริ่มสแกนและรอ 10 วินาที
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.name) {
          // เพิ่มอุปกรณ์ที่พบหากยังไม่มี
          if (!foundDevices.find((d) => d.id === device.id)) {
            foundDevices.push({
              id: device.id,
              name: device.name,
              rssi: device.rssi,
            });
          }
        }
      });

      // สแกนเป็นเวลา 10 วินาที
      await new Promise((resolve) => setTimeout(resolve, 10000));
      manager.stopDeviceScan();

      return foundDevices;
    } catch (error) {
      console.error('scanForDevices error:', error);
      manager.stopDeviceScan();
      throw error;
    }
  },

  async connectToDevice(deviceId) {
    try {
      // หยุดการสแกน
      manager.stopDeviceScan();

      // เชื่อมต่อกับอุปกรณ์
      const device = await manager.connectToDevice(deviceId, {
        autoConnect: false,
      });

      // ค้นหา services และ characteristics
      await device.discoverAllServicesAndCharacteristics();

      connectedDevice = device;
      console.log('Connected to:', device.name);
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  },

  async disconnect() {
    try {
      if (connectedDevice) {
        await manager.cancelDeviceConnection(connectedDevice.id);
        connectedDevice = null;
        console.log('Disconnected');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  },

  async sendData(serviceUUID, characteristicUUID, data) {
    try {
      if (!connectedDevice) {
        throw new Error('ไม่มีอุปกรณ์ที่เชื่อมต่อ');
      }

      await connectedDevice.writeCharacteristicWithoutResponseForService(
        serviceUUID,
        characteristicUUID,
        data
      );
      console.log('Data sent');
      return true;
    } catch (error) {
      console.error('Send data error:', error);
      return false;
    }
  },

  async readData(serviceUUID, characteristicUUID) {
    try {
      if (!connectedDevice) {
        throw new Error('ไม่มีอุปกรณ์ที่เชื่อมต่อ');
      }

      const characteristic = await connectedDevice.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );
      return characteristic.value;
    } catch (error) {
      console.error('Read data error:', error);
      return null;
    }
  },

  getConnectedDevice() {
    return connectedDevice;
  },
};

export default BluetoothService;
