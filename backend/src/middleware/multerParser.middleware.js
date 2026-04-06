import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const parseFormData = upload.none(); 