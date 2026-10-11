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
  | "history";

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
};

export type HeadingProps = { children: ReactNode; level?: 2 | 3 | 4 };

export type TextProps = { children: ReactNode; tone?: "default" | "muted" | "error"; size?: "body" | "small" };

/** Decorative unless `label` is given, which makes it an image with that name. */
export type IconProps = { name: IconName; label?: string; size?: number };

// ---------------------------------------------------------------------------------------------
// Actions

type ButtonLook = { variant?: "primary" | "secondary" | "text" | "danger"; startIcon?: IconName; fullWidth?: boolean };

export type ButtonProps = ButtonLook & {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Shows progress and blocks clicks while an action runs (RE-FX-03). */
  loading?: boolean;
};

/** A link to a route inside the app, styled as a button. `to` is an app path such as "/". */
export type LinkButtonProps = ButtonLook & { to: string; children: ReactNode };

// ---------------------------------------------------------------------------------------------
// Fields and forms

type FieldBase = {
  label: string;
  name?: string;
  /** The error message under the field. Present means invalid. */
  error?: string;
  /** Help text under the field when there is no error. */
  hint?: string;
  required?: boolean;
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
  size?: "small" | "medium";
};

export type SelectOption = { value: string; label: string; disabled?: boolean };

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
  /** "button" is a plain button; "dropzone" is a large area that also takes dropped files. */
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
  tone?: "default" | "danger" | "warning";
};

/** A row of tabs. Panels are the caller's: render the panel for `value` under it. */
export type TabsProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tabs: readonly { value: string; label: string }[];
};

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
};
