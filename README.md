
# MenuHit - เว็บไซต์จัดการสูตรอาหารพร้อมระบบให้คะแนน

เว็บไซต์ **MenuHit** เป็นแพลตฟอร์มสำหรับจัดการสูตรอาหารที่ผู้ใช้สามารถเพิ่ม, แก้ไข, ลบสูตรอาหารของตนเองได้ รวมถึงสามารถให้คะแนนสูตรอาหารของผู้อื่นได้ด้วย ระบบมีการจัดการผู้ใช้และการยืนยันตัวตน (Authentication) เพื่อความปลอดภัยของข้อมูล

## คุณสมบัติ (Features)

-   **การจัดการผู้ใช้ (User Management)**:
    
    -   ลงทะเบียนผู้ใช้ใหม่
        
    -   เข้าสู่ระบบ (Login) ด้วยชื่อผู้ใช้และรหัสผ่าน
        
    -   จัดการข้อมูลส่วนตัว (เช่น อัปเดตข้อมูลผู้ใช้)
        
    -   ออกจากระบบ (Logout)
        
-   **การจัดการสูตรอาหาร (Recipe Management)**:
    
    -   ดูรายการสูตรอาหารทั้งหมด
        
    -   ค้นหาสูตรอาหารตามชื่อ, วัตถุดิบ, เวลาทำ, และระดับความยาก
        
    -   เพิ่มสูตรอาหารใหม่ (ต้องเข้าสู่ระบบ)
        
    -   แก้ไขสูตรอาหารของตนเอง (ต้องเข้าสู่ระบบและเป็นเจ้าของสูตร)
        
    -   ลบสูตรอาหารของตนเอง (ต้องเข้าสู่ระบบและเป็นเจ้าของสูตร)
        
-   **ระบบให้คะแนน (Rating System)**:
    
    -   ผู้ใช้ที่เข้าสู่ระบบสามารถให้คะแนนสูตรอาหารของผู้อื่นได้ (1-5 ดาว)
        
    -   ผู้ใช้สามารถให้คะแนนแต่ละเมนูได้เพียง 1 ครั้งเท่านั้น และไม่สามารถแก้ไขคะแนนที่ให้ไปแล้วได้
        
    -   แสดงคะแนนเฉลี่ยของแต่ละสูตรอาหาร
        
-   **การแสดงผลเวลาปรุงอาหารที่เป็นมิตรกับผู้ใช้ (User-Friendly Cooking Time Display)**:
    
    -   ใช้ฟังก์ชัน `getTimeLabel()` เพื่อแปลงค่าเวลาปรุงอาหารที่เป็นรหัส (เช่น '5-10mins') ให้เป็นข้อความภาษาไทยที่เข้าใจง่าย (เช่น '5-10 นาที') ทำให้ผู้ใช้สามารถอ่านและทำความเข้าใจข้อมูลได้อย่างรวดเร็วและเป็นธรรมชาติ
        

## เทคโนโลยีที่ใช้ (Technologies Used)

### Backend (Server)

-   **Node.js**: Runtime environment สำหรับ JavaScript
    
-   **Express.js**: Web framework สำหรับ Node.js เพื่อสร้าง API
    
-   **MySQL**: ฐานข้อมูลเชิงสัมพันธ์สำหรับจัดเก็บข้อมูลผู้ใช้, สูตรอาหาร, และคะแนน
    
-   **mysql2/promise**: Node.js driver สำหรับ MySQL ที่รองรับ Promise
    
-   **jsonwebtoken (JWT)**: สำหรับการยืนยันตัวตน (Authentication) และการจัดการ Token
    
-   **cors**: Middleware สำหรับจัดการ Cross-Origin Resource Sharing
    
-   **path**: Node.js module สำหรับจัดการเส้นทางไฟล์
    

### Frontend (Client)

-   **HTML5**: โครงสร้างของหน้าเว็บ
    
-   **CSS3**: สำหรับการจัดรูปแบบและออกแบบ UI
    
