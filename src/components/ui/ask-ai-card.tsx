"use client";

import type React from "react";

interface AskAICardProps {
    onClick?: () => void;
}

export const AskAICard: React.FC<AskAICardProps> = ({ onClick }) => {
    return (
        <div
            className="ask-ai-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        >
            {/* Glowing Orb */}
            <div className="ask-ai-orb-container">
                <div className="ask-ai-orb">
                    <div className="ask-ai-orb-glow" />
                </div>
            </div>

            {/* Text */}
            <div className="ask-ai-text">
                <h3 className="ask-ai-title">Ask AI</h3>
                <p className="ask-ai-subtitle">Get answers</p>
            </div>

        </div>
    );
};

export default AskAICard;
