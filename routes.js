"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const File_1 = __importDefault(require("./models/File"));
const router = express_1.default.Router();
// Multer storage settings
const storage = multer_1.default.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// Upload CSV Route
router.post("/upload", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        const filePath = path_1.default.join(__dirname, "..", req.file.path);
        const results = [];
        yield new Promise((resolve, reject) => {
            fs_1.default.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on("data", (data) => results.push(data))
                .on("end", () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const newFile = new File_1.default({
                    filename: (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename,
                    data: results,
                });
                yield newFile.save();
                res.status(200).json({ message: "File uploaded and processed", data: newFile });
                resolve();
            }))
                .on("error", (err) => reject(err));
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}));
// Get paginated data
router.get("/data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, search = "" } = req.query;
        const pageSize = 10;
        const query = search
            ? { "data.name": { $regex: search, $options: "i" } }
            : {};
        const files = yield File_1.default.find(query)
            .skip((Number(page) - 1) * pageSize)
            .limit(pageSize);
        res.json({ records: files });
        return; // Ensures the function returns void
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}));
exports.default = router;
