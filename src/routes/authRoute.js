import { UserController } from "../controllers";
import Validate from "../validation";

const authRoutes = (app) => {
  app.post(
    "/api/v1/auth/register",
    Validate.validateUserInput,
    UserController.signUp
  );
  app.post(
    "/api/v1/auth/password",
    Validate.validateUserLogin,
    UserController.loginWithPasswordOrToken
  );
  app.post(
    "/api/v1/auth/login",
    Validate.validateUserLogin,
    UserController.validatePhone
  );
};

export default authRoutes;
