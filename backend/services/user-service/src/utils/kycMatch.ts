export function normalize(str?: string) {
  return str?.toLowerCase().replace(/\s/g, "");
}

export function isKycMatch(user: any, profile: any) {
  let score = 0;

  if (normalize(user.name) === normalize(profile.name)) score++;

  if (
    user.phone &&
    profile.mobile &&
    user.phone.replace("+91", "") === profile.mobile.replace("+91", "")
  )
    score++;

  if (user.dob && profile.dob && user.dob === profile.dob) score++;

  return score >= 2; // require at least 2 matches
}