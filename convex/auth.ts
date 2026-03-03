import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";
import { ResendOTP } from "./ResendOTP";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { validatePasswordRequirements } from "./password_validation";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Anonymous,
    Password<DataModel>({
      verify: ResendOTP,
      reset: ResendOTPPasswordReset,
      validatePasswordRequirements,
    }),
  ],
});
