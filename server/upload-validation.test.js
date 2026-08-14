import test from "node:test";
import assert from "node:assert/strict";

const validSignatures = {
  ".jpg": (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  ".png": (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".webp": (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP",
  ".gif": (buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString()),
  ".pdf": (buffer) => buffer.subarray(0, 5).toString() === "%PDF-",
  ".mp4": (buffer) => buffer.subarray(4, 8).toString() === "ftyp",
};

test("accepted upload signatures match real file headers", () => {
  assert.equal(validSignatures[".jpg"](Buffer.from([0xff, 0xd8, 0xff])), true);
  assert.equal(validSignatures[".png"](Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(validSignatures[".webp"](Buffer.from("RIFFxxxxWEBP")), true);
  assert.equal(validSignatures[".gif"](Buffer.from("GIF89a")), true);
  assert.equal(validSignatures[".pdf"](Buffer.from("%PDF-1.7")), true);
  assert.equal(validSignatures[".mp4"](Buffer.from("xxxxftypisom")), true);
});

test("fake image content is rejected", () => {
  assert.equal(validSignatures[".jpg"](Buffer.from("plain text")), false);
  assert.equal(validSignatures[".png"](Buffer.from("plain text")), false);
});
