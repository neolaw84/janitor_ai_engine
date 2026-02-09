const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
    const projectDir = env.project ? path.resolve(__dirname, env.project) : path.resolve(__dirname, 'data/toy-example');

    return {
        mode: 'none',
        entry: './src/entry.js',
        output: {
            path: projectDir,
            filename: 'effective_script.js',
        },
        resolve: {
            alias: {
                'user-config': path.resolve(projectDir, 'script_def.js'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            ie: '11', // Enforce ES5
                                        },
                                        useBuiltIns: false,
                                    },
                                ],
                            ],
                        },
                    },
                },
            ],
        },
        optimization: {
            minimize: false,
        },
    };
};
