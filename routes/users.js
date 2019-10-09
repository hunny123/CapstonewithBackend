const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const User = require("../models/user");

router.post("/register", (req, res) => {
  console.log(req.body);
  if (req.body.password !== req.body.confirmpassword) {
    res.status(400).json({ success: false, msg: "Passwords do not match." });
    return;
  }

  let newUser = new User({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role
  });

  newUser.save(err => {
    if (err) {
      if (err.errors) {
        if (err.errors.name) {
          res
            .status(400)
            .json({ success: false, msg: err.errors.name.message });
          return;
        }

        if (err.errors.email) {
          res
            .status(400)
            .json({ success: false, msg: err.errors.email.message });
          return;
        }

        if (err.errors.username) {
          res
            .status(400)
            .json({ success: false, msg: err.errors.username.message });
          return;
        }

        if (err.errors.password) {
          res
            .status(400)
            .json({ success: false, msg: err.errors.password.message });
          return;
        }

        // Show failed if all else fails for some reasons
        res.status(400).json({ success: false, msg: "Failed to register." });
      }
    } else {
      res.json({ success: true, msg: "User successfully registered." });
    }
  });
});

router.post("/login", (req, res) => {
  console.log(req.body);
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ username: username }, (err, user) => {
    if (err) throw err;

    if (!user) {
      return res.status(400).json({ success: false, msg: "User not found." });
    }

    bcrypt.compare(password, user.password, function(err, isMatch) {
      if (err) throw err;

      if (isMatch) {
        const token = jwt.sign(user, config.secret, {
          expiresIn: 604800 // 1 week
        });

        // Don't include the password in the returned user object
        return res.json({
          success: true,
          token: "JWT " + token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            userDetails: user.userDetails
          }
        });
      } else {
        return res.status(400).json({ success: false, msg: "Wrong password." });
      }
    });
  });
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),

  (req, res) => {
    console.log(req.headers);
    res.json({ user: req.user });
  }
);
router.post(
  "/update",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.body.userDetails.contactNumber && req.body.userDetails.contactNumber.length!==10 ) {
      return res.status(400).json({ success: false, msg: "enter 10 digit or leave it blank" })
    }
    
   
    // use user model to find the user 
    User.findByIdAndUpdate(req.body.id ,
      {
       
        userDetails:req.body.userDetails
        
      }, function (err, doc) {

        if (err) {
        
          return res.status(400).json({ success: false, msg: "something thing wrong" })

        } else {
          
         return res.json({ message: 'user updated!'})

        }

      });

  }
);

module.exports = router;
