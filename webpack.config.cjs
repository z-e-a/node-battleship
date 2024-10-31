const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src", "index.ts"),
  target: "node",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: "ts-loader",
      },
    ],
  },
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
};
