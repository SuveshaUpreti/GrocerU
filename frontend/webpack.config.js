const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/',  // Required for HMR
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        host: '0.0.0.0',  // Accept connections from outside the container
        port: 3000,
        hot: true,
        liveReload: true,
        historyApiFallback: true,
        client: {
            webSocketURL: 'ws://localhost:3000/ws',  // Ensure WebSocket URL is set
        },
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react', '@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};