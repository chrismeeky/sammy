import authRoute from './authRoute';
import userRoute from './userRoute';

const routes = app => {
  authRoute(app);
  userRoute(app);
};
export default routes;
