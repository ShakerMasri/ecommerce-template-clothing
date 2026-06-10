import { RegisterForm } from "~/components/auth/RegisterForm";
import { env } from "~/env";

export default function RegisterPage() {
  const googleSignInEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  return <RegisterForm googleSignInEnabled={googleSignInEnabled} />;
}
