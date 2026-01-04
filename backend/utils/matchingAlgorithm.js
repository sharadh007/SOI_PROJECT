// Enhanced matching algorithm for AI-powered recommendations

// Calculate individual match scores
const calculateScores = (studentProfile, internship) => {
  const scores = {};

  // 1. Skill Matching (35%)
  scores.skillScore = calculateSkillMatch(studentProfile.skills, internship.skills);

  // 2. Qualification Matching (25%)
  scores.qualificationScore = calculateQualificationMatch(
    studentProfile.qualification,
    internship.requirements
  );

  // 3. Location Matching (15%)
  scores.locationScore = calculateLocationMatch(
    studentProfile.preferredState,
    internship.location
  );

  // 4. Age Matching (15%)
  scores.ageScore = calculateAgeMatch(studentProfile.age);

  // 5. Sector Matching (10%)
  scores.sectorScore = calculateSectorMatch(
    studentProfile.preferredSector,
    internship.sector
  );

  // 6. CGPA/Academic Performance (bonus 5%)
  scores.cgpaScore = calculateCGPAMatch(studentProfile.cgpa);

  return scores;
};

// 1. Skill Matching (35%)
const calculateSkillMatch = (studentSkills, internshipSkills) => {
  if (!studentSkills || studentSkills.length === 0) return 30;
  if (!internshipSkills || internshipSkills.length === 0) return 50;

  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  const internshipSkillsArray = internshipSkills
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);

  if (internshipSkillsArray.length === 0) return 50;

  // Find matching skills
  const matchedSkills = studentSkillsLower.filter(skill =>
    internshipSkillsArray.some(iSkill =>
      iSkill.includes(skill) ||
      skill.includes(iSkill) ||
      areSkillsSimilar(skill, iSkill)
    )
  );

  // Calculate percentage of matched skills
  const matchPercentage = (matchedSkills.length / internshipSkillsArray.length) * 100;

  return Math.min(matchPercentage, 100);
};

// Helper: Check if two skills are similar
const areSkillsSimilar = (skill1, skill2) => {
  const skillMap = {
    'javascript': ['js', 'nodejs', 'node.js'],
    'python': ['py', 'django', 'flask'],
    'java': ['j2ee', 'spring'],
    'database': ['sql', 'mysql', 'postgresql', 'nosql', 'mongodb'],
    'web development': ['frontend', 'backend', 'fullstack', 'react', 'angular'],
    'mobile': ['android', 'ios', 'flutter', 'react native'],
    'cloud': ['aws', 'azure', 'gcp', 'kubernetes'],
    'data': ['analytics', 'bigdata', 'ml', 'ai', 'machine learning']
  };

  for (const [key, values] of Object.entries(skillMap)) {
    if ((skill1 === key || values.includes(skill1)) &&
        (skill2 === key || values.includes(skill2))) {
      return true;
    }
  }

  return false;
};

// 2. Qualification Matching (25%)
const calculateQualificationMatch = (studentQual, internshipQual) => {
  const studentQualLower = studentQual.toLowerCase();
  const internshipQualLower = internshipQual.toLowerCase();

  // Exact match
  if (studentQualLower === internshipQualLower) return 100;

  // Bachelor's degree matches
  if (studentQualLower.includes('bachelor') && internshipQualLower.includes('bachelor')) {
    return 100;
  }

  // Master's matches Bachelor's
  if (studentQualLower.includes('master') && internshipQualLower.includes('bachelor')) {
    return 100;
  }

  // Diploma matches Bachelor's or Diploma
  if (studentQualLower.includes('diploma')) {
    if (internshipQualLower.includes('diploma') || internshipQualLower.includes('bachelor')) {
      return 85;
    }
  }

  // ITI matches Diploma or Bachelor's
  if (studentQualLower.includes('iti')) {
    if (internshipQualLower.includes('diploma') || internshipQualLower.includes('bachelor')) {
      return 80;
    }
  }

  // 12th pass
  if (studentQualLower.includes('12th') || studentQualLower.includes('12')) {
    if (internshipQualLower.includes('12th') || internshipQualLower.includes('any')) {
      return 75;
    }
  }

  // 10th pass
  if (studentQualLower.includes('10th') || studentQualLower.includes('10')) {
    if (internshipQualLower.includes('10th') || internshipQualLower.includes('any')) {
      return 70;
    }
  }

  // Partial match
  return 50;
};

