import { UserController } from '../controllers';
import Validate from '../validation';

const userRoutes = app => {

  app.patch(
    '/api/v1/update-profile',
    Validate.validateUpdateProfile,
    UserController.updateProfile
  );
};

export default userRoutes;
