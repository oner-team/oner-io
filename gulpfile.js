var gulp = require('gulp');

// https://github.com/shama/webpack-stream
var webpack = require('webpack-stream');

// https://www.npmjs.com/package/gulp-rename/
var rename = require("gulp-rename");

// https://www.npmjs.com/package/gulp-uglify/
var uglify = require('gulp-uglify');

// 打包
gulp.task('pack', function() {
    return gulp.src('src/index.js')
        .pipe(webpack({
        output: {
            // 不要配置path，会报错
            //path: 'dist',
            filename: 'natty-db.js',
            sourceMapFilename: 'natty-db.js.map'
        },
        // 这个配置要和 output.sourceMapFilename 一起使用
        devtool: '#source-map',
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader?stage=1'
                }
            ]
        }
    })).pipe(gulp.dest('./dist'));
});

gulp.task('min', function (done) {
    gulp.src('dist/*.js')
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += '-min';
        }))
        .pipe(gulp.dest('./dist'))
});

// gulp 和 karma 的整合
// karma 官方说根本不需要专门为 gulp 开发插件，因为 karma 的 publick API 足够简单，
// 使用者完全可以直接调用，官方也给出了整合的 demo：
// https://github.com/karma-runner/gulp-karma
var KarmaServer = require('karma').Server;
gulp.task('test', function (done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

// 默认执行打包
gulp.task('default', ['pack', 'test']);

// 启动监听
gulp.task('watch', function () {
    gulp.watch([
        'src/**/*.js',
        'test/**/*.js'
    ], ['pack']);
});