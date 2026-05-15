function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
}

function generateUniqueSlug(baseSlug) {
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

module.exports = {
  slugify,
  generateUniqueSlug
};
