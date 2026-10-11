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
  | "error";

/** Status colours for alerts and toasts. */
export type Tone = "info" | "success" | "warning" | "error";

/** Multiples of tokens.spacing. */
export type SpaceStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8;

// ---------------------------------------------------------------------------------------------
// Root, shell and page

/** Wraps the whole app: theme, CSS baseline, toasts, anything the template needs at the root. */
export type UiProviderProps = { children: ReactNode };

/** One link in the app navigation. `to` is an app path such as "/users". */
export type NavItem = { label: string; to: string; icon?: IconName; children?: NavItem[] };

/** A titled group of navigation links. */
export type NavGroup = { title?: string; items: NavItem[] };

/** The app frame around every in-app page: header, navigation, main area. */
export type AppShellProps = {
  children: ReactNode;
  navigation: NavGroup[];
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
};

/** The frame of the sign-in page. The form inside comes from the login pack. */
export type SignInLayoutProps = { title: string; description?: string; children: ReactNode };

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
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
  autoComplete?: string;
  placeholder?: string;
  /** Several lines of text. */
  rows?: number;
};

export type SelectOption = { value: string; label: string };

export type SelectFieldProps = FieldBase & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly SelectOption[];
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
  header: string;
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
};
