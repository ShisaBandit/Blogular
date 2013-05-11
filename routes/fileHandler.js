var fs = require('fs');
exports.upload = function (req, res) {
    var name = req.files.file.name;
    fs.readFile(req.files.file.path, function (err, data) {
        var newPath = global.__approot + "/public/uploads/" + name;
        console.log(newPath);
        fs.writeFile(newPath, data, function (err) {
            if(err)console.log(err);res.send(401,'error');
            //res.send(200,{'success': 'true'});
            res.redirect('back');
        });
    });
};