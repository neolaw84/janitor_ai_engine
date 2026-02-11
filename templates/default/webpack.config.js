const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env) => {
  const projectDir = env.project
    ? path.resolve(__dirname, env.project)
    : path.resolve(__dirname, ".");

  const distDir = path.resolve(projectDir, "dist");

  const createConfig = (filename, minimize) => ({
    mode: minimize ? "production" : "none",
    entry: "./src/entry.js",
    output: {
      path: distDir,
      filename: filename,
    },
    resolve: {
      alias: {
        "user-config": path.resolve(projectDir, "src/user_defined/script_def.js"),
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      ie: "11", // Enforce ES5
                    },
                    useBuiltIns: false,
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.(txt|md)$/i,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: '"use worker;";',
        raw: true,
        entryOnly: true,
      }),
    ],
    optimization: {
      minimize: minimize,
      minimizer: minimize
        ? [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              format: {
                comments: false,
              },
            },
          }),
        ]
        : [],
    },
  });

  return [
    createConfig("effective_script.js", false),
    createConfig("effective_script_min.js", true),
  ];
};
