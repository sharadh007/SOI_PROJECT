const express = require('express');
const router = express.Router();
const internshipData = require('../data/internships.json');

// Get all internships
router.get('/', (req, res) => {
  try {
    const { sector, state, company } = req.query;
    
    let filteredInternships = internshipData.internships;

    if (sector) {
      filteredInternships = filteredInternships.filter(
        int => int.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }

    if (state) {
      filteredInternships = filteredInternships.filter(
        int => int.state.toLowerCase() === state.toLowerCase()
      );
    }

    if (company) {
      filteredInternships = filteredInternships.filter(
        int => int.company.toLowerCase().includes(company.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: filteredInternships.length,
      data: filteredInternships
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single internship by ID
router.get('/:id', (req, res) => {
  try {
    const internship = internshipData.internships.find(
      int => int.id === req.params.id
    );

    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }

    res.json({ success: true, data: internship });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search internships
router.get('/search/query', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter required' 
      });
    }

    const results = internshipData.internships.filter(int =>
      int.company.toLowerCase().includes(q.toLowerCase()) ||
      int.jobTitle.toLowerCase().includes(q.toLowerCase()) ||
      int.sector.toLowerCase().includes(q.toLowerCase())
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
