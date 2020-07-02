const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    context: path.resolve(__dirname, '../'),
    devServer: {
        port: 8000,
        hot: true,
        contentBase: false,
        compress: true,
        open: true,
        publicPath: '/',
        proxy: {
            '/api': {
                target: 'http://cgers.art',
                changeOrigin: true
            }
        }
    },
    devtool: 'eval',
    mode: 'development',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: './js/[name].bundle.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"development"',
                WEB_SITE: '"3dcger.cn"'
            }
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: './src/favicon.ico',
            inject: true
        }),
        // new CopyWebpackPlugin([
        //     {
        //         from: './src/js',
        //         to: 'js'
        //     }
        // ])
    ],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}