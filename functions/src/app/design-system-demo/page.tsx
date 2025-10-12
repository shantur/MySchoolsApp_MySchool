/**
 * Design System Demo Page
 * 
 * A showcase page demonstrating all the design system components
 * and their various states and configurations.
 */

'use client';

import React from 'react';
import {
  Button,
  IconButton,
  Input,
  Card,
  Container,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Grid,
  Flex,
  Dialog,
  Snackbar,
  Progress,
  Alert,
  AppBar,
  Tabs,
  Breadcrumb,
} from '@/components/ui';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardActions,
} from '@/components/ui/layout/Card';

export default function DesignSystemDemo() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('buttons');
  const [inputValue, setInputValue] = React.useState('');
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState('option1');
  const [switchOn, setSwitchOn] = React.useState(false);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Design System', current: true },
  ];

  const tabs = [
    {
      id: 'buttons',
      label: 'Buttons',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="title-large text-on-surface mb-4">Button Variants</h3>
            <Flex gap="medium" wrap="wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
              <Button variant="ghost">Ghost</Button>
            </Flex>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Button Sizes</h3>
            <Flex gap="medium" align="center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Flex>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Button States</h3>
            <Flex gap="medium" wrap="wrap">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </Flex>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Icon Buttons</h3>
            <Flex gap="medium" align="center">
              <IconButton aria-label="Settings">⚙️</IconButton>
              <IconButton variant="outlined" aria-label="Edit">✏️</IconButton>
              <IconButton variant="filled" aria-label="Delete">🗑️</IconButton>
              <IconButton variant="tonal" aria-label="Favorite">❤️</IconButton>
            </Flex>
          </div>
        </div>
      ),
    },
    {
      id: 'forms',
      label: 'Forms',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="title-large text-on-surface mb-4">Input Fields</h3>
            <div className="space-y-4 max-w-md">
              <Input
                label="Email Address"
                type="email"
                placeholder="your.email@example.com"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                helperText="Must be at least 8 characters"
              />
              <Input
                label="Error State"
                error="This field is required"
                required
              />
              <Input
                label="Disabled Input"
                disabled
                placeholder="This is disabled"
              />
            </div>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Other Form Elements</h3>
            <div className="space-y-4 max-w-md">
              <Textarea
                label="Message"
                placeholder="Type your message here..."
                rows={4}
              />
              <Select
                label="Country"
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'ca', label: 'Canada' },
                  { value: 'uk', label: 'United Kingdom' },
                ]}
              />
              <div className="space-y-2">
                <Checkbox
                  label="I agree to the terms and conditions"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />
                <Radio
                  label="Option 1"
                  name="radio-group"
                  value="option1"
                  checked={radioValue === 'option1'}
                  onChange={() => setRadioValue('option1')}
                />
                <Radio
                  label="Option 2"
                  name="radio-group"
                  value="option2"
                  checked={radioValue === 'option2'}
                  onChange={() => setRadioValue('option2')}
                />
                <Switch
                  label="Enable notifications"
                  checked={switchOn}
                  onChange={(e) => setSwitchOn(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'layout',
      label: 'Layout',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="title-large text-on-surface mb-4">Cards</h3>
            <Grid cols={3 as any} gap="large">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>
                    This is a basic card with title and description.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="body-medium text-on-surface">
                    Card content goes here. This can include any type of content.
                  </p>
                </CardContent>
              </Card>

              <Card interactive>
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>
                    This card is interactive and responds to hover.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="body-medium text-on-surface">
                    Hover over this card to see the interactive effects.
                  </p>
                </CardContent>
              </Card>

              <Card elevation={3}>
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>
                    This card has higher elevation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="body-medium text-on-surface">
                    This card uses elevation level 3 for more prominence.
                  </p>
                </CardContent>
                <CardActions>
                  <Button variant="text" size="sm">Action 1</Button>
                  <Button variant="text" size="sm">Action 2</Button>
                </CardActions>
              </Card>
            </Grid>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Containers</h3>
            <div className="space-y-4">
              <Container size="sm" className="surface-variant p-4 rounded-medium">
                <p className="body-medium text-on-surface-variant">
                  Small container with max-width of 640px
                </p>
              </Container>
              <Container size="md" className="surface-variant p-4 rounded-medium">
                <p className="body-medium text-on-surface-variant">
                  Medium container with max-width of 768px
                </p>
              </Container>
              <Container size="lg" className="surface-variant p-4 rounded-medium">
                <p className="body-medium text-on-surface-variant">
                  Large container with max-width of 1024px
                </p>
              </Container>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'feedback',
      label: 'Feedback',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="title-large text-on-surface mb-4">Alerts</h3>
            <div className="space-y-4 max-w-md">
              <Alert variant="info" title="Information">
                This is an informational message.
              </Alert>
              <Alert variant="success" title="Success">
                Operation completed successfully!
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review this information carefully.
              </Alert>
              <Alert variant="error" title="Error">
                Something went wrong. Please try again.
              </Alert>
            </div>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Progress</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <p className="body-medium text-on-surface mb-2">Progress: 25%</p>
                <Progress value={25} />
              </div>
              <div>
                <p className="body-medium text-on-surface mb-2">Progress: 50%</p>
                <Progress value={50} />
              </div>
              <div>
                <p className="body-medium text-on-surface mb-2">Progress: 75%</p>
                <Progress value={75} />
              </div>
              <div>
                <p className="body-medium text-on-surface mb-2">Indeterminate</p>
                <Progress indeterminate />
              </div>
            </div>
          </div>

          <div>
            <h3 className="title-large text-on-surface mb-4">Interactive Elements</h3>
            <Flex gap="medium" wrap="wrap">
              <Button onClick={() => setDialogOpen(true)}>
                Open Dialog
              </Button>
              <Button onClick={() => setSnackbarOpen(true)}>
                Show Snackbar
              </Button>
            </Flex>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Design System Demo" />
      
      <Container size="xl" className="py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <div className="space-y-8">
          <div>
            <h1 className="display-small text-on-background mb-4">
              Design System Demo
            </h1>
            <p className="body-large text-on-background">
              This page showcases all the components in our design system,
              demonstrating various states, variants, and configurations.
            </p>
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </Container>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Dialog Example"
      >
        <div className="space-y-4">
          <p className="body-medium text-on-surface">
            This is an example dialog. Dialogs are used for critical information
            or tasks that require user attention.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="text" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message="This is a snackbar message!"
        action={{
          label: 'Dismiss',
          onClick: () => setSnackbarOpen(false),
        }}
      />
    </div>
  );
}