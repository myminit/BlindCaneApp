/**
 * BluetoothService - บริการจัดการการเชื่อมต่อบลูทูธ
 * 
 * บทบาทของ BluetoothService:
 * - จัดการ API บลูทูธของระบบปฏิบัติการ
 * - ค้นหาอุปกรณ์บลูทูธใกล้เคียง
 * - เชื่อมต่อ/ตัดการเชื่อมต่อกับอุปกรณ์
 * - จัดการสิทธิ์การใช้งาน (permissions)
 */

import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

const manager = new BleManager();
let connectedDevice = null;

const BluetoothService = {
  /**
   * requestPermissions()
   * ขอสิทธิ์ที่จำเป็นสำหรับการใช้บลูทูธ
   * 
   * ขั้นตอน:
   * - ตรวจสอบเวอร์ชัน Android
   * - ขอสิทธิ์ BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION
   * - สิทธิ์เหล่านี้จำเป็นสำหรับการค้นหาและเชื่อมต่อ
   */
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        console.log(`📱 Android Version: ${Platform.Version}`);
        
        // Android 12+ (API 31+) 
        if (Platform.Version >= 31) {
          console.log('🔵 Android 12+ detected - requesting BLUETOOTH_SCAN and BLUETOOTH_CONNECT');
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];

          const results = await PermissionsAndroid.requestMultiple(permissions);
          
          console.log('📋 Permission results:', results);
          
          const scanGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
          const connectGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
          const locationGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

          console.log('✅ BLUETOOTH_SCAN:', scanGranted);
          console.log('✅ BLUETOOTH_CONNECT:', connectGranted);
          console.log('✅ ACCESS_FINE_LOCATION:', locationGranted);
          
          if (!scanGranted || !connectGranted) {
            console.error('❌ Missing critical Bluetooth permissions!');
            console.error('   Please enable in: Settings > Apps > BlindCaneApp > Permissions > Bluetooth, Location');
            return false;
          }
          
          console.log('✅ All permissions granted for Android 12+');
          return true;
        } else {
          // Android < 12 - just need Location
          console.log('🔵 Android <12 detected - requesting ACCESS_FINE_LOCATION');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission Required',
              message: 'BlindCane needs location permission to scan Bluetooth devices',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Allow',
            }
          );
          
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          console.log('✅ Location permission:', isGranted);
          return isGranted;
        }
      } catch (err) {
        console.error('❌ Permission request error:', err);
        return false;
      }
    }
    // iOS - not required
    console.log('📱 iOS detected - no explicit permission request needed');
    return true;
  },

  /**
   * scanForDevices()
   * ค้นหาอุปกรณ์บลูทูธทั้งหมดที่อยู่ใกล้เคียง รวมถึงที่ไม่มีชื่อ
   * 
   * ขั้นตอน:
   * 1. ขอ permission ก่อน
   * 2. เริ่มการค้นหา (scanning) - ค้นหาทั้งสิ่งที่มีชื่อและไม่มีชื่อ
   * 3. รอเป็นเวลา 10 วินาที (10000 ms) เพื่อให้ค้นหาครบ
   * 4. หยุดการค้นหา
   * 5. คืนค่ารายชื่ออุปกรณ์ที่พบ พร้อมข้อมูล:
   *    - id: Bluetooth MAC address
   *    - name: ชื่อของอุปกรณ์
   *    - rssi: ความแรงของสัญญาณ (ยิ่งมากเท่าไหร่ยิ่งใกล้)
   * 
   * คืนค่า: Array ของอุปกรณ์ที่พบ (เรียงลำดับตามสัญญาณ)
   */
  async scanForDevices() {
    try {
      console.log('=== Starting Bluetooth Scan ===');
      
      // ขอ permission ก่อน
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('ไม่ได้รับ Bluetooth permission - กรุณาอนุญาตใน Settings');
      }

      const foundDevices = [];
      let scanStartTime = Date.now();

      // หยุดการสแกนเดิมถ้ามี
      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.log('No previous scan to stop');
      }

      console.log('Bluetooth scanning started...');

      // เริ่มสแกน - manager.startDeviceScan จะค้นหาทั้งอุปกรณ์ที่มีชื่อและไม่มีชื่อ
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan callback error:', error);
          return;
        }

        if (device) {
          // อุปกรณ์ IoT บางตัวไม่มี name แต่มี localName หรือไม่มีเลย
          // ดังนั้นเราต้องใช้ ID แทน
          const deviceName = device.name || device.localName || `Device_${device.id.slice(-6)}`;
          
          // แสดง log ทุกอุปกรณ์ที่เจอ (สำคัญสำหรับ debug)
          console.log(`Found: ${device.id} | Name: "${deviceName}" | RSSI: ${device.rssi}dBm | Connectable: ${device.isConnectable}`);

          // ตรวจสอบว่าอุปกรณ์นี้เป็นที่เชื่อมต่อได้ (isConnectable)
          // IoT บางตัวไม่แสดง isConnectable ดังนั้นเราจึงเพิ่มเข้าไปไม่ว่ากรณีไหน
          const alreadyFound = foundDevices.find((d) => d.id === device.id);
          if (!alreadyFound) {
            foundDevices.push({
              id: device.id,
              name: deviceName,
              rssi: device.rssi || 0,
              isConnectable: device.isConnectable !== false, // treat undefined as connectable
              raw: device
            });
          }
        }
      });

      // สแกนเป็นเวลา 10 วินาที แล้วหยุด
      await new Promise((resolve) => setTimeout(resolve, 10000));
      manager.stopDeviceScan();
      
      const scanDuration = Date.now() - scanStartTime;
      console.log(`Scan completed in ${scanDuration}ms. Found ${foundDevices.length} devices`);

      if (foundDevices.length === 0) {
        console.warn('⚠️  No devices found! Check:');
        console.warn('  1. Is Bluetooth enabled on the phone?');
        console.warn('  2. Is the IoT device powered on and advertising?');
        console.warn('  3. Are the app permissions granted in Settings?');
        console.warn('  4. Try scanning from phone Settings - if it works there, it\'s a permission issue');
      }

      // เรียงลำดับตามสัญญาณ (ใกล้สุดขึ้นก่อน)
      const sorted = foundDevices.sort((a, b) => b.rssi - a.rssi);
      console.log('Sorted devices:', sorted.map(d => `${d.name} (${d.rssi}dBm)`).join(', '));
      
      return sorted;

    } catch (error) {
      console.error('scanForDevices error:', error);
      try {
        manager.stopDeviceScan();
      } catch (e) {
        // ignore
      }
      throw error;
    }
  },

  /**
   * connectToDevice(deviceId)
   * เชื่อมต่อกับอุปกรณ์บลูทูธที่ระบุ
   * 
   * ขั้นตอน:
   * 1. หยุดการสแกน
   * 2. เชื่อมต่อกับอุปกรณ์
   * 3. ค้นพบ services และ characteristics
   * 4. บันทึก device object
   * 5. คืนค่า true ถ้าสำเร็จ, false ถ้าล้มเหลว
   * 
   * @param {string} deviceId - ID ของอุปกรณ์ที่ต้องการเชื่อมต่อ
   * @returns {boolean} สถานะของการเชื่อมต่อ
   */
  async connectToDevice(deviceId) {
    try {
      console.log('Stopping scan before connecting...');
      manager.stopDeviceScan();

      console.log(`Attempting to connect to: ${deviceId}`);

      // ตั้ง timeout สำหรับการเชื่อมต่อ
      const connectionPromise = manager.connectToDevice(deviceId, {
        autoConnect: false,
        timeout: 10000, // 10 seconds timeout
      });

      const device = await Promise.race([
        connectionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);

      console.log(`Connected to device: ${device.name || device.id}`);

      // ต้องเรียก discover services ก่อนใช้งาน
      console.log('Discovering services and characteristics...');
      await device.discoverAllServicesAndCharacteristics();
      
      connectedDevice = device;
      console.log('✅ Successfully connected and discovered services');
      return true;
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      connectedDevice = null;
      return false;
    }
  },

  /**
   * disconnect()
   * ตัดการเชื่อมต่อกับอุปกรณ์ปัจจุบัน
   * 
   * @returns {boolean} สถานะของการตัดการเชื่อมต่อ
   */
  async disconnect() {
    try {
      if (connectedDevice) {
        console.log(`Disconnecting from: ${connectedDevice.name || connectedDevice.id}`);
        await manager.cancelDeviceConnection(connectedDevice.id);
        connectedDevice = null;
        console.log('✅ Disconnected');
        return true;
      }
      console.log('No device connected');
      return false;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  },

  /**
   * sendData(serviceUUID, characteristicUUID, data)
   * ส่งข้อมูลไปยังอุปกรณ์บลูทูธ
   * 
   * @param {string} serviceUUID - UUID ของบริการ
   * @param {string} characteristicUUID - UUID ของลักษณะ
   * @param {string|ArrayBuffer} data - ข้อมูลที่ต้องการส่ง
   * @returns {boolean} สถานะของการส่งข้อมูล
   */
  async sendData(serviceUUID, characteristicUUID, data) {
    try {
      if (!connectedDevice) throw new Error('No device connected');
      
      console.log('Sending data:', data);
      await connectedDevice.writeCharacteristicWithoutResponseForService(
        serviceUUID,
        characteristicUUID,
        data
      );
      console.log('✅ Data sent successfully');
      return true;
    } catch (error) {
      console.error('Send data error:', error);
      return false;
    }
  },

  /**
   * readData(serviceUUID, characteristicUUID)
   * อ่านข้อมูลจากอุปกรณ์บลูทูธ
   * 
   * @param {string} serviceUUID - UUID ของบริการที่ต้องการอ่านข้อมูลจาก
   * @param {string} characteristicUUID - UUID ของลักษณะที่ต้องการอ่านข้อมูลจาก
   * @returns {ArrayBuffer|null} ข้อมูลที่อ่านได้ หรือ null ถ้าเกิดข้อผิดพลาด
   */
  async readData(serviceUUID, characteristicUUID) {
    try {
      if (!connectedDevice) throw new Error('No device connected');

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

  /**
   * getConnectedDevice()
   * ดึงข้อมูลอุปกรณ์ที่เชื่อมต่ออยู่ปัจจุบัน
   * 
   * @returns {string|null} ID ของอุปกรณ์ที่เชื่อมต่อ หรือ null ถ้าไม่มี
   */
  getConnectedDevice() {
    return connectedDevice;
  },
};

export default BluetoothService;