export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const strongPasswordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: "One special character",
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
];
