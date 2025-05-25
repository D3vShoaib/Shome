export function getSortedSuggestions(data) {
  const [suggestions, descriptions, , metadata] = data;

  const relevanceArray = metadata["google:suggestrelevance"] || [];
  const subtypesArray = metadata["google:suggestsubtypes"] || [];
  const typesArray = metadata["google:suggesttype"] || [];

  const combined = suggestions.map((text, index) => ({
    text,
    description: descriptions[index] || null,
    relevance: relevanceArray[index] || 0,
    subtype: subtypesArray[index] || [],
    type: typesArray[index] || null,
  }));

  // Sort by descending relevance
  return combined.sort((a, b) => b.relevance - a.relevance);
}
