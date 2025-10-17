const path =  require('path');
const fs = require('fs');

const deleteImage = (filePath) => {
    if(!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${fullPath}`);
        
    }
}
module.exports = { deleteImage };
