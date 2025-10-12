/**
 * Breadcrumb Component
 * 
 * Breadcrumb navigation component following Material Design 3 guidelines.
 * TODO: Implement full Breadcrumb component with all features
 */

import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = '/', className }) => {
  return (
    <nav className={`flex items-center space-x-2 label-small text-on-surface-variant ${className || ''}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span aria-hidden="true">{separator}</span>}
          {item.href && !item.current ? (
            <a
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className={item.current ? 'text-on-surface font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;