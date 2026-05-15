const User = require("../models/userSchema");
//build safe path
const path = require("path"); 
//File system to read or delete files
const fs = require("fs"); 
// image processing (resize/compress)
const sharp = require("sharp"); 


const getAllUsers = async (req, res) => {
  try {
    // query params
    const {
      search,
      role,
      isBanned,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    //Query object
    const query = {}; 

    //Search to match regex
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // filter by role (user/admin)
    if (role) {
      query.role = role;
    }

    // convert string to boolean for filtering banned users
    if (isBanned !== undefined) {
      query.isBanned = isBanned === "true";
    }

    // only allow safe fields to sort by
    const allowedSortFields = ["username", "email", "eloRating", "createdAt", "age"];
    const chosenSortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    // MongoDB format: asc = 1, desc = -1
    const sortDirection = order === "asc" ? 1 : -1;

    // pagination logic
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (currentPage - 1) * pageSize;

    // total number of matching users (for pagination)
    const totalUsers = await User.countDocuments(query);

    // actual query
    const users = await User.find(query)
      .select("-password") 
      .sort({ [chosenSortField]: sortDirection })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      pagination: {
        totalItems: totalUsers,
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalUsers / pageSize)
      },
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
      error: error.message
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    //find user
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // only the user or admin can view
    const isOwner = req.user && req.user.userId === user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user.",
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, age } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // only owner or admin can update
    const isOwner = req.user && req.user.userId === user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    // update fields only if provided
    if (email !== undefined) {
      user.email = email;
    }

    if (age !== undefined) {
      // enforce age rule
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "User must be at least 18 years old."
        });
      }
      user.age = age;
    }

    if (password !== undefined) {
      //will hash later
      user.password = password; 
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        eloRating: updatedUser.eloRating,
        role: updatedUser.role,
        isBanned: updatedUser.isBanned,
        trophies: updatedUser.trophies,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
      error: error.message
    });
  }
};


const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // only owner or admin
    const isOwner = req.user && req.user.userId === user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded."
      });
    }

    // original uploaded file
    const originalPath = req.file.path;

    // new compressed file name
    const compressedFilename = `compressed-${Date.now()}.webp`;

    // create path for compressed file
    const compressedPath = path.join(
      path.dirname(originalPath),
      compressedFilename
    );

    // resize image
    await sharp(originalPath)
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(compressedPath);

    // delete original uploaded file
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    // delete old profile image
    if (
      user.profileImage &&
      user.profileImage.startsWith("/uploads/profile-images/")
    ) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        user.profileImage.replace(/^\//, "")
      );

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // save new image path in DB
    user.profileImage = `/uploads/profile-images/${compressedFilename}`;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload profile image.",
      error: error.message
    });
  }
};


const banUser = async (req, res) => {
  try {
    // only admin allowed
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const { id } = req.params;
    const { isBanned } = req.body;

    // ensure boolean input
    if (typeof isBanned !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isBanned must be a boolean value."
      });
    }

    // update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isBanned },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: isBanned
        ? "User banned successfully."
        : "User unbanned successfully.",
      data: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update ban status.",
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  banUser,
  uploadProfileImage
};