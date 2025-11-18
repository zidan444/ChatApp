// src/utils/dateFormat.js
export const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatMessageDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatLastSeen = (isoString) => {
  if (!isoString) return "last seen recently";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Online just now";
  if (diffMinutes < 60) return `Last seen ${diffMinutes} min ago`;
  if (diffHours < 24) {
    return `Last seen today at ${formatMessageTime(isoString)}`;
  }
  if (diffDays === 1) {
    return `Last seen yesterday at ${formatMessageTime(isoString)}`;
  }
  return `Last seen ${formatMessageDate(isoString)} at ${formatMessageTime(
    isoString
  )}`;
};
