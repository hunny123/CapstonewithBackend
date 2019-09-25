const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://krishna:12345@capstone01-hovcz.mongodb.net/test?retryWrites=true&w=majority",{ useNewUrlParser: true }).then(()=>console.log("connected"))
.catch(err=>console.log(err));