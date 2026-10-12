// The UI component contract: the props of every piece of UI that pages, features and routes may
// use, and the theme tokens. Each UI template under ./templates/<name>/ implements all of it, and
// its implementation object must satisfy UiTemplate, so a missing or changed piece fails the type
// check.
//
// A page needs a piece the set lacks? Add it here first (name and props), then implement it in the
// current template with a test, then use it. Never import the template's own library in a page.
import type { ComponentType, ReactNode } from "react";

// ---------------------------------------------------------------------------------------------
// Theme tokens: the only theme surface the app sees. Values live in ./tokens.ts; each template
// maps them onto its own theme.

/** One colour from lightest to darkest, plus the text colour that reads on `main`. */
export type ColorScale = {
  lighter: string;
  light: string;
  main: string;
  dark: string;
  darker: string;
  contrastText: string;
};

export type NeutralScale = Record<"50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900", string>;

export type ThemeTokens = {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    info: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    neutral: NeutralScale;
  };
  /** Pixels per spacing step. Stack's `gap` and every template spacing use multiples of it. */
  spacing: number;
  /** Corner radius in pixels. */
  radius: { small: number; medium: number; large: number };
  typography: {
    /** Body text. The template loads the font file. */
    fontFamily: string;
    /** Headings. */
    headingFontFamily: string;
    /** Body font size in pixels. */
    fontSize: number;
  };
};

// ---------------------------------------------------------------------------------------------
// Shared value types

/** Icons by meaning. Each template maps a name to its own icon set. */
export type IconName =
  | "home"
  | "dashboard"
  | "user"
  | "users"
  | "settings"
  | "file"
  | "folder"
  | "upload"
  | "download"
  | "add"
  | "edit"
  | "delete"
  | "search"
  | "sign-out"
  | "close"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "menu"
  | "more"
  | "back"
  | "forward"
  | "external"
  | "view"
  | "image"
  | "refresh"
  | "check"
  | "lock"
  | "calendar"
  | "list"
  | "import"
  | "export"
  | "history"
  | "up"
  | "down"
  | "filter";

/** Status colours for alerts and toasts. */
export type Tone = "info" | "success" | "warning" | "error";

/** Multiples of tokens.spacing. */
export type SpaceStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8;

// ---------------------------------------------------------------------------------------------
// Root, shell and page

/** Wraps the whole app: theme, CSS baseline, toasts, anything the template needs at the root. */
export type UiProviderProps = { children: ReactNode };

/** One link in the app navigation. `to` is an app path such as "/users". */
/** `exact` marks the item current only on its own path; otherwise also on paths below it. */
export type NavItem = { label: string; to: string; icon?: IconName; children?: NavItem[]; exact?: boolean };

/** A titled group of navigation links. */
export type NavGroup = { title?: string; items: NavItem[] };

/** The app frame around every in-app page: header, navigation, main area. */
export type AppShellProps = {
  children: ReactNode;
  navigation: NavGroup[];
  /** The navigation's accessible name, also the phone menu button's name. */
  navLabel: string;
  /** Right side of the header, for example the signed-in user's menu. */
  headerActions?: ReactNode;
};

/** One page's main content, with its heading and the document title. */
export type PageProps = {
  title: string;
  description?: string;
  /** Buttons next to the heading, for example "Add user". */
  actions?: ReactNode;
  children?: ReactNode;
  /** Above the heading, for example Breadcrumbs. */
  breadcrumbs?: ReactNode;
  /** Small labels next to the heading, for example a Badge with the status. */
  badges?: ReactNode;
  /** The browser tab title. Defaults to `title`; false leaves document.title to the caller. */
  documentTitle?: string | false;
};

/** The frame of the sign-in page. The form inside comes from the login pack. */
export type SignInLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** The large side panel's heading and line under it (shown on wide screens). */
  asideTitle?: string;
  asideSubtitle?: string;
  /** Right side of the header, for example a language switch. */
  headerActions?: ReactNode;
  /** The browser tab title. Defaults to `title`; false leaves document.title to the caller. */
  documentTitle?: string | false;
};

/** A full-page error: not found, not allowed, a crashed route. `action` is usually a LinkButton home. */
export type ErrorScreenProps = { title: string; message: string; action?: ReactNode; kind?: "not-found" | "forbidden" | "error" };

// ---------------------------------------------------------------------------------------------
// Layout and text

/** Lays children out in a row or column with even gaps. */
export type StackProps = {
  children: ReactNode;
  direction?: "row" | "column";
  gap?: SpaceStep;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  /** Space inside the edges. */
  padding?: SpaceStep;
  /** A list of items (role list), or one item in such a list. */
  role?: "list" | "listitem";
  /** A thin line between the children, for a compact list inside a card. */
  divided?: boolean;
};

