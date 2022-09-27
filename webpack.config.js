const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path')

module.exports = {
    resolve: {
        fallback: {
            "fs": false,
            "tls": false,
            "net": false,
            "path": false,
            "zlib": false,
            "http": false,
            "https": false,
            "stream": false,
            "crypto": false,
            "crypto-browserify": require.resolve('crypto-browserify'), //if you want to use this module also don't forget npm i crypto-browserify 
            "timers":require.resolve('timers-browserify'),
            "os": require.resolve("os-browserify/browser"),
        } 
    },
    experiments: {
        topLevelAwait: true
    },
    watch: true,
    entry: {
        index: './src/index.js',
        edit: './src/edit.js',
        article: './src/article.js',
        addRecipe: './src/addRecipe.js',
        icons: './src/icons.js',
    },
    output: {
        path: path.resolve(__dirname, 'public/scripts'),
        filename: '[name]-bundle.js'
    },
    plugins: [
        new MiniCssExtractPlugin()
    ],
    module: {

        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ],
                        plugins: [
                            'transform-object-rest-spread'
                        ]
                    }
                }
            },
            {
                test: /\.(s[ac]|c)ss$/i,
                use: [
                    // fallback to style-loader in development
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public')
        },
        devMiddleware: {
            publicPath: '/scripts/'
        }
    },
    devtool: 'source-map',
}