-   **JavaScript (ES6+)**: สำหรับ Logic การทำงานฝั่ง Client
    
-   **Axios**: JavaScript library สำหรับการทำ HTTP requests
    
-   **localStorage**: สำหรับจัดเก็บ Token และข้อมูลผู้ใช้ที่ Login อยู่
    

## การตั้งค่าและรันโปรเจกต์ (Setup and Run)

### 1. การตั้งค่าฐานข้อมูล MySQL

ก่อนอื่น คุณต้องมี MySQL Server ติดตั้งและทำงานอยู่บนเครื่องของคุณ จากนั้นสร้างฐานข้อมูลและตารางที่จำเป็น:

1.  **สร้างฐานข้อมูล**:
    
    ```
    CREATE DATABASE menuhit;
    USE menuhit;
    
    ```
    
2.  **สร้างตาราง `user`**:
    
    ```
    CREATE TABLE user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
        -- ควรเพิ่มฟิลด์อื่นๆ เช่น email, created_at, updated_at
    );
    
    ```
    
3.  **สร้างตาราง `recipes`**:
    
    ```
    CREATE TABLE recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ingredients TEXT,
        instructions TEXT,
        time VARCHAR(50),
        difficulty VARCHAR(50),
        image_food VARCHAR(255),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
    
    ```
    
4.  **สร้างตาราง `ratings`**:
    
    ```
    CREATE TABLE ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        score INT NOT NULL CHECK (score >= 1 AND score <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, recipe_id), -- บังคับให้ user_id และ recipe_id เป็นคู่ที่ไม่ซ้ำกัน (ให้คะแนนได้ 1 ครั้งต่อเมนูต่อผู้ใช้)
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
    
    ```
    

### 2. การตั้งค่า Backend (Server)

1.  **Clone repository** (ถ้ามี) หรือสร้างโฟลเดอร์สำหรับโปรเจกต์ Server ของคุณ
    
2.  **สร้างไฟล์ `package.json`** โดยรัน `npm init -y` ใน Terminal ภายในโฟลเดอร์ Server
    
3.  **ติดตั้ง Dependencies**: เปิด Terminal ในโฟลเดอร์ Server และรันคำสั่ง:
    
    ```
    npm install express body-parser cors mysql2 jsonwebtoken
    
    ```
    
4.  **สร้างไฟล์ `index.js`** และคัดลอกโค้ดจาก Canvas `โค้ดสำหรับ index.js (พร้อมคุณสมบัติการให้คะแนน)` ที่คุณมีไปวางในไฟล์นี้
    
    -   **สำคัญ**: ตรวจสอบให้แน่ใจว่าค่า `JWT_SECRET` ใน `index.js` ตรงกันกับที่ใช้ในการสร้างและตรวจสอบ Token
        
    -   **คำแนะนำด้านความปลอดภัย**: สำหรับ Production Environment ควรย้าย `JWT_SECRET` ไปเก็บใน Environment Variable และใช้ `bcrypt` ในการ Hash รหัสผ่านผู้ใช้
        
    -   **ยังไม่ได้ใช้ระบบ Hash Password (เช่น bcrypt)**: ปัจจุบันรหัสผ่านของผู้ใช้ถูกจัดเก็บในฐานข้อมูลเป็นข้อความธรรมดา ซึ่งเป็นความเสี่ยงด้านความปลอดภัยที่สำคัญ **แนะนำอย่างยิ่งให้ใช้ bcrypt หรือไลบรารีการแฮชรหัสผ่านที่เหมาะสม** เพื่อแฮชรหัสผ่านก่อนบันทึกลงฐานข้อมูล
        
5.  **รัน Server**: เปิด Terminal ในโฟลเดอร์ Server และรันคำสั่ง:
    
    ```
    node index.js
    
    ```
    
    Server ควรจะเริ่มทำงานที่ `http://localhost:8000`
    

### 3. การตั้งค่า Frontend (Client)
    1.  **สร้างไฟล์ `index.html`**นี่คือไฟล์ HTML หลักของเว็บไซต์
    
