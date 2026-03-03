import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import VerifyCodeForm from "../verify-code-form";

// Mock CodeInput with a plain text input since input-otp's hidden input
// doesn't interact well with userEvent in jsdom.
vi.mock("../code-input", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (v: string) => void;
  }) => (
    <input
      data-testid="code-input"
      name="code"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe("VerifyCodeForm", () => {
  const defaultProps = {
    email: "user@example.com",
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  it("renders heading and email", () => {
    render(<VerifyCodeForm {...defaultProps} />);

    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("renders verify button disabled until 8 digits entered", () => {
    render(<VerifyCodeForm {...defaultProps} />);

    const verifyButton = screen.getByRole("button", { name: "Verify" });
    expect(verifyButton).toBeDisabled();
  });

  it("calls onSubmit with email and code on form submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VerifyCodeForm {...defaultProps} onSubmit={onSubmit} />);

    const codeInput = screen.getByTestId("code-input");
    await user.clear(codeInput);
    await user.type(codeInput, "12345678");

    const verifyButton = screen.getByRole("button", { name: "Verify" });
    await user.click(verifyButton);

    expect(onSubmit).toHaveBeenCalledWith("user@example.com", "12345678");
  });

  it("calls onCancel when back button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<VerifyCodeForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows loading text when isSubmitting", () => {
    render(<VerifyCodeForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Verifying..." })).toBeDisabled();
  });
});
