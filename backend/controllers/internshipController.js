const internshipData = require('../data/internships.json');

// Get all internships with optional filters
const getAllInternships = (req, res) => {
  try {
    const { sector, state, company, location } = req.query;
    
    let filteredInternships = internshipData.internships;

    // Filter by sector
    if (sector) {
      filteredInternships = filteredInternships.filter(internship =>
        internship.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }

    // Filter by state
    if (state) {
      filteredInternships = filteredInternships.filter(internship =>
        internship.location.toLowerCase().includes(state.toLowerCase())
      );
    }

    // Filter by location
    if (location) {
      filteredInternships = filteredInternships.filter(internship =>
        internship.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by company
    if (company) {
      filteredInternships = filteredInternships.filter(internship =>
        internship.company.toLowerCase().includes(company.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: filteredInternships.length,
      data: filteredInternships
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching internships',
      message: error.message
    });
  }
};

// Get single internship by ID
const getInternshipById = (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = internshipData.internships.find(
      int => int.id === parseInt(id)
    );

    if (!internship) {
      return res.status(404).json({
        success: false,
        error: 'Internship not found',
        id: id
      });
    }

    res.json({
      success: true,
      data: internship
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching internship',
      message: error.message
    });
  }
};

// Search internships by keyword
const searchInternships = (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchTerm = q.toLowerCase();

    const results = internshipData.internships.filter(internship =>
      internship.company.toLowerCase().includes(searchTerm) ||
      internship.role.toLowerCase().includes(searchTerm) ||
      internship.sector.toLowerCase().includes(searchTerm) ||
      internship.location.toLowerCase().includes(searchTerm) ||
      internship.skills.toLowerCase().includes(searchTerm) ||
      internship.requirements.toLowerCase().includes(searchTerm)
    );

    res.json({
      success: true,
      count: results.length,
      query: q,
      data: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error searching internships',
      message: error.message
    });
  }
};

// Get internships by sector
const getInternshipsBySector = (req, res) => {
  try {
    const { sector } = req.params;

    if (!sector) {
      return res.status(400).json({
        success: false,
        error: 'Sector parameter is required'
      });
    }

    const results = internshipData.internships.filter(internship =>
      internship.sector.toLowerCase() === sector.toLowerCase()
    );

    res.json({
      success: true,
      sector: sector,
      count: results.length,
      data: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching sector internships',
      message: error.message
    });
  }
};

// Get all available sectors
const getAllSectors = (req, res) => {
  try {
    const sectors = [...new Set(internshipData.internships.map(int => int.sector))];
    
    res.json({
      success: true,
      count: sectors.length,
      data: sectors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching sectors',
      message: error.message
    });
  }
};

// Get all available locations
const getAllLocations = (req, res) => {
  try {
    const locations = [...new Set(internshipData.internships.map(int => int.location))];
    
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching locations',
      message: error.message
    });
  }
};

module.exports = {
  getAllInternships,
  getInternshipById,
  searchInternships,
  getInternshipsBySector,
  getAllSectors,
  getAllLocations
};
