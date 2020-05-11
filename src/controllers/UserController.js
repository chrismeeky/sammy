import { User } from "../models";
import { HelperMethods, CryptData } from "../utils";

/**
 * Class representing the user controller
 * @class UserController
 * @description users controller
 */
class UserController {
  constructor() {}

  static async validatePhone(req, res) {
    // simulate sending OTP
    const sendOTP = (phone, status) => {
      return {
        status,
        message: status
          ? `OTP Sent to ${phone}`
          : `Unable to send to ${phone} Please try again later`,
      };
    };
    try {
      const { phone } = req.body;
      const userFound = await User.findOne({ phone });

      const isSentOTP = await sendOTP(phone, userFound && !isNaN(userFound.id));
      return HelperMethods.requestSuccessful(
        res,
        {
          status: isSentOTP.status,
          phone,
          otp: this.OTP,
          message: isSentOTP.message,
          has_password: isSentOTP.status,
        },
        isSentOTP.status ? 200 : 400
      );
    } catch (error) {
      return HelperMethods.serverError(res, error.message);
    }
  }
  static async loginWithPasswordOrToken(req, res) {
    const OTP = 456867846;
    // simulate OTP verification
    const verifyOTP = (otp) => {
      return otp == OTP;
    };
    let loggedIn;
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
      const { phone, password, token, channel } = req.body;
      const userFound = await User.findOne({ phone });

      if (!userFound) {
        return res.status(400).json(errorResponse[channel]);
      }
      if (token) {
        const isVerifiyToken = await verifyOTP(token);
        loggedIn = isVerifiyToken;
      }
      if (password) {
        const isPasswordValid = await CryptData.decryptData(
          password,
          userFound.password
        );
        loggedIn = isPasswordValid;
      }
      if (loggedIn) {
        return HelperMethods.requestSuccessful(
          res,
          {
            id: userFound.id,
            name: null,
            phone,
            email: null,
            status: true,
          },
          200
        );
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
}

export default UserController;
