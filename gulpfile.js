var pkg = require('./package');

var gulp = require('gulp');

// https://github.com/shama/webpack-stream
var webpack = require('webpack');
var webpackStream = require('webpack-stream');

// https://www.npmjs.com/package/gulp-rename/
var rename = require("gulp-rename");

// https://www.npmjs.com/package/gulp-uglify/
var uglify = require('gulp-uglify');

// https://www.npmjs.com/package/del
var del = require('del');

// http://browsersync.io/
var browserSync = require('browser-sync');

// pack natty-db.js and test.js
gulp.task('pack', ['del-dist'], function() {
    return gulp.src('src/index.js').pipe(webpackStream({
        output: {
            // 不要配置path，会报错
            //path: 'dist',
            filename: 'natty-db.js',
            sourceMapFilename: 'natty-db.js.map',
            sourcePrefix: '',

            // 下面两个配置项说明`webpack`的最佳实战是: 只设置唯一的`entry`, 这好和`gulp`的约定完美对接
            library: 'NattyDB',
            libraryTarget: 'umd'
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
        },
        externals:  {
            //rsvp: 'commonjs rsvp' // modules.export = require('rsvp');
            rsvp: 'var RSVP' // modules.export = RSVP;
        },
        plugins: [
            new webpack.DefinePlugin({
                '__BUILD_VERSION__': 'VERSION = "' + pkg.version + '"'
            })
        ]
    })).pipe(gulp.dest('./dist'));
});

gulp.task('test-pack', ['del-test-dist'], function() {
    return gulp.src('./test-src/global.spec.js').pipe(webpackStream({
        output: {
            // 不要配置path，会报错
            //path: 'dist',
            filename: 'test.js',
            sourceMapFilename: 'test.js.map',
            sourcePrefix: ''
        },
        // 这个配置要和 output.sourceMapFilename 一起使用
        devtool: '#source-map',
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader?stage=1'
                },{
                    test: /test-src\/[a-zA-Z0-9]+\.spec\.js/,
                    loaders: ['mocha', 'babel-loader?stage=1'] // mocha必须写在babel之前 没想通
                }
            ]
        },
        externals:  {
            'natty-db': 'var NattyDB' // 相当于 modules.export = NattyDB;
        }
    })).pipe(gulp.dest('./test-dist'));
});

gulp.task('del-dist', function (done) {
    del(['dist']).then(function () {
        done();
    });
});

gulp.task('del-test-dist', function (done) {
    del(['test-dist']).then(function () {
        done();
    });
});

gulp.task('min', function () {
    return gulp.src('dist/*.js').pipe(uglify()).pipe(rename(function (path) {
        path.basename += '.min';
    })).pipe(gulp.dest('./dist'));
});

gulp.task('reload-by-src', ['pack'], function () {
    browserSync.reload();
});

gulp.task('reload-by-test', ['test-pack'], function () {
    browserSync.reload();
});

// 启动监听
gulp.task('watch', ['pack', 'test-pack'], function () {

    browserSync({
        server: {
            baseDir: './'
        },
        notify: false
    });

    gulp.watch([
        'src/**/*.js'
    ], ['reload-by-src']);

    gulp.watch([
        'test-src/**/*.js'
    ], ['reload-by-test']);
});