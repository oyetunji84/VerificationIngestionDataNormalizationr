const axios = require('axios');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB size limit for images


const isURL = (value) => {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasDataURI = (value) =>
  typeof value === "string" && value.startsWith("data:image");

const isRawBase64 = (value) =>
  typeof value === "string" &&
  !value.startsWith("data:") &&
  /^[A-Za-z0-9+/]+={0,2}$/.test(value);

const safeFetchAsBase64 = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const buffer = Buffer.from(response.data);

    if (buffer.length > MAX_SIZE) {
      throw new Error("Image exceeds size limit");
    }

    const base64 = buffer.toString("base64");
    const contentType = response.headers["content-type"] || "image/jpeg";

    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      console.error("Image fetch timeout:", url);
    } else if (err.response) {
      console.error("Image fetch failed with status:", err.response.status);
    } else if (err.request) {
      console.error("No response received from image URL:", url);
    } else {
      console.error("Unexpected image fetch error:", err.message);
    }

    return null;
  }
};

const normalizeImage = async (image) => {
  if (!image) return null;

  try {
    if (hasDataURI(image)) {
      return image;
    }

    if (isRawBase64(image)) {
      return `data:image/jpeg;base64,${image}`;
    }

    if (isURL(image)) {
      return await safeFetchAsBase64(image);
    }

    return null;
  } catch (err) {
    console.error("Image normalization error:", err.message);
    return null;
  }
};

module.exports = { normalizeImage };
