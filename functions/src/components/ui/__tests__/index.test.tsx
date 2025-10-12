/**
 * Design System Components Test
 * 
 * Simple test file to verify that the design system components
 * can be imported and rendered without errors.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all components from the design system
import {
  Button,
  IconButton,
  Input,
  Card,
  Container,
  // Placeholder components
  Textarea,
  Select,
  Checkbox,
  Radio,
  _Switch,
  Grid,
  Flex,
  _Dialog,
  _Snackbar,
  Progress,
  Alert,
  AppBar,
  Tabs,
  Breadcrumb,
} from '../index';

describe('Design System Components', () => {
  describe('Core Components', () => {
    test('Button renders correctly', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
    });

    test('Button with variant renders correctly', () => {
      render(<Button variant="outlined">Outlined Button</Button>);
      expect(screen.getByRole('button', { name: /outlined button/i })).toBeInTheDocument();
    });

    test('IconButton renders correctly', () => {
      render(
        <IconButton aria-label="Test Icon">
          <span data-testid="test-icon">Icon</span>
        </IconButton>
      );
      expect(screen.getByRole('button', { name: /test icon/i })).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('Input renders correctly', () => {
      render(<Input label="Test Input" placeholder="Enter text" />);
      expect(screen.getByLabelText(/test input/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    test('Input with error state', () => {
      render(<Input label="Test Input" error="This field is required" />);
      expect(screen.getByLabelText(/test input/i)).toBeInTheDocument();
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/test input/i)).toHaveAttribute('aria-invalid', 'true');
    });

    test('Card renders correctly', () => {
      render(
        <Card data-testid="test-card">
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByText(/card content/i)).toBeInTheDocument();
    });

    test('Container renders correctly', () => {
      render(
        <Container data-testid="test-container">
          <p>Container content</p>
        </Container>
      );
      expect(screen.getByTestId('test-container')).toBeInTheDocument();
      expect(screen.getByText(/container content/i)).toBeInTheDocument();
    });
  });

  describe('Placeholder Components', () => {
    test('Textarea renders correctly', () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    test('Select renders correctly', () => {
      render(
        <Select options={[{ value: '1', label: 'Option 1' }]}>
          <option value="2">Option 2</option>
        </Select>
      );
      expect(screen.getByDisplayValue(/option 1/i)).toBeInTheDocument();
    });

    test('Checkbox renders correctly', () => {
      render(<Checkbox label="Test Checkbox" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByLabelText(/test checkbox/i)).toBeInTheDocument();
    });

    test('Radio renders correctly', () => {
      render(<Radio label="Test Radio" />);
      expect(screen.getByRole('radio')).toBeInTheDocument();
      expect(screen.getByLabelText(/test radio/i)).toBeInTheDocument();
    });

    test('Grid renders correctly', () => {
      render(
        <Grid data-testid="test-grid">
          <div>Grid item</div>
        </Grid>
      );
      expect(screen.getByTestId('test-grid')).toBeInTheDocument();
      expect(screen.getByText(/grid item/i)).toBeInTheDocument();
    });

    test('Flex renders correctly', () => {
      render(
        <Flex data-testid="test-flex">
          <div>Flex item</div>
        </Flex>
      );
      expect(screen.getByTestId('test-flex')).toBeInTheDocument();
      expect(screen.getByText(/flex item/i)).toBeInTheDocument();
    });
  });

  describe('Feedback Components', () => {
    test('Alert renders correctly', () => {
      render(<Alert variant="info">Info message</Alert>);
      expect(screen.getByText(/info message/i)).toBeInTheDocument();
    });

    test('Progress renders correctly', () => {
      render(<Progress value={50} />);
      const progressElement = screen.getByRole('progressbar') || screen.getByRole('generic');
      expect(progressElement).toBeInTheDocument();
    });
  });

  describe('Navigation Components', () => {
    test('AppBar renders correctly', () => {
      render(<AppBar title="Test App" />);
      expect(screen.getByText(/test app/i)).toBeInTheDocument();
    });

    test('Tabs renders correctly', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
      ];
      render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />);
      expect(screen.getByText(/tab 1/i)).toBeInTheDocument();
      expect(screen.getByText(/tab 2/i)).toBeInTheDocument();
      expect(screen.getByText(/content 1/i)).toBeInTheDocument();
    });

    test('Breadcrumb renders correctly', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Page', current: true },
      ];
      render(<Breadcrumb items={items} />);
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/page/i)).toBeInTheDocument();
    });
  });

  describe('Component Accessibility', () => {
    test('Button has proper accessibility attributes', () => {
      render(<Button disabled>Disabled Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    test('Input has proper accessibility attributes', () => {
      render(<Input label="Required Input" required error="Error message" />);
      expect(screen.getByLabelText(/required input \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/required input \*/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/required input \*/i)).toHaveAttribute('aria-describedby');
    });

    test('IconButton has proper accessibility attributes', () => {
      render(
        <IconButton aria-label="Settings">
          <span>⚙️</span>
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Settings');
    });
  });
});