export type HeadingProps = { children: ReactNode; level?: 2 | 3 | 4 };

export type TextProps = {
  children: ReactNode;
  tone?: "default" | "muted" | "error" | "warning" | "success";
  size?: "body" | "small" | "caption";
  weight?: "regular" | "medium" | "bold";
  /** Fixed-width letters, for keys and codes. */
  mono?: boolean;
  /** Digits of equal width, for numbers in columns. */
  tabular?: boolean;
  /** One line, cut with an ellipsis; `title` shows the whole text on hover. */
  truncate?: boolean;
  title?: string;
  /** Inside a line of other text (a span), not a paragraph of its own. */
  inline?: boolean;
  align?: "start" | "center" | "end";
};

/** Decorative unless `label` is given, which makes it an image with that name. */
export type IconProps = { name: IconName; label?: string; size?: number };

// ---------------------------------------------------------------------------------------------
// Actions

type ButtonLook = { variant?: "primary" | "secondary" | "text" | "danger" | "danger-text"; startIcon?: IconName; fullWidth?: boolean };

export type ButtonProps = ButtonLook & {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Shows progress and blocks clicks while an action runs (RE-FX-03). */
  loading?: boolean;
  /** Takes focus when it appears, for example the safe choice in a confirm dialog. */
  autoFocus?: boolean;
  /** Shown on hover, for example why a disabled button can't be used. */
  title?: string;
  size?: "small" | "medium";
};

/** A link to a route inside the app, styled as a button. `to` is an app path such as "/". */
/** `current` marks the link to the page being shown (aria-current="page"), for example in a row of tabs. */
export type LinkButtonProps = ButtonLook & { to: string; children: ReactNode; current?: boolean; size?: "small" | "medium" };

// ---------------------------------------------------------------------------------------------
// Fields and forms

type FieldBase = {
  label: string;
  name?: string;
  /** The error message under the field. Present means invalid. */
  error?: string;
  /** Help text under the field, kept under the error when both are present. */
  hint?: string;
  required?: boolean;
  /** false: the label already shows its own mark ("Name *"), so no second star; the field is still announced as required. */
  requiredMark?: boolean;
  disabled?: boolean;
};

export type TextFieldProps = FieldBase & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  placeholder?: string;
  /** Several lines of text. */
  rows?: number;
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number" | "date";
  maxLength?: number;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search";
  readOnly?: boolean;
  autoFocus?: boolean;
  /** Hides the label visually; it stays the field's accessible name. */
  hideLabel?: boolean;
  /** Text or an icon inside the field, before the value (for example "৳"). */
  prefix?: ReactNode;
  /** Text inside the field after the value, announced politely when it changes (for example a live preview). */
  suffix?: ReactNode;
  /** Values offered while typing (a datalist); any other text is still allowed. */
  suggestions?: readonly string[];
  /** Fixed-width letters, for keys and codes. */
  mono?: boolean;
  /** Marks the field invalid when its message is shown elsewhere (no `error` text under it). */
  invalid?: boolean;
  size?: "small" | "medium";
};

/** `group` puts the option under that heading (an optgroup); options of one group stay together, in order. */
export type SelectOption = { value: string; label: string; disabled?: boolean; group?: string };

export type SelectFieldProps = FieldBase & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly SelectOption[];
  hideLabel?: boolean;
  size?: "small" | "medium";
};

/** A checkbox with its label. `hint` sits under the label. */
export type CheckboxProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  hint?: ReactNode;
  disabled?: boolean;
  /** Some but not all of a group are checked. */
  indeterminate?: boolean;
  /** Hides the label visually (a table's row checkbox); it stays the accessible name. */
  hideLabel?: boolean;
};

export type RadioOption = { value: string; label: ReactNode; hint?: ReactNode; disabled?: boolean };

/** A labelled group of radio buttons (a fieldset with a legend). */
export type RadioGroupProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly RadioOption[];
  name?: string;
  direction?: "row" | "column";
  /** Hides the legend visually; it stays the group's accessible name. */
  hideLabel?: boolean;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  /** Options drawn as bordered cards, for choices with a hint under each. */
  look?: "plain" | "cards";
};

/** A bordered group of related fields: a real fieldset named by its legend (role group). */
export type FieldGroupProps = { legend: string; children: ReactNode; disabled?: boolean };

/** Progress of a running task. `value` 0-100; leave it out while the amount is unknown. */
export type ProgressBarProps = { value?: number; label?: string };

/**
 * Picks files with a real, visually hidden <input type="file"> named by `label`, behind a button.
 * `onFiles` gets the chosen files; the input is cleared after each pick so the same file can be picked again.
 */
