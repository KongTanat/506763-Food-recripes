

import { getToken, getUser } from './ex.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    const recipeForm = document.getElementById('recipe-form');
    const recipeIdInput = document.getElementById('recipe-id');
    const recipeNameInput = document.getElementById('recipe-name');
    const recipeImageInput = document.getElementById('recipe-image');
    const recipeIngredientsInput = document.getElementById('recipe-ingredients');
    const recipeInstructionsInput = document.getElementById('recipe-instructions');
    const recipeTimeRadios = document.querySelectorAll('input[name="time"]');
    const recipeDifficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    const responseMessageDOM = document.getElementById('response-message');
    const submitButton = document.getElementById('submit-button');
    const cancelButton = document.getElementById('cancel-button');
    const formHeader = document.getElementById('form-header');
    const pageTitle = document.getElementById('page-title');

    let mode = 'ADD'; // 'ADD' หรือ 'EDIT'
    let recipeId = null;

    const token = getToken();
    const currentUser = getUser();

    // ตรวจสอบสถานะการ Login
    if (!token || !currentUser || !currentUser.id) {
        alert('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
        window.location.href = 'index.html'; // Redirect กลับไปหน้าหลักที่มี Login
        return;
    }

    // ฟังก์ชันสำหรับแสดงข้อความสถานะ
    function showMessage(message, type = 'info') {
        responseMessageDOM.textContent = message;
        responseMessageDOM.className = `message ${type}`;
        responseMessageDOM.style.display = 'block'; // ให้แน่ใจว่าแสดงผล
        setTimeout(() => {
            responseMessageDOM.style.display = 'none'; // ซ่อนหลังจาก 3 วินาที
        }, 3000);
    }

    // โหลดข้อมูลสูตรอาหารหากอยู่ในโหมดแก้ไข
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
        mode = 'EDIT';
        recipeId = idFromUrl;
        formHeader.textContent = 'แก้ไขสูตรอาหาร';
        pageTitle.textContent = 'แก้ไขสูตรอาหาร';
        submitButton.textContent = 'บันทึกการแก้ไข';

        try {
            const response = await axios.get(`http://localhost:8000/recipes/${recipeId}`);
            const recipeData = response.data;

            // ตรวจสอบว่าเป็นเจ้าของสูตรหรือไม่
            if (recipeData.user_id !== currentUser.id) {
                alert('คุณไม่มีสิทธิ์แก้ไขสูตรอาหารนี้');
                window.location.href = 'index.html';
                return;
            }

            // Populate form fields
            recipeIdInput.value = recipeData.id;
            recipeNameInput.value = recipeData.name;
            recipeImageInput.value = recipeData.image_food || recipeData.image; // ใช้ image_food หรือ image
            recipeIngredientsInput.value = recipeData.ingredients;
            recipeInstructionsInput.value = recipeData.instructions;

            // เลือก radio button สำหรับเวลา
            recipeTimeRadios.forEach(radio => {
                if (radio.value === recipeData.time) {
                    radio.checked = true;
                }
            });

            // เลือก radio button สำหรับความยาก
            recipeDifficultyRadios.forEach(radio => {
                if (radio.value === recipeData.difficulty) {
                    radio.checked = true;
                }
            });

        } catch (error) {
            console.error('Error fetching recipe for edit:', error.response ? error.response.data : error.message);
            showMessage('ไม่สามารถโหลดข้อมูลสูตรอาหารเพื่อแก้ไขได้', 'danger');
            // ถ้าเกิด error ในการโหลดข้อมูล อาจจะ redirect กลับไปหน้าหลัก
            // window.location.href = 'index.html';
        }
    }

    // Event Listener สำหรับการส่งฟอร์ม (Add/Edit)
    recipeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // ป้องกันการ reload หน้า

        const recipeData = {
            name: recipeNameInput.value,
            image_food: recipeImageInput.value,
            ingredients: recipeIngredientsInput.value,
            instructions: recipeInstructionsInput.value,
            time: document.querySelector('input[name="time"]:checked')?.value || '', // ใช้ optional chaining
            difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || ''
        };

        // ตรวจสอบข้อมูลเบื้องต้นก่อนส่ง (Client-side validation)
        if (!recipeData.name || !recipeData.image_food || !recipeData.ingredients || !recipeData.instructions || !recipeData.time || !recipeData.difficulty) {
            showMessage('กรุณากรอกข้อมูลให้ครบถ้วน', 'danger');
            return;
        }

        try {
            let response;
            if (mode === 'ADD') {
                response = await axios.post('http://localhost:8000/recipes', recipeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showMessage('เพิ่มสูตรอาหารเรียบร้อยแล้ว!', 'success');
            } else { // mode === 'EDIT'
                response = await axios.put(`http://localhost:8000/recipes/${recipeId}`, recipeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showMessage('บันทึกการแก้ไขสูตรอาหารเรียบร้อยแล้ว!', 'success');
            }

            console.log('Response:', response.data);
            setTimeout(() => {
                window.location.href = 'index.html'; // กลับไปหน้าหลักหลังจากสำเร็จ
            }, 1500); // หน่วงเวลาเล็กน้อยเพื่อให้เห็นข้อความ
            
        } catch (error) {
            console.error('Error submitting recipe:', error.response ? error.response.data : error.message);
            let errorMessage = 'เกิดข้อผิดพลาดในการดำเนินการ';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }

            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                errorMessage = 'คุณไม่มีสิทธิ์ดำเนินการนี้ หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
            showMessage(errorMessage, 'danger');
        }
    });

    // Event Listener สำหรับปุ่มยกเลิก
    cancelButton.addEventListener('click', () => {
        window.location.href = 'index.html'; // กลับไปหน้าหลัก
    });
});