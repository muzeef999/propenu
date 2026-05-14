export async function getLocalityInsights(
  city: string
) {

  const insights: Record<string, string> = {

    Bangalore:
      "Whitefield and Sarjapur are high-growth investment zones.",

    Hyderabad:
      "Kokapet and Tellapur are premium growth corridors."
  };

  return insights[city];
}