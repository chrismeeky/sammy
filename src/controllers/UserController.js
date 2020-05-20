import { User, Otp } from "../models";
import { HelperMethods, CryptData, TokenService } from "../utils";
import Nexmo from "nexmo";

/**
 * Class representing the user controller
 * @class UserController
 * @description users controller
 */
class UserController {
  constructor() {}

  static async validatePhone(req, res) {
    const NEXMO_API_KEY = process.env.NEXMO_API_KEY;
    const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET;
    const NEXMO_BRAND_NAME = process.env.NEXMO_BRAND_NAME;
    const nexmo = new Nexmo({
      apiKey: NEXMO_API_KEY,
      apiSecret: NEXMO_API_SECRET,
    });
    const OTP = Math.floor(Math.random() * 1000000);
    try {
      const { phone } = req.body;
      const from = NEXMO_BRAND_NAME;
      const to = phone;
      const text = `OTP code for your BloomRydes verification is ${OTP} . Thank you`;
      const userFound = await User.findOne({ phone });
      if (userFound) {
        return HelperMethods.clientError(res, {
          status: false,
          message: `Phone number is registered. Please proceed to login`,
        });
      }
      const newOtp = new Otp({ phone, otp: OTP });
      await newOtp.save();
      const token = await TokenService.getToken({ phone, OTP }, "1h");
      nexmo.message.sendSms(from, to, text, (err, responseData) => {
        const errorMessage = {
          status: false,
          phone,
          otp: OTP,
          message: `Unable to send to ${phone} Please try again later`,
          has_password: false,
        };
        if (err) {
          return HelperMethods.clientError(res, errorMessage);
        } else {
          if (responseData.messages[0]["status"] === "0") {
            return HelperMethods.requestSuccessful(
              res,
              {
                status: true,
                phone,
                otp: OTP,
                token,
                message: `OTP Sent to ${phone}`,
                has_password: true,
              },
              200
            );
          } else {
            return HelperMethods.clientError(res, errorMessage);
          }
        }
      });
    } catch (error) {
      return HelperMethods.serverError(res, error.message);
    }
  }
  static async loginWithPasswordOrToken(req, res) {
    try {
      const errorResponse = {
        1: {
          status: false,
          message: "incorrect login code",
        },
        2: {
          status: false,
          message: "incorrect login details",
        },
      };
      const { phone, password, token, channel, otp } = req.body;

      if (token) {
        const result = await TokenService.verifyToken(token);
        if (
          result.success &&
          result.data.phone.toString() == phone.toString() &&
          result.data.OTP == otp
        ) {
          return HelperMethods.requestSuccessful(
            res,
            {
              id: null,
              name: null,
              phone,
              email: null,
              status: true,
            },
            200
          );
        }
      }
      if (password) {
        const userFound = await User.findOne({ phone });
        if (!userFound) {
          return res.status(400).json(errorResponse[channel]);
        }
        const isPasswordValid = await CryptData.decryptData(
          password,
          userFound.password
        );
        if (isPasswordValid) {
          return HelperMethods.requestSuccessful(
            res,
            {
              id: userFound.id,
              name: userFound.name,
              phone,
              email: userFound.email,
              status: true,
            },
            200
          );
        }
      }

      return res.status(401).json(errorResponse[channel]);
    } catch (error) {
      return HelperMethods.serverError(res, error.message);
    }
  }
  /**
   * Sign up a user
   * Route: POST: /auth/signup
   * @param {object} req - HTTP Request object
   * @param {object} res - HTTP Response object
   * @return {res} res - HTTP Response object
   * @memberof UserController
   */
  static async signUp(req, res) {
    const { email, password } = req.body;
    try {
      const users = await User.find();
      const id = users.length + 1;
      const userExist = await User.findOne({ email });

      if (userExist) {
        return res.status(401).json({
          status: false,
          message: "Email address is currently being used by another account",
        });
      }

      req.body.password = await CryptData.encryptData(password);
      const user = new User({ ...req.body, id });
      const userCreated = await user.save();
      if (userCreated) {
        const { name, email, phone } = req.body;
        return HelperMethods.requestSuccessful(
          res,
          {
            id,
            name,
            phone,
            email,
            id,
            status: true,
          },
          200
        );
      }
    } catch (error) {
      return HelperMethods.serverError(res, error.message);
    }
  }

