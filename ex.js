    // utils.js

    // ฟังก์ชันสำหรับแปลงค่าเวลาเป็นข้อความที่อ่านง่าย
    function getTimeLabel(timeValue) {
        switch (timeValue) {
            case '5-10mins':
                return '5-10 นาที';
            case '11-30mins':
                return '11-30 นาที';
            case '31-60mins':
                return '31-60 นาที';
            case '60+mins':
                return 'มากกว่า 60 นาที';
            default:
                return timeValue || '-';
        }
    }

    // ฟังก์ชันสำหรับดึง Token จาก Local Storage
    function getToken() {
        return localStorage.getItem('token');
    }

    // ฟังก์ชันสำหรับดึงข้อมูล User จาก Local Storage
    function getUser() {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    }

    // Export ฟังก์ชันเหล่านี้เพื่อให้ไฟล์อื่นสามารถนำไปใช้ได้
    export { getTimeLabel, getToken, getUser };
    