import React from 'react';

interface CardProps {
  title: string;
  description: string;
}

export const Card: React.FC<CardProps> = ({ title, description }) => {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: "8px", color: "#111827" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
        {description}
      </p>
    </div>
  );
};