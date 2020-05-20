import { UserController } from "../controllers";
import Validate from "../validation";
import { Authorization } from "../middlewares";
const userRoutes = (app) => {
  app.patch(
    "/api/v1/update-profile",
    Authorization.checkToken,
    Validate.validateUpdateProfile,
    UserController.updateProfile
  );
  app.patch(
    "/api/v1/update_user",
    Authorization.checkToken,
    Validate.validateRoleUpdate,
    UserController.updateUserRole
  );
  app.get(
    "/api/v1/profile",
    Authorization.checkToken,
    UserController.getProfile
  );
  app.get(
    "/api/v1/profiles",
    Authorization.checkToken,
    UserController.getProfiles
  );
  app.delete(
    "/api/v1/profile",
    Authorization.checkToken,
    UserController.deleteUser
  );
};

export default userRoutes;