export type FileInputProps = {
  label: string;
  buttonLabel: string;
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  hint?: ReactNode;
  /**
   * true (default): the input is cleared after each pick, so picking the same file again works, and an
   * empty pick is ignored. false: it behaves as a plain file input: the choice stays, every picked file
   * is passed on (accept only filters the picker), and an empty pick (picker cancelled) calls onFiles([]).
   */
  clearAfterPick?: boolean;
  /**
   * "button" is a plain button showing `buttonLabel`. "dropzone" is a large area that opens the picker
   * when clicked and takes dropped files, with `buttonLabel` as its main line.
   */
  look?: "button" | "dropzone";
};

// This app has no Form* pieces: the admin forms keep their own state code, and the app has no
// react-hook-form or zod (src/ui/templates/minimal/UPSTREAM.md, "This app").

// ---------------------------------------------------------------------------------------------
// Overlays and feedback

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons at the bottom, for example Cancel and Save. */
  actions?: ReactNode;
  size?: "small" | "medium" | "large";
};

export type AlertProps = { tone: Tone; title?: string; children: ReactNode; action?: ReactNode };

/** A side panel over the page (role dialog, named by `title`). Esc and the backdrop call onClose. */
export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The close button's accessible name. */
  closeLabel: string;
  children: ReactNode;
  actions?: ReactNode;
  side?: "left" | "right";
  width?: "small" | "medium" | "large";
};

export type MenuItemSpec =
  | { kind?: "action"; label: string; onClick: () => void; icon?: IconName; tone?: "default" | "danger"; disabled?: boolean }
  | { kind: "link"; label: string; to: string; icon?: IconName }
  | { kind: "divider" };

/** A button that opens a list of actions and links. */
export type MenuProps = {
  /** The button's accessible name. */
  label: string;
  /** What the button shows, for example an avatar; defaults to a "more" icon. */
  trigger?: ReactNode;
  /** Shown at the top of the open menu, for example the signed-in user's name. */
  header?: ReactNode;
  items: readonly MenuItemSpec[];
};

export type ToastOptions = { tone?: Tone };

/** Shows short messages that disappear on their own. Use it in TanStack Query `onError`/`onSuccess`. */
export type ToastApi = {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

export type LoadingStateProps = { label?: string };

export type EmptyStateProps = { title: string; description?: string; action?: ReactNode; icon?: IconName };

// ---------------------------------------------------------------------------------------------
// Data

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  /** The header as text, for the phone card layout when `header` is not a string. */
  headerText?: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
  /** A cell in the table's footer row under this column, for example a page total. */
  footer?: ReactNode;
};

export type DataTableProps<Row> = {
  /** Accessible name of the table. */
  label: string;
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  /** A stable id from the data (RE-CMP-01). */
  getRowId: (row: Row) => string;
  /** True while the rows load, for example a query's isPending. */
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingLabel?: string;
  /** Below 600px wide, draw each row as a card of "header: value" lines instead of a table. */
  cardsOnPhones?: boolean;
  /** The columns a phone card shows, when they differ from the table's (defaults to `columns`). */
  phoneColumns?: readonly DataTableColumn<Row>[];
  /** Shown under the cards on a phone, in place of the table's footer row. */
  phoneFooter?: ReactNode;
  /** A phone card's heading, for example the person's name, above its "header: value" lines. */
  phoneTitle?: (row: Row) => ReactNode;
  /** Controls at the end of a phone card's heading row, for example a checkbox or an edit link. */
  phoneActions?: (row: Row) => ReactNode;
  /** Smaller rows. */
  dense?: boolean;
};

/** A white surface that groups related content, with an optional heading and actions. */
export type CardProps = {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** The heading level of `title`. */
  level?: 2 | 3;
  /** "none" for content that brings its own padding, such as a table. */
  padding?: "normal" | "none";
  /** A number shown in a circle before the title, for numbered steps. */
  step?: string;
  /** The step number is part of the heading's accessible name ("২ কলাম ম্যাপিং"); by default it is decorative. */
  stepAnnounced?: boolean;
  /** A small line above the title, for example the kind of item. */
  eyebrow?: string;
  /** A coloured bar on the left, for example to mark a child item under its parent. */
  accent?: boolean;
  tone?: "default" | "danger" | "warning";
};

/** A row of tabs. Panels are the caller's: render the panel for `value` under it. */
export type TabsProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tabs: readonly { value: string; label: string }[];
};

