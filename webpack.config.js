const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './backend/index.js', // Adjust this to your entry point
    output: {
        filename: 'bundle.js', // Output filename
        path: path.resolve(__dirname, 'dist'), // Output path
        publicPath: '/', // Base path for assets
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Use Babel to transpile ES6
                },
            },
            // Add additional loaders as necessary
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.PUBLIC_URL': JSON.stringify('https://teamappgr.github.io/team') // Define PUBLIC_URL
        }),
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'), // Directory for static files
        compress: true,
        port: 9000, // Change this to your desired port
    },
};
