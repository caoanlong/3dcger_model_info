const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

const platform = process.env.npm_config_platform
let WEB_SITE = '"cgers.art"', STATIC_URL = '"http://static.cgers.art/"'
if (platform === 'cn') {
    WEB_SITE = '"3dcger.cn"'
    STATIC_URL = '"http://static.3dcger.cn/"'
} else if (platform == 'com') {
    WEB_SITE = '"3dcger.com"'
    STATIC_URL = '"http://static.3dcger.com/"'
}

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
                WEB_SITE: WEB_SITE,
                STATIC_URL: STATIC_URL
            }
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: './src/favicon.ico',
            inject: true
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: './src/imgs', to: 'imgs' }]
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