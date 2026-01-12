export function calculateResidentialCompletion(doc: any) {
  const sections = [
    !!(doc.title && doc.propertyType && doc.listingType && doc.bhk),
    !!(doc.city && doc.locality && doc.address),
    !!(doc.price),
    !!(doc.gallery && doc.gallery.length > 0),
    !!(doc.bedrooms || doc.bathrooms || doc.builtUpArea),
    !!(doc.amenities && doc.amenities.length > 0),
    !!(doc.legalChecks && Object.keys(doc.legalChecks).length > 0),
  ];

  const done = sections.filter(Boolean).length;
  const total = sections.length;

  return Math.round((done / total) * 100);
}
