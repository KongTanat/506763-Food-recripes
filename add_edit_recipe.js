// add_edit_recipe.js

// Import ฟังก์ชันจาก utils.js
import { getToken, getUser } from './ex.js';

let responseMessageDOM = null; // Declare it globally or within DOMContentLoaded scope

document.addEventListener('DOMContentLoaded', async () => {
    // Elements จากฟอร์ม
    const recipeForm = document.getElementById('recipe-form');
    const recipeIdInput = document.getElementById('recipe-id'); // Hidden input สำหรับเก็บ ID ของสูตรอาหาร (ถ้าเป็นการแก้ไข)
    const recipeNameInput = document.getElementById('recipe-name');
    const recipeIngredientsInput = document.getElementById('recipe-ingredients');
    const recipeInstructionsInput = document.getElementById('recipe-instructions');
    const recipeTimeSelect = document.getElementById('recipe-time');
    const recipeDifficultySelect = document.getElementById('recipe-difficulty');
    const recipeImageInput = document.getElementById('recipe-image');
    const formTitle = document.getElementById('form-title'); // หัวข้อฟอร์ม (เช่น เพิ่มสูตรอาหาร / แก้ไขสูตรอาหาร)
    const submitButton = document.getElementById('submit-button'); // ปุ่ม Submit

    responseMessageDOM = document.getElementById('response-message'); // Initialize it here

    // Function to display messages
    function showMessage(message, type = 'info') {
        if (responseMessageDOM) {
            responseMessageDOM.textContent = message;
            responseMessageDOM.style.padding = '10px';
            responseMessageDOM.style.marginBottom = '10px';
            responseMessageDOM.style.color = 'white';
            responseMessageDOM.style.fontWeight = 'bold';
            responseMessageDOM.style.borderRadius = '5px';

            if (type === 'success') {
                responseMessageDOM.style.backgroundColor = '#28a745'; // Green
            } else if (type === 'error') {
                responseMessageDOM.style.backgroundColor = '#dc3545'; // Red
            } else {
                responseMessageDOM.style.backgroundColor = '#007bff'; // Blue (info)
            }
            responseMessageDOM.style.display = 'block'; // Ensure it's visible
            setTimeout(() => {
                responseMessageDOM.textContent = '';
                responseMessageDOM.style.backgroundColor = 'transparent';
                responseMessageDOM.style.padding = '0';
                responseMessageDOM.style.marginBottom = '0';
                responseMessageDOM.style.display = 'none'; // Hide after some time
            }, 5000); // Hide after 5 seconds
        } else {
            // Fallback to alert if DOM element is not found
            alert(message);
        }
    }


    const currentUser = getUser();
    const token = getToken();

    // ตรวจสอบสถานะการ Login
    if (!currentUser || !token) {
        showMessage('กรุณาเข้าสู่ระบบเพื่อเพิ่มหรือแก้ไขสูตรอาหาร', 'error');
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirect กลับไปหน้าหลัก
        }, 2000); // Give time for message to be seen
        return;
    }

    // ตรวจสอบว่าเป็นการแก้ไขหรือเพิ่มสูตรอาหารใหม่
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (recipeId) {
        // ถ้ามี ID ใน URL แสดงว่าเป็นการแก้ไขสูตรอาหาร
        formTitle.textContent = 'แก้ไขสูตรอาหาร';
        submitButton.textContent = 'บันทึกการแก้ไข';
        recipeIdInput.value = recipeId;
        await fetchRecipeForEdit(recipeId, token);
    } else {
        // ถ้าไม่มี ID แสดงว่าเป็นการเพิ่มสูตรอาหารใหม่
        formTitle.textContent = 'เพิ่มสูตรอาหารใหม่';
        submitButton.textContent = 'เพิ่มสูตรอาหาร';
    }

    // ฟังก์ชันสำหรับดึงข้อมูลสูตรอาหารเพื่อแก้ไข
    async function fetchRecipeForEdit(id, token) {
        try {
            const response = await axios.get(`http://localhost:8000/recipes/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const recipe = response.data;

            // ตรวจสอบสิทธิ์การแก้ไข (เฉพาะเจ้าของสูตร)
            if (recipe.user_id !== currentUser.id) {
                showMessage('คุณไม่ได้รับอนุญาตให้แก้ไขสูตรอาหารนี้', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            // เติมข้อมูลลงในฟอร์ม
            recipeNameInput.value = recipe.name;
            recipeIngredientsInput.value = recipe.ingredients;
            recipeInstructionsInput.value = recipe.instructions;
            recipeTimeSelect.value = recipe.time;
            recipeDifficultySelect.value = recipe.difficulty;
            recipeImageInput.value = recipe.image_food || recipe.image; // ใช้ image_food หรือ image ตามคอลัมน์ใน DB

        } catch (error) {
            console.error('Error fetching recipe for edit:', error.response ? error.response.data : error.message);
            showMessage('ไม่สามารถดึงข้อมูลสูตรอาหารเพื่อแก้ไขได้', 'error');
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect กลับหน้าหลักหากเกิดข้อผิดพลาด
            }, 2000);
        }
    }

    // Event Listener สำหรับการ Submit ฟอร์ม
    recipeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // ป้องกันการ reload หน้า

        // --- เพิ่มการตรวจสอบข้อมูลที่นี่ ---
        if (!recipeNameInput.value.trim() ||
            !recipeIngredientsInput.value.trim() ||
            !recipeInstructionsInput.value.trim() ||
            !recipeTimeSelect.value ||
            !recipeDifficultySelect.value) {
            showMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error'); // ข้อความแจ้งเตือน
            return; // หยุดการทำงานถ้าข้อมูลไม่ครบ
        }
        // --- สิ้นสุดการตรวจสอบข้อมูล ---

        const recipeData = {
            name: recipeNameInput.value.trim(),
            ingredients: recipeIngredientsInput.value.trim(),
            instructions: recipeInstructionsInput.value.trim(),
            time: recipeTimeSelect.value,
            difficulty: recipeDifficultySelect.value,
            image_food: recipeImageInput.value.trim(), // image_food ไม่ได้ required
        };

        try {
            let response;
            if (recipeId) {
                // ถ้ามี recipeId คือการแก้ไข (PUT)
                response = await axios.put(`http://localhost:8000/recipes/${recipeId}`, recipeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showMessage('บันทึกการแก้ไขสูตรอาหารสำเร็จ!', 'success');
            } else {
                // ถ้าไม่มี recipeId คือการเพิ่มใหม่ (POST)
                response = await axios.post('http://localhost:8000/recipes', recipeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showMessage('เพิ่มสูตรอาหารใหม่สำเร็จ!', 'success');
            }
            setTimeout(() => {
                window.location.href = 'index.html'; // กลับไปหน้าหลักเมื่อสำเร็จ
            }, 2000); // Give time for message to be seen
        } catch (error) {
            console.error('Error saving recipe:', error.response ? error.response.data : error.message);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                showMessage('คุณไม่ได้รับอนุญาตให้ดำเนินการ (เซสชันหมดอายุหรือไม่ใช่เจ้าของสูตร) กรุณาเข้าสู่ระบบใหม่', 'error');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showMessage('เกิดข้อผิดพลาดในการบันทึกสูตรอาหาร: ' + (error.response ? error.response.data.error || error.response.data.message : error.message), 'error');
            }
        }
    });
});
