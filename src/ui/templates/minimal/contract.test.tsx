// @vitest-environment jsdom
// The Minimal template against the UI contract: every component renders with an accessible role or
// label, the data table has its empty and loading states, and a failed save shows a toast. This app
// has no Form* pieces (UPSTREAM.md, "This app").
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';

import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { it, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

import {
  Icon,
  Page,
  Text,
  Alert,
  Stack,
  Button,
  Dialog,
  Heading,
  AppShell,
  useToast,
  DataTable,
  TextField,
  EmptyState,
  LinkButton,
  UiProvider,
  ErrorScreen,
  SelectField,
  LoadingState,
  SignInLayout,
} from './index';

// ----------------------------------------------------------------------

beforeAll(() => {
  // jsdom has no matchMedia, which MUI's color-scheme and breakpoint hooks read.
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) satisfies MediaQueryList;
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

/** Renders `ui` inside the template's provider and a router, as the app does. */
function renderInApp(ui: ReactNode) {
  const router = createMemoryRouter([{ path: '*', element: ui }]);
  return render(
    <UiProvider>
      <RouterProvider router={router} />
    </UiProvider>
  );
}

// ----------------------------------------------------------------------

describe('layout and text', () => {
  it('renders the app shell with its navigation and the page heading', async () => {
    const user = userEvent.setup();
    renderInApp(
      <AppShell
        navigation={[{ title: 'Main', items: [{ label: 'Members', to: '/members', icon: 'users' }] }]}
        headerActions={<Button>Sign out</Button>}
      >
        <Page title="Members" description="Everyone in the team" actions={<Button>Add</Button>}>
          <Stack>
            <Heading level={2}>Active</Heading>
            <Text tone="muted">Nobody yet.</Text>
          </Stack>
        </Page>
      </AppShell>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Members' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Active' })).toBeInTheDocument();
    expect(screen.getByText('Nobody yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(await screen.findByRole('link', { name: 'Members' })).toHaveAttribute('href', '/members');
  });

  it('renders the sign-in layout with its heading and form slot', async () => {
    renderInApp(
      <SignInLayout title="Sign in" description="Use your work email.">
        <Button type="submit">Continue</Button>
      </SignInLayout>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Use your work email.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute('type', 'submit');
  });

  it('renders the error screen with its action', async () => {
    renderInApp(
      <ErrorScreen
        kind="not-found"
        title="Page not found"
        message="It has moved."
        action={<LinkButton to="/">Home</LinkButton>}
      />
    );

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('It has moved.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('gives a labelled icon an image role and hides a decorative one', async () => {
    renderInApp(
      <>
        <Icon name="users" label="Members" />
        <Icon name="home" />
      </>
    );

    expect(await screen.findByRole('img', { name: 'Members' })).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(1);
  });
});

// ----------------------------------------------------------------------

describe('actions and fields', () => {
  it('calls onClick, and blocks clicks while loading', async () => {
    const user = userEvent.setup();
    let clicks = 0;
    const { rerender } = render(
      <UiProvider>
        <Button onClick={() => (clicks += 1)}>Save</Button>
      </UiProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(clicks).toBe(1);

    rerender(
      <UiProvider>
        <Button loading onClick={() => (clicks += 1)}>
          Save
        </Button>
      </UiProvider>
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('draws buttons at least 44px high, the smallest touch target on phones', async () => {
    renderInApp(<Button>Save</Button>);
    const button = await screen.findByRole('button', { name: 'Save' });
    expect(getComputedStyle(button).minHeight).toBe('44px');
  });

  it('ties text and select fields to their labels, and shows their errors', async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    renderInApp(
      <>
        <TextField label="Name" value="" onChange={(v) => changes.push(v)} error="Name is required" />
        <SelectField
          label="Role"
          value="editor"
          onChange={(v) => changes.push(v)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'editor', label: 'Editor' },
          ]}
        />
      </>
    );

    const name = await screen.findByRole('textbox', { name: 'Name' });
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription('Name is required');
    await user.type(name, 'A');
    expect(changes).toEqual(['A']);

    const role = screen.getByRole('combobox', { name: 'Role' });
    expect(role.tagName).toBe('SELECT');
    expect(role).toHaveValue('editor');
    await user.selectOptions(role, 'admin');
    expect(changes).toEqual(['A', 'admin']);
  });
});

// ----------------------------------------------------------------------

type Member = { id: string; name: string };
const columns = [{ id: 'name', header: 'Name', cell: (row: Member) => row.name }];

describe('data table', () => {
  it('renders rows under their column headers', async () => {
    renderInApp(
      <DataTable
        label="Members"
        rows={[{ id: 'm1', name: 'Amina' }]}
        columns={columns}
        getRowId={(row) => row.id}
      />
    );

    const table = await screen.findByRole('table', { name: 'Members' });
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'Amina' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', async () => {
    renderInApp(
      <DataTable
        label="Members"
        rows={[]}
        columns={columns}
        getRowId={(row) => row.id}
        emptyTitle="No members yet"
      />
    );

    const table = await screen.findByRole('table', { name: 'Members' });
    expect(within(table).getByText('No members yet')).toBeInTheDocument();
    expect(table).not.toHaveAttribute('aria-busy');
  });

  it('shows the loading state while the rows load', async () => {
    renderInApp(
      <DataTable label="Members" rows={[]} columns={columns} getRowId={(row) => row.id} loading />
    );

    const table = await screen.findByRole('table', { name: 'Members' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(within(table).getByRole('status')).toHaveTextContent('Loading');
    expect(within(table).queryByText('Nothing here yet')).not.toBeInTheDocument();
  });
});

// ----------------------------------------------------------------------

describe('feedback', () => {
  it('renders alerts, loading and empty states with their roles', async () => {
    renderInApp(
      <>
        <Alert tone="error" title="Could not save">
          Try again.
        </Alert>
        <Alert tone="success">Saved.</Alert>
        <LoadingState label="Loading members" />
        <EmptyState title="No files" description="Upload one to start." />
      </>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not saveTry again.');
    expect(screen.getByText('Saved.').closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('Loading members').closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('opens a dialog with its title as the accessible name, and closes it', async () => {
    const user = userEvent.setup();
    let closed = 0;
    renderInApp(
      <Dialog
        open
        onClose={() => (closed += 1)}
        title="Remove member"
        actions={<Button onClick={() => (closed += 1)}>Cancel</Button>}
      >
        <Text>This can&apos;t be undone.</Text>
      </Dialog>
    );

    const dialog = await screen.findByRole('dialog', { name: 'Remove member' });
    expect(within(dialog).getByText("This can't be undone.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(closed).toBe(1);
  });

  it('shows a toast when a save fails', async () => {
    const user = userEvent.setup();

    function SaveButton() {
      const toast = useToast();
      const save = async () => {
        try {
          throw new Error('That email is already in use.');
        } catch (error) {
          toast.error((error as Error).message);
        }
      };
      return <Button onClick={() => void save()}>Save</Button>;
    }

    renderInApp(<SaveButton />);
    await user.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That email is already in use.');
  });
});
