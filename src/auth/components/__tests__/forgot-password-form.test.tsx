import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ForgotPasswordForm from "../forgot-password-form";

// Mock CodeInput with a plain text input since input-otp's hidden input
// doesn't interact well with userEvent in jsdom.
vi.mock("../code-input", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="code-input"
      name="code"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe("ForgotPasswordForm", () => {
  const defaultProps = {
    onRequestReset: vi.fn().mockResolvedValue("user@example.com"),
    onResetPassword: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  describe("email sub-step", () => {
    it("renders heading and email input", () => {
      render(<ForgotPasswordForm {...defaultProps} />);

      expect(screen.getByText("Reset password")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send reset code" }),
      ).toBeInTheDocument();
    });

    it("calls onRequestReset with email on submission", async () => {
      const user = userEvent.setup();
      const onRequestReset = vi.fn().mockResolvedValue("test@example.com");
      render(
        <ForgotPasswordForm
          {...defaultProps}
          onRequestReset={onRequestReset}
        />,
      );

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.click(screen.getByRole("button", { name: "Send reset code" }));

      expect(onRequestReset).toHaveBeenCalledWith("test@example.com");
    });

    it("calls onCancel when back button clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<ForgotPasswordForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole("button", { name: "Back to sign in" }));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("code sub-step", () => {
    async function renderAtCodeStep() {
      const user = userEvent.setup();
      const onRequestReset = vi.fn().mockResolvedValue("user@example.com");
      const onResetPassword = vi.fn();
      render(
        <ForgotPasswordForm
          {...defaultProps}
          onRequestReset={onRequestReset}
          onResetPassword={onResetPassword}
        />,
      );

      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.click(screen.getByRole("button", { name: "Send reset code" }));

      return { user, onResetPassword };
    }

    it("transitions to code step after successful reset request", async () => {
      await renderAtCodeStep();

      expect(screen.getByText("user@example.com")).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
    });

    it("calls onResetPassword with email, code, and new password", async () => {
      const { user, onResetPassword } = await renderAtCodeStep();

      const codeInput = screen.getByTestId("code-input");
      await user.clear(codeInput);
      await user.type(codeInput, "87654321");
      await user.type(screen.getByLabelText("New password"), "NewPass1!");

      await user.click(screen.getByRole("button", { name: "Reset password" }));

      expect(onResetPassword).toHaveBeenCalledWith(
        "user@example.com",
        "87654321",
        "NewPass1!",
      );
    });

    it("shows cancel button on code sub-step", async () => {
      await renderAtCodeStep();

      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });
  });

  it("shows loading text when isSubmitting on email step", () => {
    render(<ForgotPasswordForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  });
});
