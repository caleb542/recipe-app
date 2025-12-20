const webpack = require("webpack");
const dotenv = require("dotenv");
dotenv.config();

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  
  return {
    mode: argv.mode,
    
    // Enable watch mode for development
    watch: isDevelopment,
    
    // UNCOMMENT AND FIX WATCH OPTIONS
    watchOptions: {
      ignored: [
        '**/node_modules/**',
        '**/public/scripts/**',  // Don't watch webpack output!
        '**/public/partials/**', // Don't watch copied files
      ],
      aggregateTimeout: 300,
      poll: 1000  // CHANGED from false to 1000 - helps with detection
    },
    
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
      topLevelAwait: true,
      outputModule: true
    },

    entry: {
      index: "./src/index.js",
      edit: "./src/edit.js",
      article: "./src/article.js",
      profile: "./src/profile.js",
      addRecipe: "./src/addRecipe.js",
      icons: "./src/icons.js"
    },
    
    output: {
      path: path.resolve(__dirname, "public/scripts"),
      filename: "[name]-bundle.js?[contenthash]",
      clean: true,
      library: { type: "module" }
    },
    
    plugins: [
      new HtmlWebpackPlugin({ 
        template: "./public/index.html",
        inject: false // Don't auto-inject scripts (you handle manually)
      }),
      new MiniCssExtractPlugin({ 
        filename: "[name].css" 
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/partials", to: "../partials" },
        ]
      }),
      new webpack.DefinePlugin({
        "process.env.AUTH0_DOMAIN": JSON.stringify(process.env.AUTH0_DOMAIN),
        "process.env.AUTH0_CLIENT_ID": JSON.stringify(process.env.AUTH0_CLIENT_ID),
        "process.env.AUTH0_AUDIENCE": JSON.stringify(process.env.AUTH0_AUDIENCE),
        "process.env.UNSPLASH_ACCESS_KEY": JSON.stringify(process.env.UNSPLASH_ACCESS_KEY),
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
  static: {
    directory: path.join(__dirname, "public"),
    watch: {
      ignored: [
        path.resolve(__dirname, 'public/scripts/**'),
        path.resolve(__dirname, 'public/partials/**'),
      ]
    }
  },
  allowedHosts: 'all',
  
  devMiddleware: { 
    publicPath: "/scripts/",
    writeToDisk: true,
    // ADD THIS - disable all caching in dev
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  },
  
  hot: false,
  liveReload: false,
  historyApiFallback: true,
  open: false,
  port: 8888,
  
  // ADD THIS TOO
  client: {
    overlay: {
      errors: true,
      warnings: false,
    },
  },
  
  watchFiles: {
    paths: [
      'src/**/*.js',
      'src/**/*.scss',
      'src/partials/**/*.html',
      'public/*.html'
    ],
    options: {
      ignored: ['**/node_modules/**']
    }
  },
},
    
    devtool: isDevelopment ? "eval-source-map" : "source-map"
  };
};