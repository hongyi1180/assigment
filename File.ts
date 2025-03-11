import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  filename: String,
  data: [
    {
      name: String,
      email: String,
    },
  ],
});

const File = mongoose.model("File", FileSchema);
export default File;
