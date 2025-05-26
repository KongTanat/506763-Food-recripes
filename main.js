
import { getTimeLabel, getToken, getUser } from './ex.js';

let recipes = []; // ตัวแปรเก็บข้อมูลสูตรอาหารทั้งหมด
let currentUser = null; // ตัวแปรเก็บข้อมูลผู้ใช้ที่ Login อยู่
let currentToken = null; // เพิ่มตัวแปรสำหรับเก็บ token ล่าสุด

document.addEventListener('DOMContentLoaded', async () => {
    // ดึงข้อมูลผู้ใช้และ Token เมื่อหน้าโหลด
    currentUser = getUser();
    currentToken = getToken(); // ใช้ currentToken แทน token

    // Elements
    const loginContainer = document.getElementById('login-container');
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const searchButton = document.getElementById('search-button');
    const recipeListContainer = document.getElementById('recipe-list');
    const editRecipeSection = document.getElementById('edit-recipe-section'); // ส่วนแก้ไขใน index.html (ถ้ายังใช้)
    const editRecipeForm = document.getElementById('edit-recipe-form'); // ฟอร์มแก้ไขใน index.html (ถ้ายังใช้)
    const cancelButton = document.getElementById('cancel-button'); // ปุ่มยกเลิกในฟอร์มแก้ไข (ถ้ายังใช้)
    const logoutButton = document.getElementById('logout-button');
    const userActionsContainer = document.getElementById('user-actions-container');
    const editInstructionsInput = document.getElementById('edit-instructions'); // เพิ่ม element สำหรับ instructions ในฟอร์มแก้ไข

    // --- UI Visibility Control Functions ---
    function showLoggedInUI() {
        if (loginContainer) loginContainer.style.display = 'none'; // ซ่อนส่วน Login
        if (userActionsContainer) userActionsContainer.style.display = 'flex'; // แสดงส่วนปุ่มสำหรับผู้ใช้ที่ Login แล้ว
        // ส่วนการค้นหาและรายการสูตรอาหารจะแสดงอยู่เสมอ
        if (document.getElementById('search-section')) document.getElementById('search-section').style.display = 'block';
        if (document.getElementById('recipe-list-section')) document.getElementById('recipe-list-section').style.display = 'block';
    }

    function showLoggedOutUI() {
        if (loginContainer) loginContainer.style.display = 'flex'; // แสดงส่วน Login
        if (userActionsContainer) userActionsContainer.style.display = 'none'; // ซ่อนส่วนปุ่มสำหรับผู้ใช้ที่ Login แล้ว
        // ส่วนการค้นหาและรายการสูตรอาหารจะแสดงอยู่เสมอ
        if (document.getElementById('search-section')) document.getElementById('search-section').style.display = 'block';
        if (document.getElementById('recipe-list-section')) document.getElementById('recipe-list-section').style.display = 'block';
    }

    function hideAllSectionsExceptEdit() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (userActionsContainer) userActionsContainer.style.display = 'none';
        if (document.getElementById('search-section')) document.getElementById('search-section').style.display = 'none';
        if (document.getElementById('recipe-list-section')) document.getElementById('recipe-list-section').style.display = 'none';
        editRecipeSection.style.display = 'block'; // แสดงเฉพาะส่วนแก้ไข
    }

    // ตรวจสอบสถานะการ Login และแสดง/ซ่อน UI ที่เกี่ยวข้องตั้งแต่โหลดหน้า
    if (currentUser && currentToken) { // ใช้ currentToken
        console.log('Logged in as:', currentUser.username, 'ID:', currentUser.id);
        showLoggedInUI();
    } else {
        console.log('User not logged in.');
        showLoggedOutUI();
    }

    // Function to fetch recipes from the server
    async function fetchRecipes() {
        try {
            // ส่ง currentToken ไปด้วยในกรณีที่ต้องการข้อมูลส่วนตัว (เช่น คะแนนที่ผู้ใช้เคยให้)
            const headers = currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}; // ใช้ currentToken
            const response = await axios.get('http://localhost:8000/recipes', { headers });
            recipes = response.data;
            renderRecipeList(recipes); // Render recipes based on current login status
        } catch (error) {
            console.error('Error fetching recipes:', error);
            alert('Failed to fetch recipes. Please check the server or try again later.');
        }
    }

    // Initial fetch of recipes when page loads
    await fetchRecipes();

    // --- Event Listeners ---

    // Event listener for Login button
    if (loginButton && usernameInput && passwordInput) {
        loginButton.addEventListener('click', async () => {
            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await axios.post('http://localhost:8000/login', { username, password });
                const data = response.data;

                if (data.message === 'Login successful') {
                    alert('เข้าสู่ระบบสำเร็จ!');
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    currentUser = data.user; // อัปเดต currentUser
                    currentToken = data.token; // อัปเดต currentToken
                    showLoggedInUI();
                    await fetchRecipes(); // โหลดสูตรอาหารใหม่ (เพื่อแสดงปุ่มแก้ไข/ลบ/ส่วนให้คะแนน)
                } else {
                    alert('เข้าสู่ระบบล้มเหลว: ' + data.message);
                }
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error.response ? error.response.data : error.message);
                alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        });
    }

    // Event listener for search button
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const nameQuery = document.getElementById('search-name').value.toLowerCase();
            const ingredientsQuery = document.getElementById('search-ingredients').value.toLowerCase().split(',').map(item => item.trim());
            const timeQuery = document.getElementById('search-time').value;
            const difficultyQuery = document.getElementById('search-difficulty').value.toLowerCase();

            const filteredRecipes = recipes.filter(recipe => {
                const nameMatch = recipe.name && recipe.name.toLowerCase().includes(nameQuery);
                const ingredientsMatch = ingredientsQuery.every(query =>
                    query === '' || (recipe.ingredients && typeof recipe.ingredients === 'string' && recipe.ingredients.toLowerCase().includes(query))
                );
                const timeMatch = timeQuery === '' || (recipe.time && recipe.time === timeQuery);
                const difficultyMatch = difficultyQuery === '' || (recipe.difficulty && recipe.difficulty.toLowerCase() === difficultyQuery);

                return nameMatch && ingredientsMatch && timeMatch && difficultyMatch;
            });

            renderRecipeList(filteredRecipes);
        });
    }

    // Event listener for Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            currentUser = null;
            currentToken = null; // ตั้งค่า currentToken เป็น null
            alert('ออกจากระบบเรียบร้อยแล้ว');
            showLoggedOutUI();
            fetchRecipes(); // โหลดสูตรอาหารใหม่ (เพื่อซ่อนปุ่มแก้ไข/ลบ และแสดงส่วน Login)
        });
    }

    // Event listener for Edit Form Cancel button (ถ้ายังใช้ใน index.html)
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            editRecipeSection.style.display = 'none';
            showLoggedInUI();
        });
    }

    // Event listener for Edit Form Submit (ถ้ายังใช้ใน index.html)
    if (editRecipeForm) {
        editRecipeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const recipeId = document.getElementById('edit-id').value;
            const updatedRecipeData = {
                name: document.getElementById('edit-name').value,
                ingredients: document.getElementById('edit-ingredients').value,
                instructions: editInstructionsInput.value,
                time: document.getElementById('edit-time').value,
                difficulty: document.getElementById('edit-difficulty').value,
                image_food: document.getElementById('edit-image').value,
            };

            const tokenToSend = getToken(); // ดึง token ล่าสุดก่อนส่ง
            const userToSend = getUser(); // ดึง user ล่าสุดก่อนส่ง

            if (!tokenToSend || !userToSend || !userToSend.id) {
                alert('กรุณาเข้าสู่ระบบก่อนแก้ไขสูตรอาหาร');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showLoggedOutUI();
                return;
            }

            try {
                const response = await axios.put(`http://localhost:8000/recipes/${recipeId}`, updatedRecipeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenToSend}` // ใช้ token ล่าสุด
                    }
                });

                if (response.status === 200) {
                    alert('Recipe updated successfully!');
                    await fetchRecipes();
                    editRecipeSection.style.display = 'none';
                    showLoggedInUI();
                } else {
                    alert('Failed to update recipe.');
                }
            } catch (error) {
                console.error('Error updating recipe:', error.response ? error.response.data : error.message);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    alert('คุณไม่ได้รับอนุญาตให้แก้ไขสูตรอาหารนี้ (อาจไม่ใช่เจ้าของสูตร) หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    showLoggedOutUI();
                } else {
                    alert('เกิดข้อผิดพลาดในการอัปเดตสูตรอาหาร: ' + (error.response ? error.response.data.error || error.response.data.message : error.message));
                }
            }
        });
    }

    // --- Render Functions ---

    function renderRecipeList(recipeList) {
        recipeListContainer.innerHTML = '';
        if (recipeList.length === 0) {
            recipeListContainer.innerHTML = '<p>ไม่พบสูตรอาหารที่ตรงกับเงื่อนไข</p>';
            return;
        }

        recipeList.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');

            const image = document.createElement('img');
            image.src = recipe.image_food || recipe.image || 'https://via.placeholder.com/300x200?text=No+Image';
            image.alt = recipe.name;

            const content = document.createElement('div');
            content.classList.add('recipe-card-content');

            const title = document.createElement('h3');
            title.textContent = recipe.name;

            const ingredients = document.createElement('p');
            ingredients.textContent = `วัตถุดิบ: ${recipe.ingredients ? (typeof recipe.ingredients === 'string' ? recipe.ingredients.substring(0, 50) + (recipe.ingredients.length > 50 ? '...' : '') : recipe.ingredients.slice(0, 3).join(', ') + '...') : '-'}`;

            const time = document.createElement('p');
            time.textContent = `เวลา: ${getTimeLabel(recipe.time)}`;

            const difficulty = document.createElement('p');
            difficulty.textContent = `ความยาก: ${recipe.difficulty}`;

            content.appendChild(title);
            content.appendChild(ingredients);
            content.appendChild(time);
            content.appendChild(difficulty);

            // --- ส่วนแสดงคะแนนเฉลี่ย ---
            const ratingDisplay = document.createElement('div');
            ratingDisplay.classList.add('recipe-card-rating');
            const averageScore = recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'ยังไม่มีคะแนน';
            const fullStars = Math.floor(parseFloat(recipe.average_rating || 0));
            const emptyStars = 5 - fullStars;
            let starIcons = '⭐'.repeat(fullStars);
            starIcons += '☆'.repeat(emptyStars);

            ratingDisplay.innerHTML = `คะแนน: <span class="stars">${starIcons}</span> (${averageScore} / 5)`;
            content.appendChild(ratingDisplay);

            // --- ส่วนให้คะแนน (แสดงเฉพาะสมาชิกที่ Login และไม่ใช่เจ้าของสูตร) ---
            if (currentUser && recipe.user_id !== currentUser.id) {
                const ratingInputContainer = document.createElement('div');
                ratingInputContainer.classList.add('rating-input');

                const ratingSelect = document.createElement('select');
                ratingSelect.innerHTML = `
                    <option value="">ให้คะแนน</option>
                    <option value="1">1 ดาว</option>
                    <option value="2">2 ดาว</option>
                    <option value="3">3 ดาว</option>
                    <option value="4">4 ดาว</option>
                    <option value="5">5 ดาว</option>
                `;
                if (recipe.user_has_rated && recipe.user_rating) {
                    ratingSelect.value = recipe.user_rating;
                }

                const submitRatingButton = document.createElement('button');
                submitRatingButton.textContent = 'ส่งคะแนน';
                submitRatingButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const score = ratingSelect.value;
                    if (score) {
                        await submitRating(recipe.id, score); // ไม่ต้องส่ง token แล้ว ให้ submitRating ดึงเอง
                    } else {
                        alert('กรุณาเลือกคะแนน');
                    }
                });

                ratingInputContainer.appendChild(ratingSelect);
                ratingInputContainer.appendChild(submitRatingButton);
                content.appendChild(ratingInputContainer);
            }

            // แสดงปุ่มแก้ไข/ลบ เฉพาะเมื่อผู้ใช้ Login และเป็นเจ้าของสูตร
            if (currentUser && recipe.user_id === currentUser.id) {
                const buttonGroup = document.createElement('div');
                buttonGroup.classList.add('recipe-card-buttons');

                const editButton = document.createElement('button');
                editButton.textContent = 'แก้ไข';
                editButton.classList.add('edit-button');
                editButton.dataset.recipeId = recipe.id;
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `add_edit_recipe.html?id=${recipe.id}`;
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'ลบ';
                deleteButton.classList.add('delete-button');
                deleteButton.dataset.recipeId = recipe.id;
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteRecipe(recipe.id)
                });

                buttonGroup.appendChild(editButton);
                buttonGroup.appendChild(deleteButton);
                content.appendChild(buttonGroup);
            }
 // เพิ่ม Event Listener ให้กับการ์ดทั้งหมด
            recipeCard.addEventListener('click', () => {
            window.location.href = `recipe_detail.html?id=${recipe.id}`;
                });
            recipeCard.appendChild(image);
            recipeCard.appendChild(content);
            recipeListContainer.appendChild(recipeCard);
        });
    }

    // --- Submit Rating Functionality ---
    async function submitRating(recipeId, score) { // ลบ token ออกจาก parameter
        const tokenToSend = getToken(); // ดึง token ล่าสุดก่อนส่ง
        console.log('Token being sent for rating:', tokenToSend); // เพิ่ม log เพื่อ debug
        console.log('Type of token being sent:', typeof tokenToSend); // เพิ่ม log เพื่อ debug

        if (!tokenToSend) { // ตรวจสอบ token
            console.error('No token found. Please login first.');
            alert('คุณไม่ได้รับอนุญาตให้ให้คะแนน (เซสชันหมดอายุ) กรุณาเข้าสู่ระบบใหม่');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showLoggedOutUI();
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/ratings', {
                recipe_id: recipeId,
                score: parseInt(score)
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenToSend}` // ใช้ token ล่าสุด
                }
            });
            alert(response.data.message);
            await fetchRecipes(); // รีโหลดสูตรอาหารเพื่ออัปเดตคะแนน
        } catch (error) {
            console.error('Error submitting rating:', error.response ? error.response.data : error.message);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                alert('คุณไม่ได้รับอนุญาตให้ให้คะแนน (เซสชันหมดอายุ) กรุณาเข้าสู่ระบบใหม่');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showLoggedOutUI();
            } else {
                alert('เกิดข้อผิดพลาดในการส่งคะแนน: ' + (error.response ? error.response.data.error || error.response.data.message : error.message));
            }
        }
    }


    // --- Delete Recipe Functionality ---
    async function deleteRecipe(recipeId) {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสูตรอาหารนี้?')) {
            return;
        }

        const tokenToSend = getToken(); // ดึง token ล่าสุดก่อนส่ง
        const userToSend = getUser(); // ดึง user ล่าสุดก่อนส่ง

        if (!tokenToSend || !userToSend || !userToSend.id) {
            alert('กรุณาเข้าสู่ระบบก่อนลบสูตรอาหาร');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showLoggedOutUI();
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:8000/recipes/${recipeId}`, {
                headers: {
                    'Authorization': `Bearer ${tokenToSend}` // ใช้ token ล่าสุด
                }
            });

            if (response.status === 200) {
                alert('Recipe deleted successfully!');
                await fetchRecipes();
            } else {
                alert('Failed to delete recipe.');
            }
        } catch (error) {
            console.error('Error deleting recipe:', error.response ? error.response.data : error.message);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                alert('คุณไม่ได้รับอนุญาตให้ลบสูตรอาหารนี้ (อาจไม่ใช่เจ้าของสูตร) หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showLoggedOutUI();
            } else {
                alert('เกิดข้อผิดพลาดในการลบสูตรอาหาร: ' + (error.response ? error.response.data.error || error.response.data.message : error.message));
            }
        }
    }
});
