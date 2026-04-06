const fs = require('fs');
const path = require('path');

class FileResolver {

    constructor() {
        this.newBasePath = process.env.SAN_FILE_PATH;
        this.oldBasePath = process.env.file_path;
    }

    async resolve(relativePath, autoMigrate = false) {

        const newPath = path.join(this.newBasePath, relativePath);
        const oldPath = path.join(this.oldBasePath, relativePath);
        
        console.log(oldPath, newPath);
        // Checking new server first
        if (await this.fileExists(newPath)) {
            return newPath;
        }

        // Checking old server
        if (await this.fileExists(oldPath)) {

            // Optional: Auto migrate file if it exists on old server but not on new server
            if (autoMigrate) {
                await this.ensureDirectoryExists(path.dirname(newPath));
                await fs.promises.copyFile(oldPath, newPath);
                return newPath;
            }

            return oldPath;
        }

        throw new Error(`File not found in both servers: ${relativePath}`);
    }

    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async ensureDirectoryExists(dirPath) {
        await fs.promises.mkdir(dirPath, { recursive: true });
    }

    async getNewServerPath(relativePath) {
        return path.join(this.newBasePath, relativePath);
    }

    async delete(relativePath) {
        const safePath = this.sanitize(relativePath);

        const newPath = path.join(this.newBasePath, safePath);
        const oldPath = path.join(this.oldBasePath, safePath);

        await this.deleteIfExists(newPath);
        await this.deleteIfExists(oldPath);
    }

    async deleteIfExists(filePath) {
        try {
            await fs.promises.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
        } catch (err) {
            if (err.code !== "ENOENT") {
                throw err;
            }
        }
    }

    async readFile(relativePath, autoMigrate = false) {
        const fullPath = await this.resolve(relativePath, autoMigrate);
        return fs.promises.readFile(fullPath);
    }
}

module.exports = new FileResolver();