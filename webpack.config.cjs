const webpack = require("webpack");
const dotenv = require("dotenv");
dotenv.config();

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (env, argv) => {
  return {
    resolve: {
      extensions: [".js"],
      fallback: {
        fs: false,
        tls: false,
        net: false,
        path: false,
        zlib: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        "crypto-browserify": require.resolve("crypto-browserify"),
        timers: require.resolve("timers-browserify"),
        os: require.resolve("os-browserify/browser")
      }
    },

    ignoreWarnings: [/legacy JS API/],

    experiments: {
      topLevelAwait: true
    },

    entry: {
      index: "./src/index.js",
      // auth: "./src/auth/index.js",   // ← use a bootstrap entry
      edit: "./src/edit.js",
      article: "./src/article.js",
      addRecipe: "./src/addRecipe.js",
      icons: "./src/icons.js"
    },
    output: {
      path: path.resolve(__dirname, "public/scripts"),
      filename: "[name]-bundle.js",
      clean: true,
      library: { type: "module" }
    },
    experiments: {
      topLevelAwait: true,
      outputModule: true
    },
    plugins: [
      new HtmlWebpackPlugin({ template: "./public/index.html" }),
      new MiniCssExtractPlugin({ filename: "[name].css" }),
      new CopyWebpackPlugin({
        patterns: [
        { from: "src/partials", to: "../partials" },
       
      ]
      }),
      new webpack.DefinePlugin({
        "process.env.AUTH0_DOMAIN": JSON.stringify(process.env.AUTH0_DOMAIN),
        "process.env.AUTH0_CLIENT_ID": JSON.stringify(process.env.AUTH0_CLIENT_ID),
         "process.env.AUTH0_AUDIENCE": JSON.stringify(process.env.AUTH0_AUDIENCE),
      }),
    ],
    module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: { presets: ["@babel/preset-env"] }
      }
    },
    {
      test: /\.scss$/i,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader",
        {
          loader: "sass-loader",
          options: {
            implementation: require("sass"),
            sassOptions: { quietDeps: true }
          }
        }
      ]
    },
    {
      test: /\.css$/i,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader"
      ]
    }
  ]
},

    devServer: {
      static: { directory: path.join(__dirname, "public") },
      devMiddleware: { publicPath: "/scripts/" },
      hot: true,
      liveReload: true,
      historyApiFallback: true,
      open: false,
      port: 8888
    },

    devtool: argv.mode === "development" ? "eval-source-map" : "source-map",
    mode: argv.mode
  };
};
