const filevalidate = (file) => {

  var ext = file.originalname.split(".").pop();
  if (ext !== 'png' && ext !== 'jpg' && ext !== 'gif' && ext !== 'jpeg') {

    return false
  }
  return true
};
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const User = require("../models/user");
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

const storage = new Storage({
  projectId: "capstone-5e12b",
  keyFilename: "./config/firebase.json"
});
const bucket = storage.bucket("capstone-5e12b.appspot.com");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
  },
  fileFilter: function (req, file, callback) {
    var ext = file.originalname.split(".").pop();
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'gif' && ext !== 'jpeg') {
     callback(null,false)
    }
    callback(null, true)
  },
 
});
 
// @param { File } file 
 async function uploadImageToStorage(file){
   return await new Promise((resolve, reject) => {
    console.log("call")
    if (!file) {
      reject('No image file');
    }
    let newFileName = `${file.originalname}_${Date.now()}`;

    let fileUpload = bucket.file(newFileName);
    
   
    
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      reject('Something is wrong! Unable to upload at the moment.'+error);
    });

    blobStream.on('finish', () => {
      
      // The public URL can be used to directly access the file via HTTP.
      const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      fileUpload.makePublic(function (err, apiResponse) {
        
      })
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
}


router.post("/register", (req, res) => {
 
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
    
    res.json({ user: req.user });
  }
);

router.post('/upload', passport.authenticate("jwt", { session: false }), upload.single('file'), (req, res) => {
 
  let file = req.file;
  
  const user = JSON.parse(req.body.user)
  console.log(user)
  
  if (file) {
    if (!filevalidate) {
      return res.status(400).json({ "mess": "please image only" })
    }

    else {
      uploadImageToStorage(file).then((success) => {
        user.userDetails.profileImg = success
       
           if (user.userDetails.contactNumber && user.userDetails.contactNumber.length !== 10) {
              return res.status(400).json({ success: false, msg: "enter 10 digit or leave it blank" })
            }
  User.findByIdAndUpdate(user.id,
    {name: user.name,
    userDetails: {
    ...user.userDetails
  }}, function (err, doc) {

      if (err) {

        return res.status(400).json({ success: false, msg: "something thing wrong" })

      } else {

        return res.json({ message: 'user updated !'  })

      }

    })
       
      }).catch((error) => {
        return res.status(400).json({ "success": false, msg: error })
      });
    }
  }
  else {
  
  if (user.userDetails.contactNumber && user.userDetails.contactNumber.length !== 10) {
    return res.status(400).json({ success: false, msg: "enter 10 digit or leave it blank" })
  }
  User.findByIdAndUpdate(user.id,
    {
      name: user.name,
      userDetails: {
        ...user.userDetails
      }
    }, function (err, doc) {

      if (err) {

        return res.status(400).json({ success: false, msg: "something thing wrong" })

      } else {

        return res.json({ message: 'user updated !' })

      }

    })
  }
});


module.exports = router;
