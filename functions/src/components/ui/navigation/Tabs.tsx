/**
 * Tabs Component
 * 
 * Tab navigation component following Material Design 3 guidelines.
 * Enhanced with comprehensive ARIA support for accessibility.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  /**
   * Array of tab items to display.
   */
  tabs: TabItem[];
  
  /**
   * The ID of the currently active tab.
   */
  activeTab: string;
  
  /**
   * Callback function when a tab is changed.
   */
  onTabChange: (tabId: string) => void;
  
  /**
   * Additional CSS classes for styling.
   */
  className?: string;
  
  /**
   * Optional orientation for the tabs (horizontal or vertical).
   */
  orientation?: 'horizontal' | 'vertical';
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className,
  orientation = 'horizontal'
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  
  // Generate unique IDs for ARIA relationships
  const tabListId = `tablist-${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, tabIndex: number) => {
    let targetIndex = tabIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = (tabIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = tabIndex === 0 ? tabs.length - 1 : tabIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    const targetTab = tabs[targetIndex];
    if (targetTab && !targetTab.disabled) {
      onTabChange(targetTab.id);
    }
  };

  // Focus management for active tab
  useEffect(() => {
    const activeTabElement = document.querySelector(
      `[role="tab"][aria-selected="true"]`
    ) as HTMLElement;
    
    if (activeTabElement) {
      activeTabElement.focus();
    }
  }, [activeTab]);

  const tabListClasses = cn(
    'flex border-b border-outline',
    orientation === 'vertical' && 'flex-col border-b-0 border-r'
  );

  const tabButtonClasses = (isActive: boolean, isDisabled: boolean) => cn(
    'px-6 py-3 label-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
    isActive
      ? 'text-primary border-primary'
      : 'text-on-surface-variant border-transparent hover:text-on-surface',
    isDisabled && 'opacity-50 cursor-not-allowed',
    orientation === 'vertical' && 'border-b-0 border-r-2 px-4 py-3'
  );

  return (
    <div className={className}>
      {/* Tab List */}
      <div
        ref={tabListRef}
        id={tabListId}
        className={tabListClasses}
        role="tablist"
        aria-orientation={orientation}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled || false}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={tab.disabled}
            className={tabButtonClasses(activeTab === tab.id, tab.disabled || false)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="py-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            tabIndex={0}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;