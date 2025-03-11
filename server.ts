import express, { Request, Response } from "express";
import multer from "multer";
import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import File from "./models/File";

const router = express.Router();

// Define a CSV row structure
interface CSVRow {
  name: string;
  email: string;
}

// Multer storage settings
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload CSV Route
router.post("/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const filePath = path.join(__dirname, "..", req.file.path);
    const results: CSVRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          const newFile = new File({
            filename: req.file?.filename,
            data: results,
          });

          await newFile.save();
          res.status(200).json({ message: "File uploaded and processed", data: newFile });
          resolve();
        })
        .on("error", (err) => reject(err));
    });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Get paginated data
router.get("/data", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, search = "" } = req.query;
    const pageSize = 10;

    const query = search
      ? { "data.name": { $regex: search as string, $options: "i" } }
      : {};

    const files = await File.find(query)
      .skip((Number(page) - 1) * pageSize)
      .limit(pageSize);

    res.json({ records: files });
    return; // Ensures the function returns void
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
