const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env) => {
  const projectDir = env.project
    ? path.resolve(__dirname, env.project)
    : path.resolve(__dirname, "data/toy-example");

  const createConfig = (filename, minimize) => ({
    mode: minimize ? "production" : "none",
    entry: "./src/entry.js",
    output: {
      path: projectDir,
      filename: filename,
    },
    resolve: {
      alias: {
        "user-config": path.resolve(projectDir, "script_def.js"),
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
