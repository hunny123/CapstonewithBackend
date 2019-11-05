const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const Service = require("../models/service");
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

router.post("/add_service", (req, res) => {
  console.log(req.body);

  let newService = new Service({
    name: req.body.name,
    photo_url: req.body.url,
    area: req.body.area,
    description: req.body.desc,
    provider: req.body.provider
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

        if (err.errors.area) {
          res
            .status(400)
            .json({ success: false, msg: err.errors.area.message });
          return;
        }

        if(err.errors.provider){
          res.status(400).json({
            success: false, msg: err.errors.provider.message
          });
        }

        // Show failed if all else fails for some reasons
        res.status(400).json({ success: false, msg: "Failed to add service." });
      }
    } else {
      res.json({ success: true, msg: "Service Added Successfully successfully registered." });
    }
  });
});

router.get("/services", (req, res) => {

  Service.find({}, (err, service) => {
    if (err) throw err;

    if (!service) {
      return res.status(400).json({ success: false, msg: "Service not found." });
    }
    return res.json(service);
  });
});

module.exports = router;
