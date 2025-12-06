# Smart Blind Stick (ไม้เท้าอัจฉริยะเพื่อผู้พิการทางสายตา)

**Smart Blind Stick** คือโปรเจกต์ IoT ที่พัฒนาขึ้นเพื่อช่วยอำนวยความสะดวกและความปลอดภัยให้กับผู้พิการทางสายตา โดยการทำงานร่วมกันระหว่าง **Hardware (ไม้เท้า)** และ **Mobile Application (สมองกล)** ผ่านการเชื่อมต่อไร้สายแบบ **Bluetooth**

ระบบนี้ไม่เพียงแค่แจ้งเตือนสิ่งกีดขวาง แต่ยังสามารถ **"มองเห็น"** และ **"พูดบอก"** สภาพแวดล้อมให้ผู้ใช้ได้ยิน ผ่านเทคโนโลยี AI และ Text-to-Speech บนสมาร์ทโฟน

---

## ฟีเจอร์หลัก (Key Features)

* **Obstacle Detection:** ตรวจจับสิ่งกีดขวางระยะประชิดด้วยเซนเซอร์ Ultrasonic พร้อมแจ้งเตือนทันที
* **AI Vision:** ถ่ายภาพสภาพแวดล้อมผ่านกล้อง ESP32-CAM และส่งไปยังแอปพลิเคชันเพื่อวิเคราะห์วัตถุ
* **Voice Assistant:** แอปพลิเคชันแปลงผลลัพธ์จากภาพเป็นเสียงพูดภาษาไทย (Text-to-Speech) เพื่อบอกผู้ใช้
* **Bluetooth Connectivity:** เชื่อมต่อและรับส่งข้อมูลระหว่างไม้เท้ากับมือถือแบบไร้สาย (รองรับ Android 10+)

---

## อุปกรณ์และเครื่องมือ (Tech Stack)

### Hardware (ส่วนไม้เท้า)
* **Microcontroller:** ESP32-CAM (AI Thinker)
* **Sensor:** HC-SR04 Ultrasonic Sensor (วัดระยะ)
* **Power:** แบตเตอรี่ Li-ion 18650 x 2 ก้อน (พร้อมโมดูลชาร์จ)
* **Communication:** Bluetooth Serial / BLE
* **Programmer:** FTDI Module (สำหรับอัปโหลดโค้ด)

### Software (ส่วนแอปพลิเคชัน)
* **Framework:** React Native (Expo SDK)
* **Build Tool:** EAS CLI (Expo Application Services)
* **Platform:** Android 10+ (API Level 29+)
* **AI Engine:** TensorFlow Lite / External Vision API
* **Language:** JavaScript / TypeScript

---

## ขั้นตอนการติดตั้ง (Installation Guide)

ระบบนี้แบ่งการติดตั้งเป็น 2 ส่วน คือ **Firmware (ลงบอร์ด)** และ **Application (ลงมือถือ)**

### ส่วนที่ 1: การติดตั้ง Firmware ลงบอร์ด ESP32-CAM

1.  **เตรียมโปรแกรม:**
    * ดาวน์โหลดและติดตั้ง [Arduino IDE](https://www.arduino.cc/en/software)
    * เพิ่ม URL ใน `Additional Boards Manager URLs`:
        `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2.  **ติดตั้งบอร์ด:**
    * ไปที่ `Tools` > `Board` > `Boards Manager` > ค้นหา `esp32` > กด **Install**
3.  **อัปโหลดโค้ด:**
    * เชื่อมต่อ ESP32-CAM ผ่าน FTDI (ต่อขา `IO0` ลง `GND` เพื่อเข้าโหมด Flash)
    * เลือก Board: **"AI Thinker ESP32-CAM"**
    * เปิดไฟล์ `.ino` ในโฟลเดอร์ `firmware` แล้วกด **Upload**
    * *เมื่อเสร็จแล้ว ถอดสาย IO0 ออกแล้วกด Reset 1 ครั้ง*

### ส่วนที่ 2: การติดตั้งแอปพลิเคชัน (Mobile App)

**Prerequisites:** ติดตั้ง [Node.js](https://nodejs.org/), [Git](https://git-scm.com/) และ [Expo CLI](https://docs.expo.dev/get-started/installation/)

1.  **Clone โปรเจกต์:**
    ```bash
    git clone [https://github.com/your-username/smart-blind-stick.git](https://github.com/your-username/smart-blind-stick.git)
    ```

2.  **ติดตั้ง Library:**
    ```bash
    npm install
    ```

3.  **สร้างไฟล์ติดตั้ง (.apk) สำหรับ Android:**
    *(ต้องสมัครบัญชี Expo และตั้งค่า eas.json ให้เป็น buildType: apk ก่อน)*
    ```bash
    npm install -g eas-cli
    eas login
    eas build -p android --profile preview
    ```
    > รอประมาณ 10-20 นาที เมื่อเสร็จสิ้น Terminal จะแสดงลิงก์สำหรับดาวน์โหลดไฟล์ `.apk`

4.  **ติดตั้งลงมือถือ:**
    * ดาวน์โหลดไฟล์ `.apk` ลงมือถือ Android
    * กดติดตั้ง (Allow installation from unknown sources)

---

## วิธีใช้งาน (User Guide)

### 1. เริ่มต้นระบบ (Startup)
* **ไม้เท้า:** เปิดสวิตช์ Power รอจนไฟ LED กระพริบ (Bluetooth Ready)
* **มือถือ:** เปิด Bluetooth และ GPS (Location) แล้วเข้าแอปพลิเคชัน

### 2. การเชื่อมต่อ (Pairing)
* กดปุ่ม **"Connect"** ในแอปพลิเคชัน
* เลือกอุปกรณ์ชื่อ `ESP32-BlindStick` (หรือชื่อที่ตั้งไว้)
* เมื่อเชื่อมต่อสำเร็จ แอปจะส่งเสียงแจ้งเตือนสถานะ

### 3. การใช้งาน (Operation)
* **โหมดเดิน (Walking Mode):**
    * ถือไม้เท้าเดินตามปกติ เซนเซอร์จะทำงานตลอดเวลา
    * เมื่อเข้าใกล้วัตถุ < 50 ซม. แอปจะสั่นและส่งเสียงเตือนถี่ขึ้นตามระยะทาง
* **โหมดมอง (Vision Mode):**
    * กดปุ่มที่ไม้เท้า 1 ครั้ง (หรือกดปุ่มในแอป) เพื่อถ่ายภาพ
    * รอระบบประมวลผล (AI Processing) ประมาณ 2-3 วินาที
    * แอปจะพูดบรรยายสิ่งที่อยู่ตรงหน้า เช่น *"มีสุนัขนอนขวางทางอยู่"* หรือ *"ทางเดินโล่ง"*

---

## ข้อควรระวังและการแก้ไขปัญหา (Troubleshooting)

* **หา Bluetooth ไม่เจอ:**
    * ตรวจสอบว่าเปิด **Location (GPS)** บนมือถือแล้วหรือยัง (จำเป็นสำหรับ Android 10+)
    * ตรวจสอบว่าแอปได้รับสิทธิ์ `ACCESS_FINE_LOCATION`
* **ภาพไม่ส่งมา:**
    * ตรวจสอบแบตเตอรี่ของไม้เท้า หากไฟตก ESP32-CAM อาจทำงานไม่เสถียร
    * ระยะห่างระหว่างมือถือกับไม้เท้าไม่ควรเกิน 2-3 เมตร
