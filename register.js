// register.js

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // ฟังก์ชันสำหรับจัดการข้อผิดพลาด (อยู่ภายในไฟล์นี้)
    function handleError(error, defaultMessage) {
        console.error(defaultMessage, error.response ? error.response.data : error.message);
        let errorMessage = defaultMessage;
        if (error.response && error.response.data && error.response.data.error) { // เปลี่ยนจาก error.response.data.message เป็น .error
            errorMessage = error.response.data.error; // ใช้ error field จาก backend (ถ้ามี)
        } else if (error.response && error.response.data && error.response.data.message) {
             errorMessage = error.response.data.message; // fallback ไป message ถ้าไม่มี error
        }
        alert(errorMessage);
    }

    // Event listener สำหรับการส่งฟอร์ม
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) { // ใช้ async function
            event.preventDefault();

            let isValid = true;

            // ตรวจสอบชื่อผู้ใช้
            const validateUsername = () => {
                if (usernameInput.value.trim() === '') {
                    usernameError.textContent = 'กรุณากรอกชื่อผู้ใช้';
                    return false;
                } else if (usernameInput.value.trim().length < 3) {
                    usernameError.textContent = 'ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร';
                    return false;
                } else {
                    usernameError.textContent = '';
                    return true;
                }
            };

            // ตรวจสอบรหัสผ่าน
            const validatePassword = () => {
                if (passwordInput.value === '') {
                    passwordError.textContent = 'กรุณากรอกรหัสผ่าน';
                    return false;
                } else if (passwordInput.value.length < 5) {
                    passwordError.textContent = 'รหัสผ่านต้องมีความยาวอย่างน้อย 5 ตัวอักษร';
                    return false;
                } else {
                    passwordError.textContent = '';
                    return true;
                }
            };

            // ตรวจสอบยืนยันรหัสผ่าน
            const validateConfirmPassword = () => {
                if (confirmPasswordInput.value === '') {
                    confirmPasswordError.textContent = 'กรุณายืนยันรหัสผ่าน';
                    return false;
                } else if (confirmPasswordInput.value !== passwordInput.value) {
                    confirmPasswordError.textContent = 'รหัสผ่านไม่ตรงกัน';
                    return false;
                } else {
                    confirmPasswordError.textContent = '';
                    return true;
                }
            };

            // ตรวจสอบความถูกต้องทั้งหมด
            isValid = validateUsername() && validatePassword() && validateConfirmPassword();

            // ถ้าข้อมูลถูกต้อง ให้ส่งไปยัง Backend
            if (isValid) {
                const userData = {
                    username: usernameInput.value,
                    password: passwordInput.value
                };

                try {
                    const response = await axios.post('http://localhost:8000/users', userData); // API Endpoint สำหรับสมัครสมาชิก

                    console.log('สมัครสมาชิกสำเร็จ:', response.data);
                    alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                    window.location.href = 'index.html'; // Redirect ไปหน้าหลัก (Login)
                } catch (error) {
                    // จัดการ Error เช่น Username ซ้ำ
                    handleError(error, 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
                }
            }
        });
    }
});