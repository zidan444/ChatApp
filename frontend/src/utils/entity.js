export const getEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  if (typeof entity === "object") {
    const value = entity._id || entity.id;
    return value ? value.toString() : null;
  }
  return null;
};
