import React from 'react';
import { Button } from './Button';
import { Card } from './Card';

export const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
      }}
    >
      <h1 style={{ color: "#111827", marginBottom: "8px" }}>
        Welcome to VoicePilot
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Highlight any area and speak to edit code
      </p>
      
      <Button onClick={() => console.log('Clicked!')}>
        Get Started
      </Button>
      
      <div style={{ marginTop: "32px", width: "100%", maxWidth: "600px" }}>
        <Card
          title="Smart Editing"
          description="Use your voice to make changes to any component"
        />
        <div style={{ height: "16px" }} />
        <Card
          title="Visual Selection"
          description="Highlight areas on screen to target specific elements"
        />
        <div style={{ height: "16px" }} />
        <Card
          title="Instant Preview"
          description="See your changes applied in real-time"
        />
      </div>
    </div>
  );
};