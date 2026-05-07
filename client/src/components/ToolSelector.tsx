import { useState, useEffect } from 'react';
import { useTools } from '../hooks/useApi';
import { Check } from 'lucide-react';
import './ToolSelector.css';

interface Props {
  selectedTools: string[];
  onSelectionChange: (tools: string[]) => void;
}

const STORAGE_KEY = 'ai-trending-selected-tools';

export default function ToolSelector({ selectedTools, onSelectionChange }: Props) {
  const { data: tools, isLoading } = useTools();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onSelectionChange(parsed);
        }
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (selectedTools.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTools));
    }
  }, [selectedTools]);

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onSelectionChange(selectedTools.filter(t => t !== toolId));
    } else {
      onSelectionChange([...selectedTools, toolId]);
    }
  };

  if (isLoading) {
    return (
      <div className="tool-selector">
        <h2 className="tool-selector-title">你正在使用哪些 AI 工具？</h2>
        <div className="tool-grid loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="tool-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tool-selector">
      <h2 className="tool-selector-title">🎯 你正在使用哪些 AI 工具？</h2>
      <p className="tool-selector-subtitle">选择后我们会为你推荐适配的 Skills & MCP</p>
      <div className="tool-grid">
        {tools?.map(tool => {
          const isSelected = selectedTools.includes(tool.id);
          return (
            <button
              key={tool.id}
              className={`tool-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTool(tool.id)}
            >
              <div className="tool-card-check">
                {isSelected && <Check size={14} />}
              </div>
              <span className="tool-card-icon">{tool.icon}</span>
              <span className="tool-card-name">{tool.name}</span>
              <span className="tool-card-desc">{tool.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
