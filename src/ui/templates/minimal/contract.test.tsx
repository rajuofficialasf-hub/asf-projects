// @vitest-environment jsdom
// The Minimal template against the UI contract: every component renders with an accessible role or
// label, the data table has its empty and loading states, and a failed save shows a toast. This app
// has no Form* pieces (UPSTREAM.md, "This app").
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';

import { useState } from 'react';

import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { it, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, within, waitFor, fireEvent } from '@testing-library/react';

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
  Card,
  Tabs,
  Menu,
  Badge,
  Drawer,
  Checkbox,
  FileInput,
  RadioGroup,
  Pagination,
  IconButton,
  Breadcrumbs,
  ToggleGroup,
} from './index';
import { pageItems } from './components/pagination';

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
        navLabel="Main menu"
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

    await user.click(screen.getByRole('button', { name: 'Main menu' }));
    const nav = await screen.findByRole('navigation', { name: 'Main menu' });
    expect(within(nav).getByRole('link', { name: 'Members' })).toHaveAttribute('href', '/members');
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

// ----------------------------------------------------------------------

describe('pieces the admin added to the set', () => {
  it('names a card section by its title and shows a step number', async () => {
    renderInApp(
      <Card title="Basics" description="Name and link" step="১" actions={<Button>Edit</Button>}>
        <Text>Body</Text>
      </Card>
    );
    const section = await screen.findByRole('region', { name: 'Basics' });
    expect(within(section).getByRole('heading', { level: 2, name: 'Basics' })).toBeInTheDocument();
    expect(within(section).getByText('১')).toHaveAttribute('aria-hidden', 'true');
    expect(within(section).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('switches tabs and marks the selected one', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [tab, setTab] = useState('general');
      return (
        <>
          <Tabs
            label="Settings parts"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'general', label: 'General' },
              { value: 'fields', label: 'Fields' },
            ]}
          />
          <Text>{`panel:${tab}`}</Text>
        </>
      );
    }
    renderInApp(<Harness />);
    const list = await screen.findByRole('tablist', { name: 'Settings parts' });
    expect(within(list).getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
    await user.click(within(list).getByRole('tab', { name: 'Fields' }));
    expect(within(list).getByRole('tab', { name: 'Fields' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('panel:fields')).toBeInTheDocument();
  });

  it('opens a drawer as a named dialog that closes on Esc and from its close button', async () => {
    const user = userEvent.setup();
    let closed = 0;
    renderInApp(
      <Drawer open title="Edit field" closeLabel="Close panel" onClose={() => (closed += 1)} actions={<Button>Save</Button>}>
        <Text>Inside</Text>
      </Drawer>
    );
    const dialog = await screen.findByRole('dialog', { name: 'Edit field' });
    expect(within(dialog).getByText('Inside')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(closed).toBe(1);
    await user.click(within(dialog).getByRole('button', { name: 'Close panel' }));
    expect(closed).toBe(2);
  });

  it('renders badges and an icon button named by its label', async () => {
    const user = userEvent.setup();
    let clicks = 0;
    renderInApp(
      <>
        <Badge tone="success">Published</Badge>
        <IconButton icon="delete" label="Delete row" tone="danger" onClick={() => (clicks += 1)} />
        <IconButton icon="edit" label="Edit row" disabled />
      </>
    );
    expect(await screen.findByText('Published')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete row' }));
    expect(clicks).toBe(1);
    expect(screen.getByRole('button', { name: 'Edit row' })).toBeDisabled();
  });

  it('reports checkbox and radio changes, with accessible names and a radio group legend', async () => {
    const user = userEvent.setup();
    const changes: (string | boolean)[] = [];
    renderInApp(
      <>
        <Checkbox label="All projects" hint="Every current and future project" checked={false} onChange={(v) => changes.push(v)} />
        <Checkbox label="Locked" checked disabled onChange={() => {}} />
        <RadioGroup
          label="Role"
          value="editor"
          onChange={(v) => changes.push(v)}
          options={[
            { value: 'admin', label: 'Admin', hint: 'Every project' },
            { value: 'editor', label: 'Editor' },
            { value: 'main', label: 'Main admin', disabled: true },
          ]}
          error="Pick one"
        />
      </>
    );
    await user.click(await screen.findByRole('checkbox', { name: /All projects/ }));
    expect(screen.getByRole('checkbox', { name: 'Locked' })).toBeDisabled();
    const group = screen.getByRole('radiogroup');
    expect(screen.getByRole('group', { name: 'Role' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: 'Editor' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Main admin' })).toBeDisabled();
    await user.click(within(group).getByRole('radio', { name: /Admin\s*Every project/ }));
    expect(changes).toEqual([true, 'admin']);
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one');
  });

  it('pages with previous, next and numbered buttons, disabled at the ends', async () => {
    const user = userEvent.setup();
    const pages: number[] = [];
    renderInApp(
      <Pagination
        page={1}
        totalPages={3}
        onChange={(p) => pages.push(p)}
        label="Pages"
        summary="1-20 of 60"
        prevLabel="Previous page"
        nextLabel="Next page"
        prevText="‹"
        nextText="›"
        pageLabel={(p) => `Page ${p}`}
        formatPage={(p) => ['০', '১', '২', '৩'][p] ?? String(p)}
      />
    );
    const nav = await screen.findByRole('navigation', { name: 'Pages' });
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Page 2' })).toHaveTextContent('২');
    await user.click(within(nav).getByRole('button', { name: 'Next page' }));
    await user.click(within(nav).getByRole('button', { name: 'Page 3' }));
    expect(pages).toEqual([2, 3]);
    expect(screen.getByText('1-20 of 60')).toBeInTheDocument();
  });

  it('picks files through a real input found by its label, and ignores an empty pick', async () => {
    const user = userEvent.setup();
    const picked: string[][] = [];
    renderInApp(
      <FileInput label="Cover photo" buttonLabel="Choose photo" accept="image/*" hint="JPG or PNG" onFiles={(files) => picked.push(files.map((f) => f.name))} />
    );
    const input = await screen.findByLabelText('Cover photo');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAccessibleDescription('JPG or PNG');
    await user.upload(input, new File(['x'], 'house.jpg', { type: 'image/jpeg' }));
    expect(picked).toEqual([['house.jpg']]);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('applies accept to dropped files too, as the picker does', async () => {
    const picked: string[][] = [];
    renderInApp(<FileInput look="dropzone" multiple label="Sheet" buttonLabel="Choose" accept=".csv,image/*" onFiles={(files) => picked.push(files.map((f) => f.name))} />);
    const zone = (await screen.findByRole('button', { name: 'Choose' })).parentElement!;
    const files = [new File(['a'], 'list.CSV'), new File(['b'], 'notes.pdf', { type: 'application/pdf' }), new File(['c'], 'p.png', { type: 'image/png' })];
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(picked).toEqual([['list.CSV', 'p.png']]);
  });

  it('opens a menu, runs an action, and closes on Esc with focus back on its button', async () => {
    const user = userEvent.setup();
    let signedOut = 0;
    renderInApp(
      <Menu
        label="Account"
        header={<Text>amina@example.org</Text>}
        items={[
          { kind: 'link', label: 'Public site', to: '/' },
          { kind: 'divider' },
          { label: 'Sign out', tone: 'danger', onClick: () => (signedOut += 1) },
        ]}
      />
    );
    const button = await screen.findByRole('button', { name: 'Account' });
    await user.click(button);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('amina@example.org')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Public site' })).toHaveAttribute('href', '/');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(button).toHaveFocus();
    await user.click(button);
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(signedOut).toBe(1);
  });

  it('shows breadcrumbs with links and the current page last', async () => {
    renderInApp(<Breadcrumbs label="You are here" items={[{ label: 'Projects', to: '/admin/projects' }, { label: 'Housing' }]} />);
    const nav = await screen.findByRole('navigation', { name: 'You are here' });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/admin/projects');
    expect(within(nav).getByText('Housing')).toHaveAttribute('aria-current', 'page');
  });

  it('draws a field error as an alert, a hidden label as the accessible name, and a page heading with breadcrumbs', async () => {
    renderInApp(
      <Page title="Settings" documentTitle={false} breadcrumbs={<Text>crumbs</Text>} badges={<Badge>Draft</Badge>}>
        <TextField label="Search" hideLabel value="" onChange={() => {}} maxLength={10} />
        <TextField label="Amount" value="" onChange={() => {}} error="Too big" prefix="৳" />
      </Page>
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('crumbs')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute('maxlength', '10');
    expect(screen.getByRole('alert')).toHaveTextContent('Too big');
    expect(screen.getByText('৳')).toBeInTheDocument();
  });
});

// ----------------------------------------------------------------------

describe('living next to the public site', () => {
  it('writes only prefixed theme variables, so Tailwind v4 variables on :root keep their values', async () => {
    renderInApp(<Text>admin</Text>);
    await screen.findByText('admin');
    const css = [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n');
    expect(css).toMatch(/--mui-palette-primary-main/);
    expect(css).not.toMatch(/[{;\s]--spacing\s*:/);
    expect(css).not.toMatch(/[{;\s]--font-[a-z-]+\s*:/);
  });

  it('takes its page-wide rules and <html> marks away when it unmounts, so they never reach public pages', async () => {
    const pageWide = () =>
      [...document.querySelectorAll('style')].some((el) => /(^|\})\s*(html|body|:root|#root)[\s,{]/.test(el.textContent ?? ''));
    const { unmount } = renderInApp(<Text>admin</Text>);
    await screen.findByText('admin');
    expect(pageWide()).toBe(true);
    unmount();
    expect(pageWide()).toBe(false);
    expect(document.documentElement.hasAttribute('dir')).toBe(false);
    expect(document.documentElement.hasAttribute('data-color-scheme')).toBe(false);
  });
});

describe('details of the added pieces', () => {
  it('marks the pressed toggle and reports a new choice, ignoring a click on the pressed one', async () => {
    const user = userEvent.setup();
    const picks: string[] = [];
    renderInApp(
      <ToggleGroup
        label="Language"
        value="bn"
        onChange={(v) => picks.push(v)}
        options={[
          { value: 'bn', label: 'বাং', lang: 'bn' },
          { value: 'en', label: 'EN', lang: 'en' },
        ]}
      />
    );
    const group = await screen.findByRole('group', { name: 'Language' });
    expect(within(group).getByRole('button', { name: 'বাং' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'EN' })).toHaveAttribute('lang', 'en');
    await user.click(within(group).getByRole('button', { name: 'বাং' }));
    await user.click(within(group).getByRole('button', { name: 'EN' }));
    expect(picks).toEqual(['en']);
  });

  it('marks the current nav item, and items below their path unless exact', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <AppShell
              navLabel="Main menu"
              navigation={[
                {
                  items: [
                    { label: 'Home', to: '/admin', exact: true },
                    { label: 'Records', to: '/admin/records/tin' },
                  ],
                },
              ]}
            >
              <Text>page</Text>
            </AppShell>
          ),
        },
      ],
      { initialEntries: ['/admin/records/tin/new'] }
    );
    render(
      <UiProvider>
        <RouterProvider router={router} />
      </UiProvider>
    );
    const nav = await screen.findByRole('navigation', { name: 'Main menu', hidden: true });
    expect(within(nav).getByRole('link', { name: 'Records', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home', hidden: true })).not.toHaveAttribute('aria-current');
  });

  it('lists page numbers with gaps around the current page', () => {
    expect(pageItems(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, '…', 20]);
    expect(pageItems(20, 20)).toEqual([1, '…', 17, 18, 19, 20]);
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps one dropped file when multiple is off, and takes none while disabled', async () => {
    const picked: string[][] = [];
    const { rerender } = render(
      <UiProvider>
        <FileInput look="dropzone" label="Photo" buttonLabel="Choose" onFiles={(f) => picked.push(f.map((x) => x.name))} />
      </UiProvider>
    );
    const zone = screen.getByRole('button', { name: 'Choose' }).parentElement!;
    fireEvent.drop(zone, { dataTransfer: { files: [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')] } });
    expect(picked).toEqual([['a.jpg']]);
    rerender(
      <UiProvider>
        <FileInput look="dropzone" disabled label="Photo" buttonLabel="Choose" onFiles={(f) => picked.push(f.map((x) => x.name))} />
      </UiProvider>
    );
    fireEvent.drop(screen.getByRole('button', { name: 'Choose' }).parentElement!, { dataTransfer: { files: [new File(['c'], 'c.jpg')] } });
    expect(picked).toEqual([['a.jpg']]);
  });

  describe('data table on a phone', () => {
    const original = window.matchMedia;
    afterEach(() => {
      window.matchMedia = original;
    });
    const phoneWidth = () => {
      window.matchMedia = (query: string) =>
        ({
          matches: query.includes('max-width'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) satisfies MediaQueryList;
    };

    it('draws each row as a card of header and value pairs, with node headers named by headerText', async () => {
      phoneWidth();
      renderInApp(
        <DataTable
          label="Members"
          cardsOnPhones
          rows={[{ id: 'm1', name: 'Amina' }]}
          columns={[
            { id: 'name', header: 'Name', cell: (row: Member) => row.name },
            { id: 'pick', header: <span>☑</span>, headerText: 'Select', cell: () => 'yes' },
          ]}
          getRowId={(row) => row.id}
        />
      );
      const region = await screen.findByRole('region', { name: 'Members' });
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      const card = within(region).getByRole('listitem');
      expect(within(card).getAllByRole('term')).toHaveLength(2);
      expect(within(card).getByText('Name')).toBeInTheDocument();
      expect(within(card).getByText('Amina')).toBeInTheDocument();
      expect(within(card).getByText('Select')).toBeInTheDocument();
    });

    it('shows the loading label and the empty card on a phone', async () => {
      phoneWidth();
      const { rerender } = renderInApp(
        <DataTable label="Members" cardsOnPhones loading loadingLabel="Loading members" rows={[]} columns={columns} getRowId={(row) => row.id} />
      );
      expect(await screen.findByRole('status')).toHaveTextContent('Loading members');
      rerender(
        <UiProvider>
          <DataTable label="Members" cardsOnPhones rows={[]} columns={columns} getRowId={(row) => row.id} emptyTitle="No members yet" />
        </UiProvider>
      );
      expect(await screen.findByText('No members yet')).toBeInTheDocument();
    });
  });

  it('uses small rows when dense, and the loading label in the table', async () => {
    renderInApp(<DataTable label="Members" dense loading loadingLabel="Loading members" rows={[]} columns={columns} getRowId={(row) => row.id} />);
    const table = await screen.findByRole('table', { name: 'Members' });
    expect(within(table).getByRole('columnheader', { name: 'Name' }).className).toMatch(/MuiTableCell-sizeSmall/);
    expect(within(table).getByRole('status')).toHaveTextContent('Loading members');
  });
});
