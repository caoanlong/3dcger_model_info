const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

module.exports = {
    mode: 'production',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: './js/[name].bundle.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"',
                WEB_SITE: '"3dcger.cn"'
            }
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: './src/favicon.ico',
            inject: true
        }),
        new CompressionWebpackPlugin({
            filename: '[path].gz[query]',
            algorithm: 'gzip',
            test: new RegExp('\\.([js|css])$'),
            threshold: 10240,
            minRatio: 0.8
        })
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