2.  **สร้างไฟล์ `main.js`** 
    
3.  **สร้างไฟล์ `utils.js`**  ซึ่งมีฟังก์ชัน `getTimeLabel`, `getToken`, `getUser`
    
4.  **สร้างไฟล์ `recipe_detail.html`** สำหรับหน้ารายละเอียดสูตรอาหาร
    
5.  **สร้างไฟล์ `recipe_detail.js`** สำหรับ Logic ของหน้ารายละเอียดสูตรอาหาร
    
6.  **สร้างไฟล์ `recipe_detail.css`**  สำหรับสไตล์ของหน้ารายละเอียดสูตรอาหาร
    
7.  **แก้ไข `index.html`**:
    
    -   ตรวจสอบให้แน่ใจว่าได้ลิงก์ไฟล์ `main.js` และ `utils.js` อย่างถูกต้อง โดยใช้ `type="module"` สำหรับ `main.js` และ path ที่ถูกต้อง
        
    -   คุณจะต้องเพิ่ม `<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>` ใน `index.html` ก่อนที่จะโหลด `main.js` เพื่อให้ `axios` พร้อมใช้งาน
        
    
    **ตัวอย่างโครงสร้าง `index.html` (ย่อ)**:
    
    ```
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MenuHit</title>
        <link rel="stylesheet" href="style.css"> </head>
    <body>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <script type="module" src="utils.js"></script>
        <script type="module" src="main.js"></script>
    </body>
    </html>
    
    ```
    
9.  **วางโค้ด Frontend**: คัดลอกโค้ด `main.js`, `utils.js`, `recipe_detail.html`, `recipe_detail.js`, และ `recipe_detail.css` 
    

## การใช้งาน (Usage)

1.  เปิดเว็บเบราว์เซอร์ของคุณและไปที่ `http://localhost:8000`
    
2.  คุณจะเห็นหน้าเว็บไซต์ MenuHit
    
3.  **เข้าสู่ระบบ**: หากคุณต้องการเพิ่ม/แก้ไข/ลบสูตรอาหารหรือให้คะแนน คุณจะต้องเข้าสู่ระบบก่อน
    
    -   หากยังไม่มีบัญชี คุณสามารถสร้างบัญชีใหม่ได้ (ผ่าน API `POST /users` ซึ่งต้องสร้างหน้า UI สำหรับลงทะเบียนเอง)
        
    -   ใช้ฟอร์ม Login เพื่อเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
        
4.  **เรียกดูสูตรอาหาร**: คุณสามารถดูรายการสูตรอาหารทั้งหมดและใช้ฟังก์ชันการค้นหาได้
    
5.  **เพิ่ม/แก้ไข/ลบสูตรอาหาร**: หลังจาก Login แล้ว คุณจะเห็นตัวเลือกในการจัดการสูตรอาหารของคุณ
    
6.  **ให้คะแนน**: หลังจาก Login แล้ว คุณจะเห็นตัวเลือกในการให้คะแนนสูตรอาหารของผู้อื่น
    
7.  **ดูรายละเอียดสูตรอาหาร**: ผู้ใช้ทั่วไปและสมาชิกสามารถคลิกที่การ์ดสูตรอาหารเพื่อดูรายละเอียดเพิ่มเติมในหน้า `recipe_detail.html`


## การ Run Website
1.Download Code จาก Github นี้ และเปิดด้วย VSCode

2.สร้าง SQL สำหรับเก็บข้อมูลตาม ข้อ 1 (การตั้งค่าฐานข้อมูล MySQL)

3.ถ้าเครื่องยังไม่มี  node.js ต้องติดตั้งก่อน

4.จากนั้น ใช้ MAMP ในการ Run server

5.ติดตั้งส่วนเสริมใน VSCode ที่ชื่อว่า live server

6.เปิดไฟล์ index.html ผ่าน live server เพื่อบราว์เซอร์ของคุณจะโหลดไฟล์ผ่านโปรโตคอล http:// ซึ่งจะแก้ปัญหา CORS ได้ทันที
    

