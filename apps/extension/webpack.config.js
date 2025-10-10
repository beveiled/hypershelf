import { resolve as _resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import tailwindPlugin from "@tailwindcss/postcss";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import webpack from "webpack";
import { merge } from "webpack-merge";

const __filename = fileURLToPath(import.meta.url);
const __dirname_ = dirname(__filename);
const dist = _resolve(__dirname_, "dist");

const resolveCfg = {
  extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"],
  plugins: [
    new TsconfigPathsPlugin({
      configFile: join(__dirname_, "tsconfig.json"),
    }),
  ],
};

const rules = [
  {
    test: /\.[tj]sx?$/,
    use: [
      {
        loader: "ts-loader",
        options: { transpileOnly: true },
      },
    ],
    exclude: /node_modules/,
  },
  {
    test: /\.css$/,
    use: [
      "style-loader",
      "css-loader",
      {
        loader: "postcss-loader",
        options: {
          postcssOptions: {
            plugins: [tailwindPlugin()],
          },
        },
      },
    ],
  },
];

const pluginsCommon = [
  new webpack.DefinePlugin({
    "process.env.PUBLIC_FRONTEND_URL": JSON.stringify(
      process.env.PUBLIC_FRONTEND_URL || "",
    ),
    "process.env.PUBLIC_CONVEX_BACKEND_URL": JSON.stringify(
      process.env.PUBLIC_CONVEX_BACKEND_URL || "",
    ),
    "process.env.PUBLIC_CONVEX_SITE_URL": JSON.stringify(
      process.env.PUBLIC_CONVEX_SITE_URL || "",
    ),
    "process.env.VSPHERE_HOSTNAME": JSON.stringify(
      process.env.VSPHERE_HOSTNAME || "",
    ),
  }),
  new ForkTsCheckerWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [{ from: _resolve(__dirname_, "manifest.json"), to: dist }],
  }),
];

/** @type {import('webpack').Configuration} */
const common = {
  context: __dirname_,
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  devtool:
    process.env.NODE_ENV === "development"
      ? "eval-cheap-module-source-map"
      : false,
  resolve: resolveCfg,
  module: { rules },
  target: ["web", "es2020"],
  stats: "errors-warnings",
};

const background = merge(common, {
  entry: _resolve(__dirname_, "src/background/index.ts"),
  output: {
    path: dist,
    filename: "background/index.js",
    chunkFilename: "assets/[name].js",
    assetModuleFilename: "assets/[name][ext]",
    module: true,
  },
  experiments: { outputModule: true },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ascii_only: true,
          },
        },
      }),
    ],
  },
  plugins: [...pluginsCommon],
});

const content = merge(common, {
  entry: _resolve(__dirname_, "src/content/index.tsx"),
  output: {
    path: dist,
    filename: "content/vsphere.js",
    chunkFilename: "assets/[name].js",
    assetModuleFilename: "assets/[name][ext]",
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ascii_only: true,
          },
        },
      }),
    ],
  },
  plugins: [
    ...pluginsCommon,
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
});

const config = [background, content];
export default config;
