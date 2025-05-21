document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerButton = document.getElementById('register-button');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await axios.post('http://localhost:8000/login', { username, password });

                console.log('Login successful:', response.data);
                // เก็บ Token และข้อมูลผู้ใช้ใน localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user)); // เก็บ user เป็น JSON string

                alert('เข้าสู่ระบบสำเร็จ!');
                // เปลี่ยนเส้นทางไปหน้าหลักหลังจาก Login สำเร็จ
                window.location.href = 'index.html'; // สมมติว่าหน้าหลักของคุณชื่อ index.html
            } catch (error) {
                console.error('Login error:', error.response ? error.response.data : error.message);
                alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        });
    }

    if (registerButton) {
        registerButton.addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อสมัครสมาชิก');
                return;
            }

            try {
                // ใช้ Route '/users' สำหรับการสมัครสมาชิก ตามที่คุณต้องการ
                const response = await axios.post('http://localhost:8000/users', { username, password });
                alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                loginForm.reset(); // ล้างฟอร์ม
            } catch (error) {
                console.error('Registration error:', error.response ? error.response.data : error.message);
                alert('เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + (error.response ? error.response.data.error || error.response.data.message : error.message));
            }
        });
    }
});