// 3. Location Matching (15%)
const calculateLocationMatch = (studentLocation, internshipLocation) => {
  if (!studentLocation || !internshipLocation) return 60;

  const studentLocLower = studentLocation.toLowerCase();
  const internshipLocLower = internshipLocation.toLowerCase();

  // Exact match
  if (studentLocLower === internshipLocLower) return 100;

  // State match (e.g., "Maharashtra" in "Mumbai, Maharashtra")
  if (internshipLocLower.includes(studentLocLower)) return 100;

  // Similar state/region
  const stateMap = {
    'karnataka': ['bangalore', 'bengaluru', 'mysore'],
    'maharashtra': ['mumbai', 'pune', 'nagpur'],
    'telangana': ['hyderabad'],
    'tamil nadu': ['chennai', 'coimbatore'],
    'delhi': ['new delhi'],
    'uttar pradesh': ['noida', 'lucknow'],
    'haryana': ['gurugram', 'gurgaon', 'faridabad']
  };

  for (const [state, cities] of Object.entries(stateMap)) {
    if (studentLocLower.includes(state) || cities.includes(studentLocLower)) {
      if (internshipLocLower.includes(state) || cities.some(city => internshipLocLower.includes(city))) {
        return 90;
      }
    }
  }

  // Different location
  return 60;
};

// 4. Age Matching (15%)
const calculateAgeMatch = (age) => {
  const ageNum = parseInt(age);

  // Perfect age range for internship (21-24)
  if (ageNum >= 21 && ageNum <= 24) return 100;

  // Acceptable age range (20-25)
  if (ageNum >= 20 && ageNum <= 25) return 85;

  // Still acceptable (18-30)
  if (ageNum >= 18 && ageNum <= 30) return 70;

  // Outside ideal range but still valid
  if (ageNum > 30) return 50;

  // Too young
  return 30;
};

// 5. Sector Matching (10%)
const calculateSectorMatch = (studentSector, internshipSector) => {
  if (!studentSector || !internshipSector) return 50;

  const studentSectorLower = studentSector.toLowerCase();
  const internshipSectorLower = internshipSector.toLowerCase();

  // Exact match
  if (studentSectorLower === internshipSectorLower) return 100;

  // Partial match
  if (internshipSectorLower.includes(studentSectorLower) || studentSectorLower.includes(internshipSectorLower)) {
    return 85;
  }

  // Related sectors
  const sectorRelations = {
    'technology': ['it', 'software', 'hardware', 'telecommunications', 'data'],
    'finance': ['banking', 'insurance', 'accounting'],
    'engineering': ['construction', 'manufacturing', 'automotive', 'energy'],
    'fmcg': ['retail', 'supply chain', 'logistics'],
    'energy': ['oil & gas', 'power', 'renewable']
  };

  for (const [key, related] of Object.entries(sectorRelations)) {
    if (studentSectorLower.includes(key) || key.includes(studentSectorLower)) {
      if (related.some(rel => internshipSectorLower.includes(rel))) {
        return 70;
      }
    }
  }

  // No match
  return 40;
};

// 6. CGPA/Academic Performance (bonus, max 5%)
const calculateCGPAMatch = (cgpa) => {
  if (!cgpa) return 0;

  const cgpaNum = parseFloat(cgpa);

  if (cgpaNum >= 3.5) return 5;
  if (cgpaNum >= 3.0) return 4;
  if (cgpaNum >= 2.5) return 3;
  if (cgpaNum >= 2.0) return 2;

  return 0;
};

// Calculate final weighted score
const calculateFinalScore = (scores) => {
  const weights = {
    skillScore: 0.35,
    qualificationScore: 0.25,
    locationScore: 0.15,
    ageScore: 0.15,
    sectorScore: 0.10,
    cgpaScore: 0.05 // Bonus
  };

  let finalScore = 0;

  Object.keys(weights).forEach(key => {
    finalScore += (scores[key] || 0) * weights[key];
  });

  return Math.round(finalScore);
};

// Main matching function
const getMatchScore = (studentProfile, internship) => {
  const scores = calculateScores(studentProfile, internship);
  const finalScore = calculateFinalScore(scores);

  return {
    finalScore,
    breakdown: scores,
    percentage: finalScore + '%'
  };
};

// Get match quality label
const getMatchLabel = (score) => {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  if (score >= 55) return 'Fair Match';
  if (score >= 40) return 'Possible Match';
  return 'Poor Match';
};

// Get all recommendations with scores
const getRankedRecommendations = (studentProfile, internships, limit = 5) => {
  const scored = internships
    .map(internship => ({
      ...internship,
      matchScore: getMatchScore(studentProfile, internship).finalScore
    }))
    .filter(int => int.matchScore >= 40) // Minimum 40% match
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
    matchLabel: getMatchLabel(item.matchScore)
  }));
};

module.exports = {
  calculateScores,
  calculateSkillMatch,
  calculateQualificationMatch,
  calculateLocationMatch,
  calculateAgeMatch,
  calculateSectorMatch,
  calculateCGPAMatch,
  calculateFinalScore,
  getMatchScore,
  getMatchLabel,
  getRankedRecommendations,
  areSkillsSimilar
};
