import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exists: username, email
  //check for images, check for avatar
  //upload them to cloudinary avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  //extracting all the data points
  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  // check if the points are empty or not!
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //if the field is empty even after trim, then the field is empty!!
  ) {
    throw new ApiError(400, "All fields are required!"); //can use this beacuse of ApiErrors utils
  }

  //To check if the user already exists or not!
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //returns the first document that it encounters
  });

  if (existedUser) {
    throw new ApiError(409, "User with username/email already exists!");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //If everything is done successfully! Then create an object
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //if coverimage exists, then take the url else keep it blank, as coverimage is not compulsory under model
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    //check for user creation
    "-password -refreshToken"
  );

  if (!createdUser) {
    //here it is checked!
    throw new ApiError(500, "Something went wrong while registering the user!");
  }
  //If user is created then set status 201 and return the message
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

export { registerUser };
