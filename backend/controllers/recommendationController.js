const matchingAlgorithm = require('../utils/matchingAlgorithm');
const internshipData = require('../data/internships.json');

// Get personalized recommendations for a student
const getRecommendations = (req, res) => {
  try {
    const {
      name,
      age,
      qualification,
      skills,
      preferredSector,
      preferredState,
      college,
      cgpa
    } = req.body;

    // Validation
    if (!name || !age || !qualification || !skills || !preferredState) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'age', 'qualification', 'skills', 'preferredState']
      });
    }

    const studentProfile = {
      name,
      age,
      qualification,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      preferredSector: preferredSector || 'Technology',
      preferredState,
      college: college || 'Not specified',
      cgpa: cgpa ? parseFloat(cgpa) : null
    };

    // Use enhanced matching algorithm
    const recommendations = matchingAlgorithm.getRankedRecommendations(
      studentProfile,
      internshipData.internships,
      5 // Get top 5 matches
    );

    res.json({
      success: true,
      studentName: name,
      recommendationCount: recommendations.length,
      recommendations: recommendations.map((rec, index) => ({
        rank: index + 1,
        id: rec.id,
        company: rec.company,
        role: rec.role,
        location: rec.location,
        sector: rec.sector,
        stipend: rec.stipend,
        duration: rec.duration,
        description: rec.description,
        matchScore: rec.matchScore,
        matchPercentage: rec.matchScore + '%',
        matchLabel: rec.matchLabel
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error generating recommendations',
      message: error.message
    });
  }
};

module.exports = {
  getRecommendations
};
