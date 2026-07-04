// Extract the joining year from a college email
//"2024ucp1000@mnit.ac.in" → 2024(dummy email)
export const getJoinYearFromEmail = (email: string): number | null => {
  const match = email.match(/^(\d{4})/); // first 4 digits at the start
  if (!match) return null;
  return parseInt(match[1], 10);
};

// Compute current academic year from join year
// Academic year flips every July
export const getAcademicYear = (joinYear: number): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth();

  let year = currentYear - joinYear + 1;
  if (month < 6) year -= 1; // before July, still in previous academic year

  return Math.min(Math.max(year, 1), 4);
};

//from email to academic year
export const getYearFromEmail = (email: string): number | null => {
  const joinYear = getJoinYearFromEmail(email);
  if (!joinYear) return null;
  return getAcademicYear(joinYear);
};