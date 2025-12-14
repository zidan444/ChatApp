import React from "react";

const Avatar = ({ src, fallback, size = 36, className = "" }) => {
  const commonStyles = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: "999px",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={fallback || "Avatar"}
        className={`object-cover border border-white/10 bg-white/5 ${className}`}
        style={commonStyles}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-semibold text-sm border border-white/10 bg-white/5 text-gray-200 ${className}`}
      style={{
        ...commonStyles,
        fontSize: size * 0.4,
      }}
    >
      {fallback}
    </div>
  );
};

export default Avatar;
