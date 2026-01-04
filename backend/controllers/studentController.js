const pool = require('../config/database');

const registerStudent = async (req, res) => {
  try {
    const { uid, first_name, last_name, email, phone, skills = [] } = req.body;
    
    // ✅ FILL REQUIRED FIELDS
    const name = first_name ? `${first_name} ${last_name}`.trim() : 'User';
    
    const query = `
      INSERT INTO students (uid, name, first_name, last_name, email, phone, skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7::text[])
      ON CONFLICT (uid) DO UPDATE SET
        name = $2, first_name = $3, last_name = $4, email = $5, phone = $6, skills = $7::text[],
        updated_at = CURRENT_TIMESTAMP
      RETURNING uid, first_name, last_name, email, phone, skills, name
    `;
    
    const result = await pool.query(query, [uid, name, first_name || '', last_name || '', email || '', phone || '', skills]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('🚨 ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};


const getStudentProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    console.log('Getting profile for uid:', uid); // DEBUG
    const result = await pool.query(
      'SELECT uid, first_name, last_name, email, phone, skills FROM students WHERE uid = $1',
      [uid]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const { first_name, last_name, email, phone, skills } = req.body;
    
    const query = `
      UPDATE students SET 
        first_name = $1, last_name = $2, email = $3, phone = $4, skills = $5::text[]
      WHERE uid = $6
      RETURNING uid, first_name, last_name, email, phone, skills
    `;
    
    const result = await pool.query(query, [first_name, last_name, email, phone, skills || [], uid]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteStudentProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query('DELETE FROM students WHERE uid = $1 RETURNING uid', [uid]);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  registerStudent, 
  getStudentProfile, 
  getAllStudents, 
  updateStudentProfile, 
  deleteStudentProfile 
};
