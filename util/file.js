const fs = require('fs');

const deleteFile = filePath => {
  fs.unlink(filePath, err => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;

// module.exports = {
//   deleteFile: deleteFile
// }
// ...or....
// module.exports = {
// deleteFile
// }