/** A responsive grid. `columns` per screen width; it falls back to the next smaller width given. */
export type GridProps = {
  children: ReactNode;
  columns?: { xs?: 1 | 2 | 3 | 4; sm?: 1 | 2 | 3 | 4; md?: 1 | 2 | 3 | 4; lg?: 1 | 2 | 3 | 4 | 5 | 6 };
  gap?: SpaceStep;
};

/** Small labelled figures in a row (a description list). */
export type StatListProps = {
  items: readonly { label: string; value: ReactNode; tone?: "default" | "warning" }[];
};

/** A link to a route inside the app, styled as text. */
export type TextLinkProps = { to: string; children: ReactNode };

/**
 * The filters above a list. On a phone the fields fold behind one button that names how many filters
 * are on; from a tablet up they are always shown, with the clear button in the panel's heading.
 */
export type FilterPanelProps = {
  /** The filter fields, laid out by the caller (usually a Grid). */
  children: ReactNode;
  /** The panel's heading and the phone button's text, for example "ফিল্টার". */
  label: string;
  /** How many filters are on; 0 disables the clear button. */
  activeCount: number;
  onClear: () => void;
  clearLabel: string;
  /** A short line under the fields, for example why a list of options didn't load. */
  note?: ReactNode;
};

/** A form's Save and Cancel row that stays at the bottom of the window while a long form scrolls. */
export type ActionBarProps = { children: ReactNode; label: string };

/** A summary line that shows or hides more content (a native details element). */
export type DisclosureProps = { summary: ReactNode; children: ReactNode; defaultOpen?: boolean };

export type BadgeProps = { children: ReactNode; tone?: "neutral" | "success" | "warning" | "error" | "info" };

/** Page numbers with previous and next. Labels come from the app, so numbers can be shown in Bengali. */
export type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  /** The nav's accessible name. */
  label: string;
  /** For example "showing 1-20 of 120", announced politely. */
  summary?: string;
  prevLabel: string;
  nextLabel: string;
  prevText: string;
  nextText: string;
  /** The accessible name of a page button. */
  pageLabel: (page: number) => string;
  /** How a page number is written on its button. */
  formatPage?: (page: number) => string;
};

/** A row of toggle buttons for one choice (aria-pressed), named as a group. */
export type ToggleGroupProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string; lang?: string }[];
};

export type BreadcrumbsProps = { label: string; items: readonly { label: string; to?: string }[] };

/** An icon-only button. `label` is its accessible name and tooltip. */
export type IconButtonProps = {
  icon: IconName;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "danger" | "primary";
};

// ---------------------------------------------------------------------------------------------
// The whole set. A template's index.ts builds an object that `satisfies UiTemplate`.

export type UiTemplate = {
  UiProvider: ComponentType<UiProviderProps>;
  AppShell: ComponentType<AppShellProps>;
  Page: ComponentType<PageProps>;
  SignInLayout: ComponentType<SignInLayoutProps>;
  ErrorScreen: ComponentType<ErrorScreenProps>;
  Stack: ComponentType<StackProps>;
  Heading: ComponentType<HeadingProps>;
  Text: ComponentType<TextProps>;
  Icon: ComponentType<IconProps>;
  Button: ComponentType<ButtonProps>;
  LinkButton: ComponentType<LinkButtonProps>;
  TextField: ComponentType<TextFieldProps>;
  SelectField: ComponentType<SelectFieldProps>;
  Dialog: ComponentType<DialogProps>;
  Alert: ComponentType<AlertProps>;
  useToast: () => ToastApi;
  LoadingState: ComponentType<LoadingStateProps>;
  EmptyState: ComponentType<EmptyStateProps>;
  DataTable: <Row>(props: DataTableProps<Row>) => ReactNode;
  Card: ComponentType<CardProps>;
  Tabs: ComponentType<TabsProps>;
  Drawer: ComponentType<DrawerProps>;
  Badge: ComponentType<BadgeProps>;
  Checkbox: ComponentType<CheckboxProps>;
  RadioGroup: ComponentType<RadioGroupProps>;
  Pagination: ComponentType<PaginationProps>;
  FileInput: ComponentType<FileInputProps>;
  Menu: ComponentType<MenuProps>;
  Breadcrumbs: ComponentType<BreadcrumbsProps>;
  IconButton: ComponentType<IconButtonProps>;
  ToggleGroup: ComponentType<ToggleGroupProps>;
  FieldGroup: ComponentType<FieldGroupProps>;
  Grid: ComponentType<GridProps>;
  StatList: ComponentType<StatListProps>;
  TextLink: ComponentType<TextLinkProps>;
  Disclosure: ComponentType<DisclosureProps>;
  FilterPanel: ComponentType<FilterPanelProps>;
  ActionBar: ComponentType<ActionBarProps>;
  ProgressBar: ComponentType<ProgressBarProps>;
};
