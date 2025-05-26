    const express = require('express')
    const app = express()
    const bodyParser = require('body-parser')
    const cors = require('cors')
    const mysql = require('mysql2/promise')
    const jwt = require('jsonwebtoken')
    const path = require('path'); // เพิ่มโมดูล path สำหรับการจัดการไฟล์ static

    app.use(express.json())
    app.use(cors())

    const port = 8000

    let conn = null
    const JWT_SECRET = 'your_super_secret_key_for_jwt_example' // *** ควรเก็บใน Environment Variable ***

    const initMySQL = async () => {
        try {
            conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'root', // *** ไม่ควรใช้รหัสผ่าน root ใน Production ***
                database: 'menuhit',
                port: 3306
            })
            console.log('Connected to MySQL database!');
        } catch (error) {
            console.error('Failed to connect to MySQL:', error.message);
            process.exit(1);
        }
    }

    // Middleware สำหรับตรวจสอบ Token (JWT)
    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        console.log('Backend - authenticateToken - Incoming Authorization Header:', authHeader); // เพิ่ม Log
        console.log('Backend - authenticateToken - Extracted Token:', token); // เพิ่ม Log

        if (token == null) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Backend - authenticateToken - Token verification error:', err.message); // เพิ่ม Log
                console.error('Backend - authenticateToken - Token verification error details:', err); // เพิ่ม Log รายละเอียด error
                return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
            }
            req.user = user;
            console.log('Backend - authenticateToken - Token decoded successfully for userId:', user.id); // เพิ่ม Log
            next();
        })
    }

    // --- User Management Routes ---
    app.get('/users', async (req, res) => {
        try {
            let results = await conn.query('SELECT * FROM user')
            res.json(results[0])
        } catch (error) {
            console.error('Error fetching users:', error.message)
            res.status(500).json({ error: 'Error fetching users' })
        }
    })

    app.post('/users', async (req, res) => {
        const data = req.body
        try {
            // *** ควร Hash รหัสผ่านด้วย bcrypt ก่อนบันทึก ***
            const result = await conn.query('INSERT INTO user SET ?', data)
            const userId = result[0].insertId
            res.status(201).json({ message: 'User created successfully', userId })
        } catch (error) {
            console.error('Error creating user:', error.message)
            res.status(500).json({ error: 'Error creating user' })
        }
    })

    app.get('/users/:id', async (req, res) => {
        const id = req.params.id
        try {
            let [results] = await conn.query('SELECT * FROM user WHERE id = ?', [id])
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' })
            }
            res.json(results[0])
        } catch (error) {
            console.error('Error fetching user:', error.message)
            res.status(500).json({ error: 'Error fetching user' })
        }
    })

    app.put('/users/:id', async (req, res) => {
        const id = req.params.id
        const data = req.body
        try {
            const result = await conn.query('UPDATE user SET ? WHERE id = ?', [data, id])
            if (result[0].affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' })
            }
            res.json({ message: 'User updated successfully', userId: id })
        }  catch (error) {
            console.error('Error updating user:', error.message)
            res.status(500).json({ error: 'Error updating user' })
        }
    })

    app.delete('/users/:id', async (req, res) => {
        const id = req.params.id
        try {
            const result = await conn.query('DELETE FROM user WHERE id = ?', [id])
            if (result[0].affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' })
            }
            res.json({ message: 'User deleted successfully', userId: id })
        } catch (error) {
            console.error('Error deleting user:', error.message)
            res.status(500).json({ error: 'Error deleting user' })
        }
    })

    // --- Login Route ---
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const [results] = await conn.query('SELECT * FROM user WHERE username = ?', [username]);
            const user = results[0];

            if (!user) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // *** ควรเปรียบเทียบรหัสผ่านที่ Hash ไว้ด้วย bcrypt.compare() ***
            if (password === user.password) {
                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
                console.log('Backend - Login successful, new token issued:', token); // เพิ่ม Log
                return res.status(200).json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
            } else {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error during login:', error.message);
            res.status(500).json({ error: 'Login error' });
        }
    });

    // --- Recipe Management Routes ---

    // ดึงข้อมูลสูตรอาหารทั้งหมด พร้อมคะแนนเฉลี่ยและคะแนนที่ผู้ใช้เคยให้ (ถ้า Login)
    app.get('/recipes', async (req, res) => {
        // ดึง Token จาก Header เพื่อตรวจสอบว่าผู้ใช้ Login หรือไม่ (แต่ไม่บังคับ)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;

        console.log('Backend - GET /recipes - Incoming Authorization Header:', authHeader); // เพิ่ม Log
        console.log('Backend - GET /recipes - Extracted Token:', token); // เพิ่ม Log

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id; // ดึง ID ผู้ใช้จาก Token ที่ถอดรหัสแล้ว
                console.log('Backend - GET /recipes - Token decoded successfully for userId:', userId); // เพิ่ม Log
            } catch (err) {
                console.warn('Backend - GET /recipes - Invalid token for fetching recipes, proceeding as guest:', err.message); // Existing log
                console.warn('Backend - GET /recipes - Token verification error details:', err); // เพิ่ม Log รายละเอียด error
                // ถ้า Token ไม่ถูกต้อง ก็ถือว่าเป็น Guest ไป
            }
        }

        try {
            // Query เพื่อดึงสูตรอาหารทั้งหมด พร้อมคะแนนเฉลี่ยจากตาราง ratings (มีการ JOIN และ AVG เพิ่มเข้ามา)
            const [recipes] = await conn.query(`
                SELECT
                    r.*,
                    AVG(rt.score) AS average_rating
                FROM
                    recipes r
                LEFT JOIN
                    ratings rt ON r.id = rt.recipe_id
                GROUP BY
                    r.id
            `);

            // ถ้าผู้ใช้ Login อยู่ ให้ดึงคะแนนที่ผู้ใช้คนนี้เคยให้สำหรับแต่ละสูตร (ส่วนที่เพิ่มเข้ามา)
            if (userId) {
                const [userRatings] = await conn.query(
                    'SELECT recipe_id, score FROM ratings WHERE user_id = ?',
                    [userId]
                );

                // สร้าง Map เพื่อให้ค้นหาคะแนนของผู้ใช้ได้ง่ายขึ้น
                const userRatingsMap = new Map();
                userRatings.forEach(rating => {
                    userRatingsMap.set(rating.recipe_id, rating.score);
                });

                // เพิ่มข้อมูล user_has_rated และ user_rating เข้าไปในแต่ละสูตรอาหาร
                recipes.forEach(recipe => {
                    if (userRatingsMap.has(recipe.id)) {
                        recipe.user_has_rated = true;
                        recipe.user_rating = userRatingsMap.get(recipe.id);
                    } else {
                        recipe.user_has_rated = false;
                        recipe.user_rating = null;
                    }
                });
            } else {
                // ถ้าไม่ได้ Login ให้ตั้งค่า user_has_rated เป็น false
                recipes.forEach(recipe => {
                    recipe.user_has_rated = false;
                    recipe.user_rating = null;
                });
            }

            res.json(recipes);
        } catch (error) {
            console.error('Error fetching recipes with ratings:', error.message);
            res.status(500).json({ error: 'Error fetching recipes with ratings' });
        }
    })

    app.post('/recipes', authenticateToken, async (req, res) => {
        const data = req.body
        const userId = req.user.id; // ดึง user ID จาก token

        try {
            const recipeData = { ...data, user_id: userId }; // เพิ่ม user_id เข้าไป
            const result = await conn.query('INSERT INTO recipes SET ?', recipeData);
            const menuId = result[0].insertId;
            res.status(201).json({ message: 'Menu created successfully', menuId });
        } catch (error) {
            console.error('Error creating recipe:', error.message);
            res.status(500).json({ error: 'Error creating recipe' });
        }
    })

    app.get('/recipes/:id', async (req, res) => {
        const id = req.params.id
        try {
            let [results] = await conn.query('SELECT * FROM recipes WHERE id = ?', [id])
            if (results.length === 0) {
                return res.status(404).json({ error: 'Menu not found' })
            }
            res.json(results[0])
        } catch (error) {
            console.error('Error fetching recipe:', error.message);
            res.status(500).json({ error: 'Error fetching recipe' });
        }
    })

    app.put('/recipes/:id', authenticateToken, async (req, res) => {
        const id = req.params.id
        const data = req.body
        const userId = req.user.id; // ผู้ใช้ที่ Login อยู่

        try {
            // ตรวจสอบว่าผู้ใช้คนนี้เป็นเจ้าของสูตรหรือไม่
            const [recipeCheck] = await conn.query('SELECT user_id FROM recipes WHERE id = ?', [id]);
            if (recipeCheck.length === 0) {
                return res.status(404).json({ error: 'Menu not found' });
            }
            if (recipeCheck[0].user_id !== userId) {
                return res.status(403).json({ message: 'Forbidden: You can only update your own recipes.' });
            }

            const result = await conn.query('UPDATE recipes SET ? WHERE id = ?', [data, id]);
            if (result[0].affectedRows === 0) {
                return res.status(404).json({ error: 'Menu not found or no changes made' });
            }
            res.json({ message: 'Menu updated successfully', menuId: id });
        } catch (error) {
            console.error('Error updating recipe:', error.message);
            res.status(500).json({ error: 'Error updating recipe' });
        }
    })

    app.delete('/recipes/:id', authenticateToken, async (req, res) => {
        const id = req.params.id
        const userId = req.user.id; // ผู้ใช้ที่ Login อยู่

        try {
            // ตรวจสอบว่าผู้ใช้คนนี้เป็นเจ้าของสูตรหรือไม่
            const [recipeCheck] = await conn.query('SELECT user_id FROM recipes WHERE id = ?', [id]);
            if (recipeCheck.length === 0) {
                return res.status(404).json({ error: 'Menu not found' });
            }
            if (recipeCheck[0].user_id !== userId) {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own recipes.' });
            }

            // ลบข้อมูลคะแนนที่เกี่ยวข้องก่อนลบสูตรอาหาร (ส่วนที่เพิ่มเข้ามา)
            await conn.query('DELETE FROM ratings WHERE recipe_id = ?', [id]);

            const result = await conn.query('DELETE FROM recipes WHERE id = ?', [id]);
            if (result[0].affectedRows === 0) {
                return res.status(404).json({ error: 'Menu not found' });
            }
            res.json({ message: 'Menu deleted successfully', userId: id });
        } catch (error) {
            console.error('Error deleting recipe:', error.message);
            res.status(500).json({ error: 'Error deleting recipe' });
        }
    });

    // --- Rating Routes ---
    // ให้คะแนนสูตรอาหาร (ต้อง Login)
    app.post('/ratings', authenticateToken, async (req, res) => {
        const { recipe_id, score } = req.body;
        const user_id = req.user.id; // ผู้ใช้ที่ Login อยู่

        if (!recipe_id || !score || !user_id) {
            return res.status(400).json({ message: 'Missing recipe_id, score, or user_id' });
        }

        if (score < 1 || score > 5) {
            return res.status(400).json({ message: 'Score must be between 1 and 5' });
        }

        try {
            // ตรวจสอบว่าผู้ใช้เป็นเจ้าของสูตรหรือไม่
            const [recipeOwner] = await conn.query('SELECT user_id FROM recipes WHERE id = ?', [recipe_id]);
            if (recipeOwner.length > 0 && recipeOwner[0].user_id === user_id) {
                return res.status(403).json({ message: 'You cannot rate your own recipe.' });
            }

            // ตรวจสอบว่าผู้ใช้เคยให้คะแนนสูตรนี้แล้วหรือไม่
            const [existingRating] = await conn.query(
                'SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?',
                [user_id, recipe_id]
            );

            if (existingRating.length > 0) {
                // ถ้าเคยให้แล้ว ให้ส่งข้อผิดพลาดว่าไม่สามารถให้คะแนนซ้ำได้ (แก้ไขตามคำขอ)
                return res.status(409).json({ message: 'You have already rated this recipe and cannot change your score.' }); // 409 Conflict
            } else {
                // ถ้ายังไม่เคยให้ ให้เพิ่มคะแนนใหม่
                await conn.query(
                    'INSERT INTO ratings (user_id, recipe_id, score) VALUES (?, ?, ?)',
                    [user_id, recipe_id, score]
                );
                res.status(201).json({ message: 'Rating submitted successfully!' });
            }
        } catch (error) {
            console.error('Error submitting rating:', error.message);
            res.status(500).json({ error: 'Error submitting rating' });
        }
    });

    // --- Static File Serving ---
    app.use(express.static(path.join(__dirname, 'public'), {
        setHeaders: (res, filePath) => {
            if (path.extname(filePath) === '.js') {
                res.setHeader('Content-Type', 'application/javascript');
            }
        }
    }));

    // Catch-all route สำหรับ Single-Page Application (SPA)
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });


    // เริ่มต้น Server
    app.listen(port, async () => {
        await initMySQL()
        console.log(`Server is running on port ${port}`)
    })
    