  /**
   *
   * @description method that updates user's profile
   * @static
   * @param {object} req HTTP Request object
   * @param {object} res HTTP Response object
   * @returns {object} HTTP Response object
   * @memberof ProfileController
   */
  static async updateProfile(req, res) {
    const { user_id } = req.body;
    try {
      const userExist = await User.findOne({ id: user_id });
      if (userExist) {
        if (req.body.email) {
          const emailExist = await User.findOne({
            email: req.body.email,
          });

          if (emailExist) {
            return HelperMethods.clientError(res, "email already exists");
          }
        }

        if (req.body.password) {
          userExist.password = await CryptData.encryptData(req.body.password);
        }
        const isUserUpdated = await User.updateOne(
          { id: user_id },
          { $set: req.body }
        );
        if (isUserUpdated) {
          const updatedUser = await User.findOne({ id: user_id });
          const { name, email, phone } = updatedUser;
          return HelperMethods.requestSuccessful(
            res,
            {
              status: true,
              data: { id: user_id, name, phone, email, role: userExist.role },
            },
            200
          );
        }
      }
      return HelperMethods.clientError(res, "User does not exist", 404);
    } catch (error) {
      return HelperMethods.serverError(res, error.message);
    }
  }
  /**
   *
   * @description method that gets current user's settings
   * @static
   * @param {object} req client request
   * @param {object} res server response
   * @returns {object} server response object
   * @memberof ProfileController
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findOne({ _id: req.body.id });
      if (user) {
        return HelperMethods.requestSuccessful(
          res,
          {
            success: true,
            userDetails: user,
          },
          200
        );
      }
      return HelperMethods.clientError(res, "User not found", 404);
    } catch (error) {
      return HelperMethods.serverError(res);
    }
  }
  /**
   *
   * @description method that gets all user's settings
   * @static
   * @param {object} req client request
   * @param {object} res server response
   * @returns {object} server response object
   * @memberof ProfileController
   */
  static async getProfiles(req, res) {
    const payload = req.decoded;

    try {
      if (payload.role !== "Super Administrator") {
        return HelperMethods.clientError(
          res,
          "Only a super admin" + " can view all users",
          401
        );
      }
      const users = await User.find({});
      if (users) {
        return HelperMethods.requestSuccessful(
          res,
          {
            success: true,
            userDetails: users,
          },
          200
        );
      }
      return HelperMethods.clientError(res, "Users not found", 404);
    } catch (error) {
      return HelperMethods.serverError(res);
    }
  }
  /**
   *
   * @description method that gets current user's settings
   * @static
   * @param {object} req client request
   * @param {object} res server response
   * @returns {object} server response object
   * @memberof ProfileController
   */
  static async deleteUser(req, res) {
    try {
      const user = await User.findOne({ _id: req.body.id });
      if (user) {
        const deletedUser = User.deleteOne({ _id: req.body.id });
        if (deletedUser) {
          return HelperMethods.requestSuccessful(
            res,
            {
              success: true,
              message: "user deleted successfully",
            },
            200
          );
        }
      }
      return HelperMethods.clientError(res, "User not found", 404);
    } catch (error) {
      return HelperMethods.serverError(res);
    }
  }
  /**
   * Verify a user's email
   * Route: POST: /update_user
   * @param {object} req - HTTP Request object
   * @param {object} res - HTTP Response object
   * @return {res} res - HTTP Response object
   * @memberof UserController
   */
  static async updateUserRole(req, res) {
    const payload = req.decoded;
    const { role, email } = req.body;
    try {
      if (payload.role !== "Super Administrator") {
        return HelperMethods.clientError(
          res,
          "Only a super admin" + " can update user role",
          401
        );
      }
      const userToUpdate = await User.findOne({ email });
      if (!userToUpdate) {
        return HelperMethods.clientError(res, "User not found", 404);
      }
      if (userToUpdate.role === role) {
        return HelperMethods.clientError(res, `user is already a ${role}`, 409);
      }
      await User.updateOne({ email }, { $set: { role } });
      return HelperMethods.requestSuccessful(
        res,
        {
          success: true,
          message: "Role updated successfully",
        },
        200
      );
    } catch (error) {
      if (error.errors)
        return HelperMethods.sequelizeValidationError(res, error);
      return HelperMethods.serverError(res);
    }
  }
}

export default UserController;
