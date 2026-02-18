import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SettingsForm from "../settings-form";

describe("SettingsForm", () => {
  const defaultValues = {
    displayName: "Alice",
    openRouterApiKey: "key-123",
  };

  it("renders initial values", () => {
    render(<SettingsForm initialValues={defaultValues} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Display Name")).toHaveValue("Alice");
    expect(screen.getByLabelText("OpenRouter API Key")).toHaveValue("key-123");
  });

  it("save button is disabled when unchanged", () => {
    render(<SettingsForm initialValues={defaultValues} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("calls onSubmit with trimmed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SettingsForm initialValues={defaultValues} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText("Display Name");
    await user.clear(nameInput);
    await user.type(nameInput, "  Bob  ");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await user.click(saveButton);

    expect(onSubmit).toHaveBeenCalledWith({
      displayName: "Bob",
      openRouterApiKey: "key-123",
    });
  });
});
