import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AuthForm from "../auth-form";

describe("AuthForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onForgotPassword: vi.fn(),
    isSubmitting: false,
  };

  it("renders sign-in form by default with email and password fields", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    expect(submitButton).toHaveTextContent("Sign In");
  });

  it("toggles between Sign In and Sign Up tabs", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const tabs = screen
      .getByLabelText("Email")
      .closest("form")!
      .querySelector(".bg-muted")!;
    const signUpTab = within(tabs as HTMLElement).getByText("Sign Up");
    await user.click(signUpTab);

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    expect(submitButton).toHaveTextContent("Sign Up");
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "short");

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    await user.click(submitButton);

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct flow, email, and password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      "signIn",
      "test@example.com",
      "password123",
    );
  });

  it("disables submit button when isSubmitting is true", () => {
    render(<AuthForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
  });

  it("shows forgot password link on sign-in tab", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("hides forgot password link on sign-up tab", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const tabs = screen
      .getByLabelText("Email")
      .closest("form")!
      .querySelector(".bg-muted")!;
    await user.click(within(tabs as HTMLElement).getByText("Sign Up"));

    expect(screen.queryByText("Forgot password?")).not.toBeInTheDocument();
  });

  it("calls onForgotPassword when forgot link is clicked", async () => {
    const user = userEvent.setup();
    const onForgotPassword = vi.fn();
    render(<AuthForm {...defaultProps} onForgotPassword={onForgotPassword} />);

    await user.click(screen.getByText("Forgot password?"));
    expect(onForgotPassword).toHaveBeenCalled();
  });

  it("shows password strength hints during sign-up when password is non-empty", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const tabs = screen
      .getByLabelText("Email")
      .closest("form")!
      .querySelector(".bg-muted")!;
    await user.click(within(tabs as HTMLElement).getByText("Sign Up"));
    await user.type(screen.getByLabelText("Password"), "a");

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("One lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("One number")).toBeInTheDocument();
    expect(screen.getByText("One special character")).toBeInTheDocument();
  });

  it("does not show password hints on sign-in tab", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Password"), "a");

    expect(screen.queryByText("At least 8 characters")).not.toBeInTheDocument();
  });
});
