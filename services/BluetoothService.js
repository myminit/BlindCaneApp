// บริการตัวอย่างสำหรับสาธิตการสแกน/เชื่อมต่อ
// แนะนำ: แทนที่ด้วยไลบรารีจริง (react-native-ble-plx / react-native-bluetooth-classic) เมื่อต้องการใช้งานจริง
const BluetoothService = {
  async scanForDevices() {
    // จำลองการสแกนด้วย timeout
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'cane-01', name: 'ไม้เท้า IoT - ต้นแบบ' },
          // ...สามารถคืนค่ามากกว่า 1 อุปกรณ์ได้
        ]);
      }, 1400);
    });
  },

  async connectToDevice(deviceId) {
    // จำลองการเชื่อมต่อ
    return new Promise((resolve) => {
      setTimeout(() => {
        // คืนค่า true เมื่อเชื่อมสำเร็จ
        resolve(true);
      }, 900);
    });
  },

  async disconnect() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 400);
    });
  },
};

export default BluetoothService;
