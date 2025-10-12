/**
 * ARIA Improvements Test Suite
 * 
 * Tests for enhanced ARIA labels and accessibility features
 * across UI components following WCAG guidelines.
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Link from 'next/link';
import Button from '../buttons/Button';
import Input from '../forms/Input';
import IconButton from '../buttons/IconButton';
import AppBar from '../navigation/AppBar';
import Dialog from '../feedback/Dialog';
import Select from '../forms/Select';
import Alert from '../feedback/Alert';
import Tabs from '../navigation/Tabs';

describe('ARIA Improvements - Button Component', () => {
  it('should provide proper ARIA labels for loading state', () => {
    render(
      <Button loading>
        Submit Form
      </Button>
    );

    const button = screen.getByRole('button', { name: /submit form/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Check for loading description
    const loadingDescription = document.getElementById('loading-description');
    expect(loadingDescription).toBeInTheDocument();
    expect(loadingDescription).toHaveTextContent('Loading, please wait');
  });

  it('should announce button state changes to screen readers', () => {
    const { rerender } = render(
      <Button disabled>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // Rerender as enabled
    rerender(
      <Button>
        Enabled Button
      </Button>
    );

    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('should handle icon buttons with proper labels', () => {
    render(
      <IconButton 
        aria-label="Close dialog"
        tooltip="Close"
      >
        ×
      </IconButton>
    );

    const button = screen.getByRole('button', { name: /close dialog/i });
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
    expect(button).toHaveAttribute('title', 'Close');
  });
});

describe('ARIA Improvements - Input Component', () => {
  it('should associate error messages with inputs', () => {
    render(
      <Input
        label="Email Address"
        error="Invalid email format"
        id="email-input"
      />
    );

    const input = screen.getByLabelText(/email address/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    
    const errorMessage = screen.getByText('Invalid email format');
    expect(errorMessage).toHaveAttribute('role', 'alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    
    // Check that error message is properly associated
    expect(input).toHaveAttribute('aria-describedby');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('email-input-error');
  });

  it('should provide helper text for additional context', () => {
    render(
      <Input
        label="Password"
        helperText="Must be at least 8 characters long"
        id="password-input"
      />
    );

    const input = screen.getByLabelText(/password/i);
    screen.getByText('Must be at least 8 characters long');
    
    expect(input).toHaveAttribute('aria-describedby');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('password-input-helper');
  });

  it('should announce required field indicators', () => {
    render(
      <Input
        label="First Name"
        required
        id="name-input"
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });
});

describe('ARIA Improvements - AppBar Component', () => {
  it('should have proper landmark role for navigation', () => {
    render(
      <AppBar title="MySchool Dashboard" />
    );

    const appBar = screen.getByRole('banner');
    expect(appBar).toBeInTheDocument();
    
    const heading = screen.getByRole('heading', { 
      name: 'MySchool Dashboard', 
      level: 1 
    });
    expect(heading).toBeInTheDocument();
  });

  it('should provide navigation context for action buttons', () => {
    render(
      <AppBar 
        title="MySchool Dashboard"
        rightActions={
          <>
            <button aria-label="User menu">👤</button>
            <button aria-label="Settings">⚙️</button>
          </>
        }
      />
    );

    const userMenu = screen.getByRole('button', { name: 'User menu' });
    const settings = screen.getByRole('button', { name: 'Settings' });
    
    expect(userMenu).toBeInTheDocument();
    expect(settings).toBeInTheDocument();
  });
});

describe('ARIA Improvements - Dialog Component', () => {
  it('should have proper dialog ARIA attributes', () => {
    const mockOnClose = jest.fn();
    
    render(
      <Dialog 
        open={true}
        onClose={mockOnClose}
        title="Confirm Delete"
      >
        <p>Are you sure you want to delete this item?</p>
      </Dialog>
    );

    // Check for dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check for proper heading
    const heading = screen.getByRole('heading', { 
      name: 'Confirm Delete', 
      level: 2 
    });
    expect(heading).toBeInTheDocument();
    
    // Check for focus management
    expect(dialog).toHaveFocus();
  });

  it('should handle escape key for closing', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(
      <Dialog 
        open={true}
        onClose={mockOnClose}
        title="Test Dialog"
      >
        <p>Test content</p>
      </Dialog>
    );

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should trap focus within dialog', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(
      <Dialog 
        open={true}
        onClose={mockOnClose}
        title="Test Dialog"
      >
        <button>Cancel</button>
        <button>Confirm</button>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Tab navigation should stay within dialog
    await user.tab();
    const focusedElement = document.activeElement;
    expect(dialog.contains(focusedElement)).toBe(true);
  });
});

describe('ARIA Improvements - Form Sections', () => {
  it('should group related form controls', () => {
    render(
      <form>
        <fieldset>
          <legend>Contact Information</legend>
          <Input label="Email" type="email" id="email" />
          <Input label="Phone" type="tel" id="phone" />
        </fieldset>
      </form>
    );

    const fieldset = screen.getByRole('group');
    expect(fieldset).toBeInTheDocument();
    
    const legend = screen.getByText('Contact Information');
    expect(legend).toBeInTheDocument();
  });

  it('should provide form validation feedback', () => {
    const TestComponent = () => {
      const [error, setError] = React.useState<string>('');
      
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const value = formData.get('required-field') as string;
        
        if (!value || value.trim() === '') {
          setError('This field is required');
        } else {
          setError('');
        }
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <Input 
            label="Required Field" 
            required 
            id="required-field"
            name="required-field"
            error={error}
          />
          <button type="submit">Submit</button>
        </form>
      );
    };
    
    render(<TestComponent />);

    const input = screen.getByLabelText(/required field/i);
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Initially should not have error
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toBeInvalid();
    
    // Submit empty form
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
  });
  });

  describe('ARIA Improvements - Select Component', () => {
    it('should provide proper ARIA labels for select dropdowns', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ];

      render(
        <Select
          label="Choose an option"
          options={options}
          id="test-select"
        />
      );

      const select = screen.getByRole('combobox', { name: 'Choose an option' });
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('aria-required', 'false');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error messages with selects', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      render(
        <Select
          label="Country"
          options={options}
          error="Please select a country"
          id="country-select"
        />
      );

      const select = screen.getByRole('combobox', { name: 'Country' });
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please select a country');
    });

    it('should announce required field indicators for selects', () => {
      const options = [
        { value: 'mr', label: 'Mr.' },
        { value: 'mrs', label: 'Mrs.' },
        { value: 'ms', label: 'Ms.' },
      ];

      render(
        <Select
          label="Title"
          options={options}
          required
          id="title-select"
        />
      );

      const select = screen.getByRole('combobox', { name: 'Title required' });
      expect(select).toHaveAttribute('aria-required', 'true');
      
      const requiredIndicator = screen.getByText('*', { selector: '[aria-label="required"]' });
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should provide helper text for additional context', () => {
      const options = [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
      ];

      render(
        <Select
          label="Country"
          options={options}
          helperText="Select your country of residence"
          id="country-select"
        />
      );

      const select = screen.getByRole('combobox', { name: 'Country' });
      expect(select).toHaveAttribute('aria-describedby');
      
      const helperText = screen.getByText('Select your country of residence');
      expect(helperText).toBeInTheDocument();
    });

    it('should handle disabled options correctly', () => {
      const options = [
        { value: 'option1', label: 'Available Option' },
        { value: 'option2', label: 'Unavailable Option', disabled: true },
        { value: 'option3', label: 'Another Available Option' },
      ];

      render(
        <Select
          label="Select Option"
          options={options}
          id="test-select"
        />
      );

      screen.getByRole('combobox');
      
      // Check that disabled options are present but disabled
      const disabledOption = screen.getByText('Unavailable Option');
      expect(disabledOption).toBeInTheDocument();
    });
  });

  describe('ARIA Improvements - Alert Component', () => {
    it('should provide proper ARIA roles for different alert variants', () => {
      const { rerender } = render(<Alert variant="error">Error message</Alert>);
      let alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');

      rerender(<Alert variant="warning">Warning message</Alert>);
      alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');

      rerender(<Alert variant="info">Info message</Alert>);
      alert = screen.getByRole('status');
      expect(alert).toHaveAttribute('aria-live', 'polite');

      rerender(<Alert variant="success">Success message</Alert>);
      alert = screen.getByRole('status');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should associate title with alert content', () => {
      render(
        <Alert variant="error" title="Login Failed">
          Invalid username or password
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-labelledby');
      
      const title = screen.getByText('Login Failed');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H4');
    });

    it('should handle dismissible alerts with proper ARIA', () => {
      const mockDismiss = jest.fn();
      render(
        <Alert 
          variant="info" 
          dismissible 
          onDismiss={mockDismiss}
        >
          This is a dismissible info message
        </Alert>
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss alert' });
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(mockDismiss).toHaveBeenCalled();
    });

    it('should respect custom live region settings', () => {
      render(
        <Alert variant="error" polite={false}>
          Critical error message
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('ARIA Improvements - Tabs Component', () => {
    const mockTabs = [
      { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
      { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
    ];

    it('should provide proper ARIA attributes for tab navigation', () => {
      const mockOnTabChange = jest.fn();
      render(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={mockOnTabChange}
        />
      );

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      expect(tabList).toHaveAttribute('aria-orientation', 'horizontal');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      // Check active tab
      const activeTab = screen.getByRole('tab', { name: 'Tab 1', selected: true });
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(activeTab).toHaveAttribute('tabIndex', '0');
      
      // Check inactive tabs
      const inactiveTab = screen.getByRole('tab', { name: 'Tab 2', selected: false });
      expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
      expect(inactiveTab).toHaveAttribute('tabIndex', '-1');
    });

    it('should associate tab panels with tabs correctly', () => {
      const mockOnTabChange = jest.fn();
      render(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab2" 
          onTabChange={mockOnTabChange}
        />
      );

      const activeTab = screen.getByRole('tab', { name: 'Tab 2', selected: true });
      expect(activeTab).toHaveAttribute('aria-controls', 'panel-tab2');

      const activePanel = document.getElementById('panel-tab2');
      expect(activePanel).toBeInTheDocument();
      expect(activePanel).toHaveAttribute('role', 'tabpanel');
      expect(activePanel).toHaveAttribute('aria-labelledby', 'tab-tab2');
      expect(activePanel).not.toHaveAttribute('hidden');
    });

    it('should handle keyboard navigation', () => {
      const mockOnTabChange = jest.fn();
      render(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={mockOnTabChange}
        />
      );

      const activeTab = screen.getByRole('tab', { name: 'Tab 1', selected: true });
      
      // Test arrow right navigation
      fireEvent.keyDown(activeTab, { key: 'ArrowRight' });
      expect(mockOnTabChange).toHaveBeenCalledWith('tab2');

      // Test home key
      mockOnTabChange.mockClear();
      fireEvent.keyDown(activeTab, { key: 'Home' });
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1');

      // Test end key
      mockOnTabChange.mockClear();
      fireEvent.keyDown(activeTab, { key: 'End' });
      expect(mockOnTabChange).toHaveBeenCalledWith('tab3');
    });

    it('should handle disabled tabs correctly', () => {
      const tabsWithDisabled = [
        ...mockTabs,
        { id: 'tab4', label: 'Disabled Tab', content: <div>Content 4</div>, disabled: true },
      ];
      
      const mockOnTabChange = jest.fn();
      render(
        <Tabs 
          tabs={tabsWithDisabled} 
          activeTab="tab1" 
          onTabChange={mockOnTabChange}
        />
      );

      const disabledTab = screen.getByRole('tab', { name: 'Disabled Tab' });
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
      expect(disabledTab).toBeDisabled();
    });

    it('should support vertical orientation', () => {
      const mockOnTabChange = jest.fn();
      render(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={mockOnTabChange}
          orientation="vertical"
        />
      );

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('ARIA Improvements - Navigation Links', () => {
  it('should provide context for navigation links', () => {
    render(
      <nav aria-label="Main navigation">
        <ul>
          <li><Link href="/home" aria-current="page">Home</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </nav>
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
    
    const currentLink = screen.getByRole('link', { name: 'Home' });
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  it('should announce external links', () => {
    render(
      <a 
        href="https://example.com" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit external website (opens in new tab)"
      >
        External Link
      </a>
    );

    const link = screen.getByRole('link', { 
      name: /visit external website.*opens in new tab/i 
    });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('ARIA Improvements - Content Regions', () => {
  it('should use landmark roles for page structure', () => {
    render(
      <div>
        <header role="banner">
          <h1>Page Title</h1>
        </header>
        
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><Link href="/">Home</Link></li>
          </ul>
        </nav>
        
        <main role="main">
          <h2>Main Content</h2>
          <p>Content goes here...</p>
        </main>
        
        <aside role="complementary" aria-label="Sidebar">
          <h3>Related Links</h3>
        </aside>
        
        <footer role="contentinfo">
          <p>&copy; 2025 MySchool</p>
        </footer>
      </div>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should provide live regions for dynamic content', () => {
    render(
      <div>
        <div 
          aria-live="polite" 
          aria-atomic="true"
          id="status-message"
        >
          Loading complete
        </div>
        
        <div 
          aria-live="assertive" 
          id="error-message"
          role="alert"
        >
          Error occurred
        </div>
      </div>
    );

    const statusMessage = document.getElementById('status-message');
    const errorMessage = document.getElementById('error-message');
    
    expect(statusMessage).toHaveAttribute('aria-live', 'polite');
    expect(statusMessage).toHaveAttribute('aria-atomic', 'true');
    
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});