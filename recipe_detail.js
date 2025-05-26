// public/recipe_detail.js
import { getTimeLabel } from './utils.js'; // ดึงฟังก์ชัน getTimeLabel มาใช้

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    const recipeDetailContainer = document.getElementById('recipe-detail-container');

    if (!recipeId) {
        recipeDetailContainer.innerHTML = '<p>ไม่พบ ID ของสูตรอาหาร</p>';
        return;
    }

    try {
        // ไม่ต้องส่ง token เพราะ GET /recipes/:id ไม่ต้องการ authentication
        const response = await axios.get(`http://localhost:8000/recipes/${recipeId}`);
        const recipe = response.data;

        if (!recipe) {
            recipeDetailContainer.innerHTML = '<p>ไม่พบสูตรอาหารนี้</p>';
            return;
        }

        // แสดงรายละเอียดสูตรอาหาร
        recipeDetailContainer.innerHTML = `
            <div class="detail-card">
                <img src="${recipe.image_food || recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${recipe.name}">
                <h2>${recipe.name}</h2>
                <p><strong>วัตถุดิบ:</strong> ${recipe.ingredients}</p>
                <p><strong>ขั้นตอนการทำ:</strong> ${recipe.instructions}</p>
                <p><strong>ระยะเวลาปรุงอาหาร:</strong> ${getTimeLabel(recipe.time)}</p>
                <p><strong>ความยาก:</strong> ${recipe.difficulty}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        recipeDetailContainer.innerHTML = '<p>เกิดข้อผิดพลาดในการดึงข้อมูลสูตรอาหาร</p>';
    }
});
